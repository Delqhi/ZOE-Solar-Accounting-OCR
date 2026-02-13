/**
 * 2026 GLASSMORPHISM 2.0 - 3D DEPTH & PARALLAX HOOKS
 * React hooks for advanced 3D transforms, depth layers, and parallax effects
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface ParallaxConfig {
  speed?: number;
  direction?: 'vertical' | 'horizontal' | 'both';
  intensity?: number;
  enabled?: boolean;
}

export interface TiltConfig {
  maxTilt?: number;
  perspective?: number;
  transition?: string;
  enabled?: boolean;
}

export interface DepthConfig {
  layers?: number;
  baseZ?: number;
  spacing?: number;
  enabled?: boolean;
}

export interface FloatingConfig {
  height?: number;
  duration?: number;
  easing?: string;
  enabled?: boolean;
}

// 3D Depth Hook
export function use3DDepth(config: DepthConfig = {}) {
  const {
    layers = 5,
    baseZ = 0,
    spacing = 8,
    enabled = true
  } = config;

  const getDepthClass = useCallback((layer: number) => {
    if (!enabled) return '';
    const z = baseZ + (layer * spacing);
    return `depth-${layer} translateZ(${z}px)`;
  }, [enabled, baseZ, spacing]);

  const getDepthStyle = useCallback((layer: number) => {
    if (!enabled) return {};
    const z = baseZ + (layer * spacing);
    return {
      transform: `translateZ(${z}px)`,
      zIndex: 10 + layer,
      boxShadow: `0 ${layer * 2}px ${layer * 8}px rgba(0, 0, 0, 0.2)`
    };
  }, [enabled, baseZ, spacing]);

  return {
    getDepthClass,
    getDepthStyle,
    layers,
    baseZ,
    spacing
  };
}

// Parallax Hook
export function useParallax(config: ParallaxConfig = {}) {
  const {
    speed = 0.3,
    direction = 'vertical',
    intensity = 1,
    enabled = true
  } = config;

  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((event: Event) => {
    if (!enabled || !containerRef.current) return;

    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Calculate relative scroll position (0 to 1)
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);

    // Apply parallax transformation
    const parallaxOffset = scrollRatio * 100 * speed * intensity;
    setOffset(parallaxOffset);
  }, [enabled, speed, intensity]);

  useEffect(() => {
    if (!enabled) return undefined;

    const container = containerRef.current?.closest('.parallax-scroll') || window;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enabled, handleScroll]);

  const getParallaxStyle = useCallback(() => {
    if (!enabled) return {};

    switch (direction) {
      case 'vertical':
        return { transform: `translateY(${offset * -1}px)` };
      case 'horizontal':
        return { transform: `translateX(${offset * -1}px)` };
      case 'both':
        return {
          transform: `
            translateY(${offset * -1}px)
            translateX(${offset * -0.5}px)
          `
        };
      default:
        return { transform: `translateY(${offset * -1}px)` };
    }
  }, [enabled, direction, offset]);

  return {
    containerRef,
    getParallaxStyle,
    offset,
    speed,
    direction
  };
}

// Tilt Interaction Hook
export function useTilt(config: TiltConfig = {}) {
  const {
    maxTilt = 12,
    perspective = 1000,
    transition = '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    enabled = true
  } = config;

  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation based on mouse position
    const rotateX = (y - centerY) / centerY * maxTilt;
    const rotateY = (centerX - x) / centerX * maxTilt;

    setRotation({ x: rotateX, y: rotateY });
  }, [enabled, maxTilt]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    setRotation({ x: 0, y: 0 });
  }, [enabled]);

  useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, handleMouseMove, handleMouseLeave]);

  const getTiltStyle = useCallback(() => {
    if (!enabled) return {};

    return {
      transform: `
        perspective(${perspective}px)
        rotateX(${rotation.x}deg)
        rotateY(${rotation.y}deg)
        translateZ(8px)
      `,
      transition,
      transformStyle: 'preserve-3d'
    };
  }, [enabled, rotation, perspective, transition]);

  return {
    elementRef,
    getTiltStyle,
    rotation,
    maxTilt,
    perspective
  };
}

// Floating Animation Hook
export function useFloating(config: FloatingConfig = {}) {
  const {
    height = 12,
    duration = 6000,
    easing = 'ease-in-out',
    enabled = true
  } = config;

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setPhase(prev => (prev + 1) % 100);
    }, duration / 100);

    return () => clearInterval(interval);
  }, [enabled, duration]);

  const getFloatingStyle = useCallback(() => {
    if (!enabled) return {};

    // Create smooth floating animation using sine wave
    const y = Math.sin((phase / 100) * Math.PI * 2) * height;

    return {
      transform: `translateY(${y}px) translateZ(${Math.abs(y) / 2}px)`,
      transition: `transform ${duration / 1000}s ${easing}`,
      animation: `float ${duration / 1000}s ${easing} infinite`
    };
  }, [enabled, phase, height, duration, easing]);

  return {
    getFloatingStyle,
    phase,
    height
  };
}

// 3D Stack Hook
export function use3DStack(items: any[], config: DepthConfig = {}) {
  const { getDepthStyle } = use3DDepth(config);
  const { getParallaxStyle } = useParallax();

  const stackItems = items.map((item, index) => ({
    ...item,
    style: {
      ...getDepthStyle(index),
      ...getParallaxStyle()
    },
    className: `stack-item stack-item-${index}`
  }));

  return {
    stackItems,
    getDepthStyle,
    getParallaxStyle
  };
}

// Interactive Depth Hook
export function useInteractiveDepth(threshold: number = 0.5) {
  const [isDeep, setIsDeep] = useState(false);
  const scrollRef = useRef<number>(0);

  const checkDepth = useCallback((scrollY: number) => {
    const depth = scrollY / document.documentElement.scrollHeight;
    setIsDeep(depth > threshold);
    scrollRef.current = scrollY;
  }, [threshold]);

  useEffect(() => {
    const handleScroll = () => checkDepth(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkDepth]);

  return {
    isDeep,
    scrollY: scrollRef.current,
    checkDepth
  };
}

// Perspective Grid Hook
export function usePerspectiveGrid(columns: number = 3, rows: number = 3) {
  const items = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const depth = (x + y) * 4;
      const zIndex = 10 + depth;
      const transform = `
        translate3d(${x * 20}px, ${y * 20}px, ${depth}px)
        rotateX(${y * 2}deg)
        rotateY(${x * 2}deg)
      `;

      items.push({
        x, y,
        style: {
          transform,
          zIndex,
          transition: 'all 0.3s ease'
        },
        className: `perspective-item perspective-item-${x}-${y}`
      });
    }
  }

  return { items, columns, rows };
}

// 3D Carousel Hook
export function use3DCarousel(items: any[], config: { autoPlay?: boolean; interval?: number } = {}) {
  const { autoPlay = true, interval = 4000 } = config;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => (prev + 1) % items.length);
      setTimeout(() => setIsTransitioning(false), 600);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);

  const getCarouselItemStyle = useCallback((index: number) => {
    const diff = (index - currentIndex + items.length) % items.length;
    const total = items.length;

    let transform = '';
    let zIndex = 1;
    let opacity = 0.3;

    if (diff === 0) {
      // Active item
      transform = 'translateZ(0px) scale(1)';
      zIndex = 3;
      opacity = 1;
    } else if (diff === 1 || diff === total - 1) {
      // Adjacent items
      const direction = diff === 1 ? 1 : -1;
      transform = `translateX(${direction * 100}%) translateZ(-200px) scale(0.8)`;
      zIndex = 2;
      opacity = 0.8;
    } else {
      // Background items
      transform = `translateZ(${-400 - (diff * 100)}px) scale(0.6)`;
      zIndex = 1;
      opacity = 0.1;
    }

    return {
      transform,
      zIndex,
      opacity,
      transition: isTransitioning ? 'all 0.6s ease' : 'all 0.3s ease',
      transformStyle: 'preserve-3d'
    };
  }, [currentIndex, items.length, isTransitioning]);

  const next = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % items.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [items.length]);

  const prev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [items.length]);

  return {
    currentIndex,
    isTransitioning,
    getCarouselItemStyle,
    next,
    prev,
    goTo: setCurrentIndex
  };
}

// Depth-aware Intersection Observer Hook
export function useDepthObserver(threshold: number = 0.1) {
  const [visible, setVisible] = useState(false);
  const [depth, setDepth] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        setDepth(entry.intersectionRatio);
      },
      { threshold }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [threshold]);

  const getDepthClass = useCallback(() => {
    if (!visible) return 'depth-hidden';
    if (depth < 0.3) return 'depth-shallow';
    if (depth < 0.7) return 'depth-mid';
    return 'depth-deep';
  }, [visible, depth]);

  return {
    elementRef,
    visible,
    depth,
    getDepthClass
  };
}

// Export all hooks
export default {
  use3DDepth,
  useParallax,
  useTilt,
  useFloating,
  use3DStack,
  useInteractiveDepth,
  usePerspectiveGrid,
  use3DCarousel,
  useDepthObserver
};