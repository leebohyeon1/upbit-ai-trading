import { useEffect, useRef, useCallback, useState } from 'react';
import { throttle } from '../utils/optimizationUtils';

interface WebSocketOptions {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  throttleMs?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useWebSocket({
  url,
  onOpen,
  onClose,
  onError,
  onMessage,
  reconnect = true,
  reconnectInterval = 3000,
  reconnectAttempts = 5,
  throttleMs = 0
}: WebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null
  });

  // Throttled message handler
  const throttledOnMessage = useCallback(
    throttleMs > 0 && onMessage
      ? throttle(onMessage, throttleMs)
      : onMessage || (() => {}),
    [onMessage, throttleMs]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState({ connected: true, connecting: false, error: null });
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false }));
        wsRef.current = null;
        onClose?.();

        // 자동 재연결
        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          error: new Error('WebSocket connection error'),
          connecting: false 
        }));
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          throttledOnMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      setState({
        connected: false,
        connecting: false,
        error: error as Error
      });
    }
  }, [url, onOpen, onClose, onError, throttledOnMessage, reconnect, reconnectInterval, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState({
      connected: false,
      connecting: false,
      error: null
    });
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // 초기 연결
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
      // throttled 함수 cleanup
      if (throttledOnMessage && typeof throttledOnMessage === 'function' && 'cancel' in throttledOnMessage) {
        (throttledOnMessage as any).cancel?.();
      }
    };
  }, [connect, disconnect, throttledOnMessage]);

  return {
    ...state,
    send,
    connect,
    disconnect
  };
}