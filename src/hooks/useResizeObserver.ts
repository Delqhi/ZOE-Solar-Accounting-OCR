/**
 * 2026 GLASSMORPHISM 2.0 - RESIZE OBSERVER HOOK
 * Performance-optimized resize observation for responsive components
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface ResizeObserverEntry {
  contentRect: DOMRectReadOnly;
  target: Element;
}

export interface ResizeObserverOptions {
  debounceMs?: number;
  throttleMs?: number;
  trackChildren?: boolean;
  enabled?: boolean;
}

export const useResizeObserver = (
  element: React.RefObject<HTMLElement> | HTMLElement | null,
  callback: (entry: ResizeObserverEntry) => void,
  options: ResizeObserverOptions = {}
) => {
  const {
    debounceMs = 16,
    throttleMs = 100,
    trackChildren = false,
    enabled = true
  } = options;

  const observerRef = useRef<ResizeObserver | null>(null);
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Debounced callback
  const debouncedCallback = useCallback(
    (entry: ResizeObserverEntry) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(entry);
      }, debounceMs);
    },
    [debounceMs]
  );

  useEffect(() => {
    if (!enabled || !element) return;

    const targetElement = element instanceof HTMLElement ? element : element.current;

    if (!targetElement || !window.ResizeObserver) {
      // Fallback for browsers without ResizeObserver
      const fallbackCallback = () => {
        const rect = targetElement?.getBoundingClientRect();
        if (rect) {
          debouncedCallback({
            contentRect: rect,
            target: targetElement
          });
        }
      };

      window.addEventListener('resize', fallbackCallback);
      fallbackCallback(); // Initial call

      return () => {
        window.removeEventListener('resize', fallbackCallback);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    // Use ResizeObserver
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (trackChildren || entry.target === targetElement) {
          debouncedCallback(entry);
        }
      }
    });

    observerRef.current.observe(targetElement, {
      box: trackChildren ? 'border-box' : 'content-box'
    });

    // Initial callback
    const initialRect = targetElement.getBoundingClientRect();
    debouncedCallback({
      contentRect: initialRect,
      target: targetElement
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [element, enabled, trackChildren, debouncedCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
};

// Hook for getting element dimensions with caching
export const useElementSize = (elementRef: React.RefObject<HTMLElement> | HTMLElement | null) => {
  const [size, setSize] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    setSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
      left: entry.contentRect.left,
      top: entry.contentRect.top
    });
  }, []);

  useResizeObserver(elementRef, handleResize, {
    debounceMs: 16,
    enabled: !!elementRef
  });

  return size;
};

// Hook for responsive breakpoints
export const useBreakpoint = (
  elementRef: React.RefObject<HTMLElement> | HTMLElement | null,
  breakpoints: { [key: string]: number }
) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(null);
  const [breakpointValues, setBreakpointValues] = useState<{ [key: string]: boolean }>({});

  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    const width = entry.contentRect.width;
    let activeBreakpoint: string | null = null;
    const values: { [key: string]: boolean } = {};

    for (const [name, minWidth] of Object.entries(breakpoints)) {
      const isActive = width >= minWidth;
      values[name] = isActive;

      if (isActive && (!activeBreakpoint || minWidth > (breakpoints[activeBreakpoint] || 0))) {
        activeBreakpoint = name;
      }
    }

    setCurrentBreakpoint(activeBreakpoint);
    setBreakpointValues(values);
  }, [breakpoints]);

  useResizeObserver(elementRef, handleResize, {
    debounceMs: 50,
    enabled: !!elementRef
  });

  return { currentBreakpoint, breakpointValues };
};

// Hook for intersection observation (enhanced version)
export const useIntersectionObserver = (
  elementRef: React.RefObject<HTMLElement> | HTMLElement | null,
  options: IntersectionObserverInit & { enabled?: boolean } = {}
) => {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    enabled = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || !elementRef) return;

    const targetElement = elementRef instanceof HTMLElement ? elementRef : elementRef.current;

    if (!targetElement || !window.IntersectionObserver) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setIntersectionRatio(entry.intersectionRatio);
        setEntry(entry);
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    observerRef.current.observe(targetElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [elementRef, threshold, root, rootMargin, enabled]);

  return { isIntersecting, intersectionRatio, entry };
};

// Hook for performance monitoring resize events
export const useResizePerformance = (elementRef: React.RefObject<HTMLElement> | HTMLElement | null) => {
  const [resizeCount, setResizeCount] = useState(0);
  const [lastResizeTime, setLastResizeTime] = useState(0);
  const [averageResizeTime, setAverageResizeTime] = useState(0);

  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    const now = performance.now();
    setResizeCount(prev => prev + 1);
    setLastResizeTime(now);

    // Calculate average resize time (simplified)
    if (resizeCount > 0) {
      const timeDiff = now - lastResizeTime;
      setAverageResizeTime(prev => {
        const newAverage = (prev * resizeCount + timeDiff) / (resizeCount + 1);
        return newAverage;
      });
    }
  }, [resizeCount, lastResizeTime]);

  useResizeObserver(elementRef, handleResize, {
    debounceMs: 16,
    enabled: !!elementRef
  });

  return {
    resizeCount,
    lastResizeTime,
    averageResizeTime,
    reset: () => {
      setResizeCount(0);
      setLastResizeTime(0);
      setAverageResizeTime(0);
    }
  };
};

// Hook for detecting container scroll capabilities
export const useScrollDetection = (elementRef: React.RefObject<HTMLElement> | HTMLElement | null) => {
  const [canScrollX, setCanScrollX] = useState(false);
  const [canScrollY, setCanScrollY] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    const element = entry.target as HTMLElement;

    const newScrollWidth = element.scrollWidth;
    const newScrollHeight = element.scrollHeight;
    const newClientWidth = element.clientWidth;
    const newClientHeight = element.clientHeight;

    setScrollWidth(newScrollWidth);
    setScrollHeight(newScrollHeight);
    setClientWidth(newClientWidth);
    setClientHeight(newClientHeight);

    setCanScrollX(newScrollWidth > newClientWidth);
    setCanScrollY(newScrollHeight > newClientHeight);
  }, []);

  useResizeObserver(elementRef, handleResize, {
    debounceMs: 16,
    enabled: !!elementRef
  });

  return {
    canScrollX,
    canScrollY,
    scrollWidth,
    scrollHeight,
    clientWidth,
    clientHeight
  };
};

export default {
  useResizeObserver,
  useElementSize,
  useBreakpoint,
  useIntersectionObserver,
  useResizePerformance,
  useScrollDetection
};