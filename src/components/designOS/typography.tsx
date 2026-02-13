/**
 * 2026 GLASSMORPHISM 2.0 - TYPOGRAPHY COMPONENTS
 * React components for advanced typography with AI-optimized scaling
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React from 'react';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

// Heading Components
export const TypographyHeading: React.FC<TypographyProps & { level: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  level,
  children,
  className = '',
  ...props
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Component
      className={`typography-heading typography-h${level} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

// Body Text Components
export const TypographyBody: React.FC<TypographyProps & { size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' }> = ({
  children,
  className = '',
  size = 'base',
  ...props
}) => {
  return (
    <p
      className={`typography-body typography-text-${size} ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

// Accent Text Components
export const TypographyAccent: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-accent text-accent ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Gradient Text Components
export const TypographyGradient: React.FC<TypographyProps & { type?: 'primary' | 'secondary' | 'accent' | 'warning' | 'error' }> = ({
  children,
  className = '',
  type = 'primary',
  ...props
}) => {
  return (
    <span
      className={`typography-gradient gradient-text gradient-${type} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Code Text Components
export const TypographyCode: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <code
      className={`typography-code text-code ${className}`}
      {...props}
    >
      {children}
    </code>
  );
};

// Keyboard Text Components
export const TypographyKeyboard: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <kbd
      className={`typography-kbd text-kbd ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
};

// Muted Text Components
export const TypographyMuted: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-muted text-muted ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Emphasis Text Components
export const TypographyEmphasis: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <strong
      className={`typography-emphasis text-emphasis ${className}`}
      {...props}
    >
      {children}
    </strong>
  );
};

// Inverted Text Components
export const TypographyInverted: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-inverted text-inverted ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Semantic Text Components
export const TypographySuccess: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-success text-success ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const TypographyWarning: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-warning text-warning ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const TypographyError: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-error text-error ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const TypographyInfo: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-info text-info ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Animation Components
export const TypographyFloat: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-float text-float ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const TypographyPulse: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-pulse text-pulse ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const TypographyGlow: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`typography-glow text-glow ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Export all typography components
export default {
  Heading: TypographyHeading,
  Body: TypographyBody,
  Accent: TypographyAccent,
  Gradient: TypographyGradient,
  Code: TypographyCode,
  Keyboard: TypographyKeyboard,
  Muted: TypographyMuted,
  Emphasis: TypographyEmphasis,
  Inverted: TypographyInverted,
  Success: TypographySuccess,
  Warning: TypographyWarning,
  Error: TypographyError,
  Info: TypographyInfo,
  Float: TypographyFloat,
  Pulse: TypographyPulse,
  Glow: TypographyGlow
};