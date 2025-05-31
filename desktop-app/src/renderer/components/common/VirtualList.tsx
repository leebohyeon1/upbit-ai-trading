import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Box } from '@mui/material';
import { throttle } from '../../utils/optimizationUtils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  height?: string | number;
  width?: string | number;
  getItemKey?: (item: T, index: number) => string | number;
}

function VirtualListComponent<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  height = '100%',
  width = '100%',
  getItemKey
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 보이는 아이템 계산
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // 스크롤 핸들러 (throttled)
  const handleScroll = useCallback(
    throttle(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    }, 16), // 60fps
    []
  );

  // 컨테이너 크기 관찰
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        height,
        width,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <Box
          sx={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getItemKey 
              ? getItemKey(item, actualIndex) 
              : `virtual-item-${startIndex}-${actualIndex}`;
            
            return (
              <Box
                key={key}
                sx={{
                  height: itemHeight,
                  position: 'absolute',
                  top: index * itemHeight,
                  left: 0,
                  right: 0
                }}
              >
                {renderItem(item, actualIndex)}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// Type-safe memo wrapper for generic component
export const VirtualList = memo(VirtualListComponent) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;