import { useEffect, useRef, useState, useCallback } from 'react';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
  onLoad?: () => void;
}

export function useLazyLoad<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '50px',
  root = null,
  onLoad
}: LazyLoadOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const targetRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!targetRef.current || hasLoaded) return;

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          onLoad?.();
          disconnect();
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, {
      threshold,
      rootMargin,
      root
    });

    observerRef.current.observe(targetRef.current);

    return () => {
      disconnect();
    };
  }, [threshold, rootMargin, root, hasLoaded, onLoad, disconnect]);

  return {
    ref: targetRef,
    isVisible,
    hasLoaded
  };
}

// 이미지 lazy loading을 위한 특화 훅
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { ref, isVisible } = useLazyLoad<HTMLImageElement>({
    onLoad: () => {
      setIsLoading(true);
    }
  });

  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };
    
    img.src = src;
  }, [isVisible, src]);

  return {
    ref,
    src: imageSrc,
    isLoading,
    error
  };
}