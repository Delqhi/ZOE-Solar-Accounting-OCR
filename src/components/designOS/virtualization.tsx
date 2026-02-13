/**
 * 2026 GLASSMORPHISM 2.0 - VIRTUALIZATION COMPONENTS
 * React components for high-performance virtualization
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useVirtualization } from '../../hooks/useVirtualization';

// Re-export interfaces from the hook
export type { VirtualizationItem, VirtualizationConfig, VirtualizationState } from '../../hooks/useVirtualization';

// Virtualized List Component
export interface VirtualizedListProps<T> {
  items: import('../../hooks/useVirtualization').VirtualizationItem<T>[];
  renderItem: (item: import('../../hooks/useVirtualization').VirtualizationItem<T>, index: number) => React.ReactNode;
  config?: import('../../hooks/useVirtualization').VirtualizationConfig;
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
                    top: `${actualIndex * (config?.itemHeight || 80)}px`,
                    height: `${config?.itemHeight || 80}px`,
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
  items: import('../../hooks/useVirtualization').VirtualizationItem<T>[];
  columns: number;
  renderItem: (item: import('../../hooks/useVirtualization').VirtualizationItem<T>, index: number) => React.ReactNode;
  config?: import('../../hooks/useVirtualization').VirtualizationConfig;
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
