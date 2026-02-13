/**
 * 2026 GLASSMORPHISM 2.0 - 3D DEPTH & PARALLAX COMPONENT
 * React component for advanced 3D transforms and parallax effects
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { useRef, useState } from 'react';
import {
  use3DDepth,
  useParallax,
  useTilt,
  useFloating,
  use3DStack,
  useInteractiveDepth,
  usePerspectiveGrid,
  use3DCarousel
} from '../../hooks/use3D';
import { TypographyHeading, TypographyBody } from './typography';

interface DepthContainerProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  parallax?: boolean;
  tilt?: boolean;
  floating?: boolean;
  interactive?: boolean;
  perspective?: boolean;
  carousel?: boolean;
  grid?: boolean;
}

export const DepthContainer: React.FC<DepthContainerProps> = ({
  children,
  className = '',
  depth = 3,
  parallax = false,
  tilt = false,
  floating = false,
  interactive = false,
  perspective = false,
  carousel = false,
  grid = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Initialize hooks
  const depthHook = use3DDepth({ layers: depth, baseZ: 0, spacing: 8 });
  const parallaxHook = useParallax({ speed: 0.3, direction: 'vertical', intensity: 1, enabled: parallax });
  const tiltHook = useTilt({ maxTilt: 12, perspective: 1000, enabled: tilt });
  const floatingHook = useFloating({ height: 12, duration: 6000, enabled: floating });
  const interactiveHook = useInteractiveDepth(0.5);
  const gridHook = usePerspectiveGrid(3, 3);

  // Combine styles
  const getCombinedStyle = () => {
    const styles: React.CSSProperties = {};

    if (depth > 0) {
      Object.assign(styles, depthHook.getDepthStyle(depth));
    }

    if (parallax) {
      Object.assign(styles, parallaxHook.getParallaxStyle());
    }

    if (tilt) {
      Object.assign(styles, tiltHook.getTiltStyle());
    }

    if (floating) {
      Object.assign(styles, floatingHook.getFloatingStyle());
    }

    if (perspective) {
      styles.perspective = '1000px';
      styles.transformStyle = 'preserve-3d';
    }

    return styles;
  };

  const combinedStyle = getCombinedStyle();

  return (
    <div
      ref={containerRef}
      className={`depth-container ${className}`}
      style={combinedStyle}
    >
      {children}
    </div>
  );
};

// 3D Card Component
export interface DepthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  className?: string;
  depth?: number;
  parallax?: boolean;
  tilt?: boolean;
  floating?: boolean;
  interactive?: boolean;
  hoverEffect?: boolean;
  clickEffect?: boolean;
}

export const DepthCard: React.FC<DepthCardProps> = ({
  children,
  title,
  subtitle,
  image,
  className = '',
  depth = 3,
  parallax = false,
  tilt = false,
  floating = false,
  interactive = false,
  hoverEffect = true,
  clickEffect = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const depthHook = use3DDepth({ layers: depth, baseZ: 0, spacing: 8 });
  const parallaxHook = useParallax({ speed: 0.2, direction: 'vertical', intensity: 1, enabled: parallax });
  const tiltHook = useTilt({ maxTilt: 8, perspective: 800, enabled: tilt });
  const floatingHook = useFloating({ height: 8, duration: 4000, enabled: floating });
  const interactiveHook = useInteractiveDepth(0.3);

  const handleMouseEnter = () => {
    if (hoverEffect) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverEffect) setIsHovered(false);
  };

  const handleMouseDown = () => {
    if (clickEffect) setIsClicked(true);
  };

  const handleMouseUp = () => {
    if (clickEffect) setIsClicked(false);
  };

  const getCardStyle = () => {
    const styles: React.CSSProperties = {
      position: 'relative',
      transformStyle: 'preserve-3d',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };

    if (depth > 0) {
      Object.assign(styles, depthHook.getDepthStyle(depth));
    }

    if (parallax) {
      Object.assign(styles, parallaxHook.getParallaxStyle());
    }

    if (tilt) {
      Object.assign(styles, tiltHook.getTiltStyle());
    }

    if (floating) {
      Object.assign(styles, floatingHook.getFloatingStyle());
    }

    if (hoverEffect && isHovered) {
      styles.transform = `${styles.transform || ''} translateY(-4px) translateZ(8px)`;
      styles.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
    }

    if (clickEffect && isClicked) {
      styles.transform = `${styles.transform || ''} translateY(-2px) translateZ(4px) scale(0.98)`;
    }

    return styles;
  };

  return (
    <div
      ref={cardRef}
      className={`depth-card ${className}`}
      style={getCardStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {image && (
        <div className="depth-card-image">
          <img src={image} alt={title} style={{ width: '100%', height: 'auto', borderRadius: '12px 12px 0 0' }} />
        </div>
      )}

      {(title || subtitle) && (
        <div className="depth-card-header">
          {title && <TypographyHeading level="h3">{title}</TypographyHeading>}
          {subtitle && <TypographyBody>{subtitle}</TypographyBody>}
        </div>
      )}

      <div className="depth-card-content">
        {children}
      </div>

      {/* 3D Shadow effect */}
      <div className="depth-card-shadow" style={{
        position: 'absolute',
        bottom: '-8px',
        left: '0',
        right: '0',
        height: '8px',
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.3), rgba(0, 212, 255, 0.3))',
        borderRadius: '0 0 8px 8px',
        transform: 'translateZ(-8px)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />
    </div>
  );
};

