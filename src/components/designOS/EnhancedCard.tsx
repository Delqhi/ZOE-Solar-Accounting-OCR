/**
 * Enhanced Card Component - 2026 UX Standards
 * Features: Multiple variants, hover states, depth effects, accessibility
 */
import { useState } from 'react';
import clsx from 'clsx';

interface EnhancedCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  disabled?: boolean;
  selected?: boolean;
  loading?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  as?: React.ElementType;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  variant = 'elevated',
  size = 'md',
  hoverable = true,
  clickable = false,
  disabled = false,
  selected = false,
  loading = false,
  header,
  footer,
  className,
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getBaseClasses = () => {
    const base = [
      'relative',
      'bg-surface',
      'border',
      'transition-all',
      'duration-300',
      'ease-in-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary/30',
      'focus:ring-offset-2',
      'focus:ring-offset-background',
    ];

    // Size variants
    const sizeClasses = {
      sm: 'p-3 rounded-lg',
      md: 'p-4 rounded-xl',
      lg: 'p-6 rounded-2xl',
    };

    // Variant styles
    const variantClasses = {
      elevated: [
        'bg-surface/60',
        'border-border',
        'shadow-sm',
        'hover:shadow-md',
        'hover:shadow-primary/10',
        'hover:-translate-y-1',
        'hover:border-border-hover',
      ],
      outlined: [
        'bg-surface/40',
        'border-border',
        'hover:bg-surface/60',
        'hover:border-border-hover',
        'hover:shadow-md',
        'hover:shadow-primary/5',
      ],
      filled: [
        'bg-surface',
        'border-border',
        'hover:bg-surface-hover',
        'hover:border-border-hover',
      ],
      glass: [
        'bg-surface/30',
        'border-border/60',
        'backdrop-blur-md',
        'hover:bg-surface/50',
        'hover:border-border-hover',
        'hover:shadow-lg',
        'hover:shadow-primary/10',
        'hover:-translate-y-1',
      ],
      flat: [
        'bg-transparent',
        'border-0',
        'hover:bg-surface/30',
        'hover:border-border',
      ],
    };

    // State modifiers
    const stateClasses = [
      hoverable && 'hover:cursor-pointer',
      clickable && 'cursor-pointer',
      clickable && 'active:scale-98',
      clickable && 'active:translate-y-0.5',
      disabled && 'opacity-50 cursor-not-allowed',
      selected && 'ring-2 ring-primary/30 border-primary/50',
      loading && 'opacity-75 cursor-wait',
      isHovered && hoverable && !disabled && !loading && 'scale-[1.02]',
      isPressed && clickable && !disabled && !loading && 'scale-[0.98] translate-y-0.5',
    ].filter(Boolean);

    return clsx(
      base,
      sizeClasses[size],
      variantClasses[variant],
      stateClasses,
      className
    );
  };

  const handleMouseEnter = () => {
    if (hoverable && !disabled && !loading) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  const handleMouseDown = () => {
    if (clickable && !disabled && !loading) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || loading || !onClick) {
      e.preventDefault();
      return;
    }
    onClick(e);
  };

  const renderContent = () => (
    <>
      {/* Header */}
      {header && (
        <div className={clsx(
          'mb-3',
          size === 'sm' ? 'px-1' : size === 'md' ? 'px-2' : 'px-3'
        )}>
          {header}
        </div>
      )}

      {/* Divider between header and content */}
      {header && !footer && (
        <div className="border-t border-border/60 mb-3" />
      )}

      {/* Content */}
      <div className={clsx(
        loading && 'opacity-75',
        'relative'
      )}>
        {children}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-muted">Lädt...</span>
            </div>
          </div>
        )}
      </div>

      {/* Divider between content and footer */}
      {footer && header && (
        <div className="border-t border-border/60 mt-3 mb-3" />
      )}

      {/* Footer */}
      {footer && (
        <div className={clsx(
          'mt-3',
          size === 'sm' ? 'px-1' : size === 'md' ? 'px-2' : 'px-3'
        )}>
          {footer}
        </div>
      )}
    </>
  );

  return (
    <Component
      className={getBaseClasses()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      aria-disabled={disabled || loading}
      aria-pressed={clickable ? isPressed : undefined}
      tabIndex={clickable && !disabled && !loading ? 0 : undefined}
      {...props}
    >
      {renderContent()}
    </Component>
  );
};

// Additional card variants for specific use cases
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}> = ({ title, value, subtitle, icon, trend, trendValue, variant = 'primary' }) => {
  const trendColor = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-text-muted',
  }[trend || 'neutral'];

  return (
    <EnhancedCard variant="elevated" className="hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <div className="text-text-muted text-sm font-medium">{title}</div>
            <div className="text-2xl font-bold text-text">{value}</div>
            {subtitle && <div className="text-xs text-text-muted mt-1">{subtitle}</div>}
          </div>
        </div>
        {trend && trendValue && (
          <div className={`text-sm font-medium ${trendColor}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
          </div>
        )}
      </div>
    </EnhancedCard>
  );
};

export const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  highlighted?: boolean;
}> = ({ title, description, icon, badge, highlighted = false }) => {
  return (
    <EnhancedCard
      variant={highlighted ? 'glass' : 'elevated'}
      className={clsx(
        highlighted && 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent',
        'group hover:shadow-xl transition-all duration-300'
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            highlighted
              ? 'bg-primary/20 text-primary group-hover:bg-primary/30'
              : 'bg-surface-hover text-text'
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-text text-lg">{title}</h3>
            {badge && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </EnhancedCard>
  );
};