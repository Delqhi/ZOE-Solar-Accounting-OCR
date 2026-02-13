/**
 * 2026 GLASSMORPHISM 2.0 - VIRTUALIZATION SYSTEM
 * High-performance virtualization for large lists and infinite scrolling
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useResizeObserver } from './useResizeObserver';

export interface VirtualizationItem<T> {
  id: string | number;
  data: T;
  height?: number;
  estimatedHeight?: number;
}

export interface VirtualizationConfig {
  itemHeight?: number;
  estimatedItemHeight?: number;
  overscan?: number;
  threshold?: number;
  bufferSize?: number;
  enableDynamicHeight?: boolean;
  enableInfiniteScroll?: boolean;
}

export interface VirtualizationState {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  scrollTop: number;
  isScrolling: boolean;
  visibleItems: VirtualizationItem<any>[];
  itemPositions: Map<string | number, { top: number; height: number }>;
}

export const useVirtualization = <T>(
  items: VirtualizationItem<T>[],
  config: VirtualizationConfig = {}
): VirtualizationState & {
  containerRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
} => {
  const {
    itemHeight = 80,
    estimatedItemHeight = 100,
    overscan = 5,
    threshold = 0.8,
    bufferSize = 100,
    enableDynamicHeight = true,
    enableInfiniteScroll = false
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<VirtualizationState>({
    startIndex: 0,
    endIndex: Math.min(items.length - 1, Math.ceil(bufferSize / itemHeight)),
    totalHeight: items.length * itemHeight,
    scrollTop: 0,
    isScrolling: false,
    visibleItems: [],
    itemPositions: new Map()
  });

  const itemPositions = useRef<Map<string | number, { top: number; height: number }>>(new Map());
  const isScrollingRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate item positions for dynamic heights
  const calculateItemPositions = useCallback(() => {
    if (!enableDynamicHeight) {
      // Static height calculation
      state.itemPositions.clear();
      let currentTop = 0;
      items.forEach((item, index) => {
        state.itemPositions.set(item.id, {
          top: currentTop,
          height: itemHeight
        });
        currentTop += itemHeight;
      });
      return currentTop;
    }

    // Dynamic height calculation
    let currentTop = 0;
    items.forEach((item, index) => {
      const height = item.height || item.estimatedHeight || estimatedItemHeight;
      state.itemPositions.set(item.id, {
        top: currentTop,
        height
      });
      currentTop += height;
    });
    return currentTop;
  }, [items, enableDynamicHeight, itemHeight, estimatedItemHeight]);

  // Get visible range
  const getVisibleRange = useCallback((scrollTop: number, containerHeight: number) => {
    const positions = enableDynamicHeight ? state.itemPositions : calculateItemPositions();

    let startIndex = 0;
    let endIndex = items.length - 1;

    if (enableDynamicHeight) {
      // Find start index using binary search for dynamic heights
      let left = 0;
      let right = items.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midItem = items[mid];
        const midPosition = positions.get(midItem.id);

        if (midPosition && midPosition.top < scrollTop) {
          startIndex = mid + 1;
          left = mid + 1;
        } else {
          endIndex = mid - 1;
          right = mid - 1;
        }
      }
    } else {
      // Static height calculation
      startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
    }

    return {
      startIndex: Math.max(0, startIndex),
      endIndex: Math.min(items.length - 1, endIndex)
    };
  }, [items, enableDynamicHeight, overscan, itemHeight, calculateItemPositions]);

  // Update virtualization state
  const updateVirtualization = useCallback((scrollTop: number) => {
    if (!containerRef.current) return;

    const containerHeight = containerRef.current.clientHeight;
    const totalHeight = calculateItemPositions();

    const { startIndex, endIndex } = getVisibleRange(scrollTop, containerHeight);

    const visibleItems = items.slice(startIndex, endIndex + 1);

    setState(prev => ({
      ...prev,
      startIndex,
      endIndex,
      totalHeight,
      scrollTop,
      visibleItems,
      itemPositions: new Map(state.itemPositions)
    }));

    // Handle infinite scroll
    if (enableInfiniteScroll && endIndex >= items.length - threshold * items.length) {
      // Trigger load more items
      // This would be handled by parent component
    }
  }, [items, getVisibleRange, calculateItemPositions, enableInfiniteScroll, threshold]);

  // Scroll handlers
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollTop = target.scrollTop;

    updateVirtualization(scrollTop);

    // Clear existing timeout
    if (isScrollingRef.current) {
      clearTimeout(isScrollingRef.current);
    }

    // Set scrolling state
    setState(prev => ({ ...prev, isScrolling: true }));

    // Clear scrolling state after delay
    isScrollingRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isScrolling: false }));
    }, 150);
  }, [updateVirtualization]);

  // Scroll to item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollContainerRef.current || !containerRef.current) return;

    const item = items[index];
    if (!item) return;

    const containerHeight = containerRef.current.clientHeight;
    let targetScrollTop = 0;

    if (enableDynamicHeight) {
      const position = state.itemPositions.get(item.id);
      if (position) {
        switch (align) {
          case 'center':
            targetScrollTop = position.top - containerHeight / 2 + position.height / 2;
            break;
          case 'end':
            targetScrollTop = position.top - containerHeight + position.height;
            break;
          default:
            targetScrollTop = position.top;
        }
      }
    } else {
      switch (align) {
        case 'center':
          targetScrollTop = index * itemHeight - containerHeight / 2 + itemHeight / 2;
          break;
        case 'end':
          targetScrollTop = index * itemHeight - containerHeight + itemHeight;
          break;
        default:
          targetScrollTop = index * itemHeight;
      }
    }

    targetScrollTop = Math.max(0, Math.min(targetScrollTop, state.totalHeight - containerHeight));

    scrollContainerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [items, enableDynamicHeight, itemHeight, state.itemPositions, state.totalHeight]);

  // Scroll to top/bottom
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: state.totalHeight,
        behavior: 'smooth'
      });
    }
  }, [state.totalHeight]);

  // Handle container resize
  useResizeObserver(containerRef, () => {
    if (containerRef.current) {
      updateVirtualization(state.scrollTop);
    }
  });

  // Initial setup
  useEffect(() => {
    calculateItemPositions();
    if (containerRef.current) {
      updateVirtualization(0);
    }
  }, [items, calculateItemPositions, updateVirtualization]);

  return {
    ...state,
    containerRef,
    scrollContainerRef,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    onScroll
  };
};

// Virtualized List Component
export interface VirtualizedListProps<T> {
  items: VirtualizationItem<T>[];
  renderItem: (item: VirtualizationItem<T>, index: number) => React.ReactNode;
  config?: VirtualizationConfig;
  className?: string;
  style?: React.CSSProperties;
  onScrollEnd?: () => void;
  onScrollStart?: () => void;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
}

export const VirtualizedList = <T,>({
  items,
  renderItem,
  config,
  className,
  style,
  onScrollEnd,
  onScrollStart,
  onItemsRendered
}: VirtualizedListProps<T>) => {
  const {
    containerRef,
    scrollContainerRef,
    onScroll,
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    scrollTop,
    isScrolling
  } = useVirtualization(items, config);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    onScroll(event);

    if (isScrolling && onScrollStart) {
      onScrollStart();
    }

    if (!isScrolling && onScrollEnd) {
      onScrollEnd();
    }
  }, [onScroll, isScrolling, onScrollStart, onScrollEnd]);

  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered(startIndex, endIndex);
    }
  }, [startIndex, endIndex, onItemsRendered]);

  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container ${className || ''}`}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        ...style
      }}
    >
      <div
        ref={scrollContainerRef}
        className="virtualized-scroll-container"
        onScroll={handleScroll}
        style={{ height: '100%', overflow: 'auto' }}
      >
        <div
          className="virtualized-list"
          style={{
            height: totalHeight,
            position: 'relative'
          }}
        >
          <div
            className="virtualized-items"
            style={{
              transform: `translateY(${scrollTop}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              return (
                <div
                  key={item.id}
                  className="virtualized-item"
                  style={{
                    position: 'absolute',
                    top: enableDynamicHeight
                      ? `${state.itemPositions.get(item.id)?.top || actualIndex * (config?.itemHeight || 80)}px`
                      : `${actualIndex * (config?.itemHeight || 80)}px`,
                    height: enableDynamicHeight
                      ? `${state.itemPositions.get(item.id)?.height || (config?.estimatedItemHeight || 100)}px`
                      : `${config?.itemHeight || 80}px`,
                    left: 0,
                    right: 0
                  }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Virtualized Grid Component
export interface VirtualizedGridProps<T> {
  items: VirtualizationItem<T>[];
  columns: number;
  renderItem: (item: VirtualizationItem<T>, index: number) => React.ReactNode;
  config?: VirtualizationConfig;
  className?: string;
  style?: React.CSSProperties;
  columnGap?: number;
  rowGap?: number;
}

export const VirtualizedGrid = <T,>({
  items,
  columns,
  renderItem,
  config,
  className,
  style,
  columnGap = 16,
  rowGap = 16
}: VirtualizedGridProps<T>) => {
  const {
    containerRef,
    scrollContainerRef,
    onScroll,
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    scrollTop,
    isScrolling
  } = useVirtualization(items, config);

  const itemsPerRow = columns;
  const rows = Math.ceil(items.length / itemsPerRow);

  const renderGridItems = useMemo(() => {
    const gridItems = [];
    const itemHeight = config?.itemHeight || 200;
    const itemWidth = `calc((100% - ${columnGap * (itemsPerRow - 1)}px) / ${itemsPerRow})`;

    for (let i = startIndex; i <= endIndex; i++) {
      const item = items[i];
      if (!item) continue;

      const rowIndex = Math.floor(i / itemsPerRow);
      const columnIndex = i % itemsPerRow;

      gridItems.push(
        <div
          key={item.id}
          className="virtualized-grid-item"
          style={{
            position: 'absolute',
            top: `${rowIndex * (itemHeight + rowGap)}px`,
            left: `calc(${columnIndex} * ${itemWidth} + ${columnIndex * columnGap}px)`,
            width: itemWidth,
            height: `${itemHeight}px`,
            boxSizing: 'border-box'
          }}
        >
          {renderItem(item, i)}
        </div>
      );
    }

    return gridItems;
  }, [items, startIndex, endIndex, itemsPerRow, columnGap, rowGap, renderItem, config]);

  return (
    <div
      ref={containerRef}
      className={`virtualized-grid-container ${className || ''}`}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        ...style
      }}
    >
      <div
        ref={scrollContainerRef}
        className="virtualized-grid-scroll"
        onScroll={onScroll}
        style={{ height: '100%', overflow: 'auto' }}
      >
        <div
          className="virtualized-grid"
          style={{
            height: totalHeight,
            position: 'relative'
          }}
        >
          <div
            className="virtualized-grid-items"
            style={{
              transform: `translateY(${scrollTop}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {renderGridItems}
          </div>
        </div>
      </div>
    </div>
  );
};

// Virtualization Performance Monitor
export const VirtualizationMonitor = ({
  itemsLength,
  visibleItemsLength,
  totalHeight,
  isScrolling,
  renderTime,
  onUpdate
}: {
  itemsLength: number;
  visibleItemsLength: number;
  totalHeight: number;
  isScrolling: boolean;
  renderTime: number;
  onUpdate?: (metrics: any) => void;
}) => {
  const [metrics, setMetrics] = useState({
    itemsLength,
    visibleItemsLength,
    totalHeight,
    isScrolling,
    renderTime,
    virtualizationRatio: 0,
    performanceScore: 0
  });

  useEffect(() => {
    const virtualizationRatio = (visibleItemsLength / Math.max(itemsLength, 1)) * 100;
    const performanceScore = Math.max(0, 100 - (isScrolling ? 20 : 0) - (renderTime > 16 ? 30 : 0));

    const newMetrics = {
      itemsLength,
      visibleItemsLength,
      totalHeight,
      isScrolling,
      renderTime,
      virtualizationRatio,
      performanceScore
    };

    setMetrics(newMetrics);
    if (onUpdate) onUpdate(newMetrics);
  }, [itemsLength, visibleItemsLength, totalHeight, isScrolling, renderTime, onUpdate]);

  return (
    <div className="virtualization-monitor" style={{ position: 'fixed', top: '10px', right: '10px', background: 'rgba(0, 0, 0, 0.8)', color: 'white', padding: '10px', borderRadius: '4px', fontSize: '12px', zIndex: 9999 }}>
      <div>Virtualization Metrics:</div>
      <div>Total Items: {metrics.itemsLength}</div>
      <div>Visible: {metrics.visibleItemsLength}</div>
      <div>Ratio: {metrics.virtualizationRatio.toFixed(1)}%</div>
      <div>Scrolling: {metrics.isScrolling ? 'Yes' : 'No'}</div>
      <div>Render Time: {metrics.renderTime.toFixed(2)}ms</div>
      <div>Performance: {metrics.performanceScore.toFixed(0)}/100</div>
    </div>
  );
};

// Hook for lazy loading images in virtualized lists
export const useLazyImage = (src: string, placeholderSrc?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return { imageSrc, isLoaded, imgRef };
};

export default {
  useVirtualization,
  VirtualizedList,
  VirtualizedGrid,
  VirtualizationMonitor,
  useLazyImage
};