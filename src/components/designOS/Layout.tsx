/**
 * designOS Layout Components
 * Stack, Grid, and Flex patterns for consistent layouts
 */
import React from 'react';

type Spacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type GridColumns = 1 | 2 | 3 | 4 | 6 | 12;
type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type FlexAlign = 'start' | 'center' | 'end' | 'stretch';

const spacingMap: Record<Spacing, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
  '3xl': 'gap-16',
};

const justifyMap: Record<FlexJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignMap: Record<FlexAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Spacing;
  direction?: 'row' | 'column';
  align?: FlexAlign;
}

export function Stack({
  gap = 'md',
  direction = 'column',
  align = 'start',
  children,
  className = '',
  ...props
}: StackProps) {
  const directionClass = direction === 'row' ? 'flex flex-row' : 'flex flex-col';
  return (
    <div className={`${directionClass} ${alignMap[align]} ${spacingMap[gap]} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: GridColumns;
  gap?: Spacing;
}

export function Grid({
  columns = 3,
  gap = 'md',
  children,
  className = '',
  ...props
}: GridProps) {
  const columnMap: Record<GridColumns, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  return (
    <div className={`grid ${columnMap[columns]} gap-${gap} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: FlexJustify;
  align?: FlexAlign;
  gap?: Spacing;
  wrap?: boolean;
}

export function Flex({
  justify = 'start',
  align = 'center',
  gap = 'md',
  wrap = false,
  children,
  className = '',
  ...props
}: FlexProps) {
  return (
    <div
      className={`
        flex ${justifyMap[justify]} ${alignMap[align]}
        gap-${gap}
        ${wrap ? 'flex-wrap' : 'flex-nowrap'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Center component for easy centering
export function Center({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      {children}
    </div>
  );
}

// Container component for max-width centering
export function Container({
  children,
  className = '',
  size = 'lg',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  return (
    <div className={`${sizeMap[size]} mx-auto px-md ${className}`} {...props}>
      {children}
    </div>
  );
}