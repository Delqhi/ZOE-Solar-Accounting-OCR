/**
 * 2026 GLASSMORPHISM 2.0 - TYPOGRAPHY UTILITIES HOOK
 * React hooks for accessing advanced typography system with AI-optimized scaling
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useMemo } from 'react';

export interface TypographyClasses {
  heading: string;
  body: string;
  accent: string;
  code: string;
  muted: string;
  emphasis: string;
  gradient: string;
  interactive: string;
}

export interface TypographyConfig {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl';
  weight?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
  tracking?: 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  gradient?: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
  animation?: 'float' | 'pulse' | 'glow' | 'none';
  responsive?: boolean;
}

export function useTypography(config: TypographyConfig = {}): TypographyClasses {
  const {
    size = 'base',
    weight,
    lineHeight = 'normal',
    tracking = 'normal',
    color,
    gradient,
    animation = 'none',
    responsive = true
  } = config;

  return useMemo(() => {
    const baseClasses = [
      'transition-all',
      'duration-200',
      'ease-out'
    ];

    // Size classes
    const sizeClass = `text-${size}`;

    // Weight classes
    const weightClass = weight ? `font-${weight}` : '';

    // Line height classes
    const lineHeightClass = `leading-${lineHeight}`;

    // Letter spacing classes
    const trackingClass = `tracking-${tracking}`;

    // Color classes
    const colorClass = color ? `text-${color}` : '';

    // Gradient classes
    const gradientClass = gradient ? `gradient-${gradient}` : '';

    // Animation classes
    const animationClass = animation !== 'none' ? `text-${animation}` : '';

    // Responsive classes
    const responsiveClass = responsive ? 'responsive-typography' : '';

    // Semantic combinations
    const heading = [
      'h1',
      sizeClass,
      lineHeightClass,
      trackingClass,
      gradientClass || 'text-text-emphasis',
      animationClass,
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const body = [
      'text-base',
      lineHeightClass,
      trackingClass,
      colorClass || 'text-text',
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const accent = [
      'text-accent',
      sizeClass,
      weight ? `font-${weight}` : 'font-semibold',
      colorClass || 'text-accent',
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const code = [
      'text-code',
      sizeClass,
      'font-mono',
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const muted = [
      'text-muted',
      sizeClass,
      lineHeightClass,
      trackingClass,
      colorClass || 'text-text-muted',
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const emphasis = [
      'text-emphasis',
      sizeClass,
      weight ? `font-${weight}` : 'font-semibold',
      colorClass || 'text-text-emphasis',
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const gradient = [
      'gradient-text',
      sizeClass,
      lineHeightClass,
      trackingClass,
      gradientClass,
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    const interactive = [
      'text-accent',
      sizeClass,
      weight ? `font-${weight}` : 'font-semibold',
      'hover:text-primary',
      'hover:transform',
      'hover:-translate-y-1',
      'hover:text-shadow-md',
      'transition-all',
      'duration-200',
      'ease-out',
      responsiveClass,
      ...baseClasses
    ].filter(Boolean).join(' ');

    return {
      heading,
      body,
      accent,
      code,
      muted,
      emphasis,
      gradient,
      interactive
    };
  }, [size, weight, lineHeight, tracking, color, gradient, animation, responsive]);
}

export function useTypographyScale() {
  return useMemo(() => ({
    // Fluid typography scale
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
    '5xl': 'var(--font-size-5xl)',
    '6xl': 'var(--font-size-6xl)',
    '7xl': 'var(--font-size-7xl)',
    '8xl': 'var(--font-size-8xl)',

    // Line heights
    tight: 'var(--line-height-tight)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',

    // Letter spacing
    tight: 'var(--tracking-tight)',
    normal: 'var(--tracking-normal)',
    wide: 'var(--tracking-wide)',
    wider: 'var(--tracking-wider)',
    widest: 'var(--tracking-widest)',

    // Semantic scales
    heading: {
      h1: 'var(--font-size-7xl)',
      h2: 'var(--font-size-6xl)',
      h3: 'var(--font-size-5xl)',
      h4: 'var(--font-size-4xl)',
      h5: 'var(--font-size-3xl)',
      h6: 'var(--font-size-2xl)'
    },

    body: {
      small: 'var(--font-size-sm)',
      base: 'var(--font-size-base)',
      large: 'var(--font-size-lg)'
    }
  }), []);
}

export function useTypographyHelpers() {
  return useMemo(() => ({
    // Utility functions for dynamic typography
    getFontSize: (size: keyof ReturnType<typeof useTypographyScale>['heading' | 'body']) => {
      const scale = useTypographyScale();
      if (scale.heading[size as any]) return scale.heading[size as any];
      if (scale.body[size as any]) return scale.body[size as any];
      return scale.base;
    },

    // Responsive typography helper
    responsiveText: (breakpoints: {
      base?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
    }) => {
      const classes = [];
      if (breakpoints.base) classes.push(`text-${breakpoints.base}`);
      if (breakpoints.sm) classes.push(`sm:text-${breakpoints.sm}`);
      if (breakpoints.md) classes.push(`md:text-${breakpoints.md}`);
      if (breakpoints.lg) classes.push(`lg:text-${breakpoints.lg}`);
      if (breakpoints.xl) classes.push(`xl:text-${breakpoints.xl}`);
      return classes.join(' ');
    },

    // Gradient text helper
    gradientText: (type: 'primary' | 'secondary' | 'accent' | 'warning' | 'error') => {
      return `bg-gradient-to-r from-${type}-500 to-${type}-300 bg-clip-text text-transparent font-semibold`;
    },

    // Typography animation helpers
    animateText: (animation: 'float' | 'pulse' | 'glow') => {
      return `animate-text-${animation}`;
    },

    // Typography contrast helpers
    getContrastColor: (backgroundColor: string) => {
      // Simple luminance check for text color contrast
      const r = parseInt(backgroundColor.slice(1, 3), 16);
      const g = parseInt(backgroundColor.slice(3, 5), 16);
      const b = parseInt(backgroundColor.slice(5, 7), 16);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance > 128 ? '#000000' : '#FFFFFF';
    }
  }), []);
}

// Typography context for global typography settings
import { createContext, useContext } from 'react';

interface TypographyContextValue {
  scale: ReturnType<typeof useTypographyScale>;
  helpers: ReturnType<typeof useTypographyHelpers>;
  theme: {
    fontFamily: {
      heading: string;
      body: string;
      mono: string;
    };
    fontWeight: {
      thin: number;
      extralight: number;
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
      black: number;
    };
    color: {
      text: string;
      textMuted: string;
      textEmphasis: string;
      textInverted: string;
    };
  };
}

const TypographyContext = createContext<TypographyContextValue | null>(null);

export function TypographyProvider({ children }: { children: React.ReactNode }) {
  const scale = useTypographyScale();
  const helpers = useTypographyHelpers();
  const theme = {
    fontFamily: {
      heading: 'var(--heading-font)',
      body: 'var(--body-font)',
      mono: 'var(--mono-font)'
    },
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    },
    color: {
      text: 'var(--color-text)',
      textMuted: 'var(--color-text-muted)',
      textEmphasis: 'var(--color-text-emphasis)',
      textInverted: 'var(--color-text-inverted)'
    }
  };

  const value = { scale, helpers, theme };

  return (
    <TypographyContext.Provider value={value}>
      {children}
    </TypographyContext.Provider>
  );
}

export function useTypographyContext() {
  const context = useContext(TypographyContext);
  if (!context) {
    throw new Error('useTypographyContext must be used within TypographyProvider');
  }
  return context;
}

// Typography components
export function TypographyHeading({
  level = 'h1',
  children,
  className,
  ...props
}: {
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { scale } = useTypographyContext();
  const Tag = level;

  return (
    <Tag
      className={`font-heading ${scale.heading[level]} leading-tight tracking-tight text-text-emphasis ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function TypographyBody({
  variant = 'base',
  children,
  className,
  ...props
}: {
  variant?: 'small' | 'base' | 'large';
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { scale } = useTypographyContext();

  return (
    <p
      className={`font-body ${scale.body[variant]} leading-normal tracking-normal text-text ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </p>
  );
}

export function TypographyCode({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <code
      className={`text-code font-mono text-sm bg-surface border border-border rounded px-2 py-1 ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </code>
  );
}

export function TypographyKbd({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <kbd
      className={`text-kbd font-mono text-xs bg-surface border border-border rounded px-2 py-1 ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </kbd>
  );
}

export function TypographyGradient({
  type = 'primary',
  children,
  className,
  ...props
}: {
  type?: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { helpers } = useTypographyContext();

  return (
    <span
      className={`bg-gradient-to-r from-${type}-500 to-${type}-300 bg-clip-text text-transparent font-semibold ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </span>
  );
}

export function TypographyAnimated({
  animation = 'float',
  children,
  className,
  ...props
}: {
  animation?: 'float' | 'pulse' | 'glow';
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { helpers } = useTypographyContext();

  return (
    <span
      className={`text-${animation} ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  );
}