// Parallax Scrolling Section
export interface ParallaxSectionProps {
  children: React.ReactNode;
  backgroundImage?: string;
  speed?: number;
  intensity?: number;
  className?: string;
  fullHeight?: boolean;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  backgroundImage,
  speed = 0.5,
  intensity = 1,
  className = '',
  fullHeight = true
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const parallaxHook = useParallax({
    speed,
    direction: 'vertical',
    intensity,
    enabled: true
  });

  const getSectionStyle = () => {
    const styles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      minHeight: fullHeight ? '100vh' : 'auto',
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    };

    if (backgroundImage) {
      styles.backgroundImage = `url(${backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundAttachment = 'fixed';
    }

    return styles;
  };

  return (
    <div
      ref={sectionRef}
      className={`parallax-section ${className}`}
      style={getSectionStyle()}
    >
      <div
        className="parallax-content"
        style={{
          position: 'relative',
          zIndex: 2,
          ...parallaxHook.getParallaxStyle(),
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {children}
      </div>

      {/* Parallax background layers */}
      {backgroundImage && (
        <>
          <div
            className="parallax-layer parallax-background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: 'translateZ(-50px) scale(1.2)',
              zIndex: 1,
              ...parallaxHook.getParallaxStyle()
            }}
          />
          <div
            className="parallax-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.1))',
              zIndex: 1
            }}
          />
        </>
      )}
    </div>
  );
};

// 3D Stack Component
export interface StackItem {
  id: string;
  content: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export interface DepthStackProps {
  items: StackItem[];
  className?: string;
  direction?: 'horizontal' | 'vertical' | 'grid';
  spacing?: number;
  depth?: number;
  interactive?: boolean;
}

export const DepthStack: React.FC<DepthStackProps> = ({
  items,
  className = '',
  direction = 'vertical',
  spacing = 20,
  depth = 5,
  interactive = true
}) => {
  const { stackItems } = use3DStack(items, {
    layers: depth,
    baseZ: 0,
    spacing
  });

  const getStackStyle = () => {
    const styles: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction === 'horizontal' ? 'row' : 'column',
      gap: `${spacing}px`,
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    };

    if (direction === 'grid') {
      styles.display = 'grid';
      styles.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
      styles.gap = `${spacing}px`;
    }

    return styles;
  };

  return (
    <div
      className={`depth-stack ${className}`}
      style={getStackStyle()}
    >
      {stackItems.map((item, index) => (
        <div
          key={item.id}
          className="stack-item"
          style={item.style}
        >
          {item.title && (
            <TypographyHeading level="h4" className="stack-item-title">
              {item.title}
            </TypographyHeading>
          )}
          {item.subtitle && (
            <TypographyBody className="stack-item-subtitle">
              {item.subtitle}
            </TypographyBody>
          )}
          <div className="stack-item-content">
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
};

// Floating Elements Component
export interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  height?: number;
  duration?: number;
  delay?: number;
  enabled?: boolean;
  zIndex?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  height = 12,
  duration = 6000,
  delay = 0,
  enabled = true,
  zIndex = 10
}) => {
  const floatingHook = useFloating({
    height,
    duration,
    enabled
  });

  const getFloatingStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      zIndex,
      animationDelay: `${delay}ms`
    };

    if (enabled) {
      Object.assign(baseStyle, floatingHook.getFloatingStyle());
    }

    return baseStyle;
  };

  return (
    <div
      className={`floating-element ${className}`}
      style={getFloatingStyle()}
    >
      {children}
    </div>
  );
};

// Interactive Depth Indicator
export interface DepthIndicatorProps {
  threshold?: number;
  className?: string;
  showValue?: boolean;
}

export const DepthIndicator: React.FC<DepthIndicatorProps> = ({
  threshold = 0.5,
  className = '',
  showValue = true
}) => {
  const { isDeep, scrollY } = useInteractiveDepth(threshold);

  const getIndicatorStyle = () => {
    const styles: React.CSSProperties = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '8px 16px',
      borderRadius: '999px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: isDeep ? '#00D4FF' : '#A7B0BD',
      fontWeight: '600',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      zIndex: 9999
    };

    if (isDeep) {
      styles.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.3)';
      styles.transform = 'translateY(0)';
      styles.opacity = '1';
    } else {
      styles.transform = 'translateY(-10px)';
      styles.opacity = '0.5';
    }

    return styles;
  };

  return (
    <div
      className={`depth-indicator ${className}`}
      style={getIndicatorStyle()}
    >
      {showValue ? `Depth: ${isDeep ? 'Deep' : 'Shallow'}` : '3D Mode'}
      {showValue && (
        <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.7 }}>
          Scroll: {Math.round(scrollY)}
        </span>
      )}
    </div>
  );
};

// 3D Grid Component
export interface DepthGridProps {
  columns?: number;
  rows?: number;
  children: React.ReactNode[];
  className?: string;
  interactive?: boolean;
}

export const DepthGrid: React.FC<DepthGridProps> = ({
  columns = 3,
  rows = 3,
  children,
  className = '',
  interactive = true
}) => {
  const { items } = usePerspectiveGrid(columns, rows);

  const getGridStyle = () => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '20px',
    perspective: '1000px',
    transformStyle: 'preserve-3d'
  });

  return (
    <div
      className={`depth-grid ${className}`}
      style={getGridStyle()}
    >
      {items.map((item, index) => (
        <div
          key={`grid-item-${index}`}
          className="depth-grid-item"
          style={item.style}
        >
          {children[index] || (
            <DepthCard
              title={`Layer ${index + 1}`}
              subtitle={`Depth: ${item.style.transform}`}
              depth={index + 1}
              hoverEffect={interactive}
              clickEffect={interactive}
            >
              <TypographyBody>Interactive 3D element</TypographyBody>
            </DepthCard>
          )}
        </div>
      ))}
    </div>
  );
};

// Carousel Component
export interface CarouselItem {
  id: string;
  title?: string;
  subtitle?: string;
  content: React.ReactNode;
  image?: string;
}

export interface DepthCarouselProps {
  items: CarouselItem[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
}

export const DepthCarousel: React.FC<DepthCarouselProps> = ({
  items,
  className = '',
  autoPlay = true,
  interval = 4000,
  showControls = true,
  showIndicators = true
}) => {
  const {
    currentIndex,
    getCarouselItemStyle,
    next,
    prev,
    goTo
  } = use3DCarousel(items, { autoPlay, interval });

  return (
    <div
      className={`depth-carousel ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Carousel Items */}
      <div className="carousel-items" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className="carousel-item"
            style={getCarouselItemStyle(index)}
          >
            {item.image && (
              <div className="carousel-image">
                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {(item.title || item.subtitle) && (
              <div className="carousel-content">
                {item.title && <TypographyHeading level="h2">{item.title}</TypographyHeading>}
                {item.subtitle && <TypographyBody>{item.subtitle}</TypographyBody>}
              </div>
            )}
            {item.content}
          </div>
        ))}
      </div>

      {/* Controls */}
      {showControls && (
        <>
          <button
            onClick={prev}
            className="carousel-control prev"
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              padding: '10px',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            ‹
          </button>
          <button
            onClick={next}
            className="carousel-control next"
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              padding: '10px',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && (
        <div
          className="carousel-indicators"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}
        >
          {items.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => goTo(index)}
              className="carousel-indicator"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentIndex ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Export all components
export default {
  DepthContainer,
  DepthCard,
  ParallaxSection,
  DepthStack,
  FloatingElement,
  DepthIndicator,
  DepthGrid,
  DepthCarousel
};