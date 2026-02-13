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

export { useVirtualization, useLazyImage };
export type { VirtualizationItem, VirtualizationConfig, VirtualizationState };
