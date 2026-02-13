/**
 * Enhanced Layout Component - 2026 UX Standards
 * Features: Responsive grids, focus management, accessibility, performance
 */
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  variant?: 'dashboard' | 'form' | 'list' | 'detail';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  as?: React.ElementType;
}

export const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({
  children,
  variant = 'dashboard',
  maxWidth = 'xl',
  padding = 'md',
  className,
  as: Component = 'div',
  ...props
}) => {
  const getLayoutClasses = () => {
    const base = [
      'min-h-screen',
      'bg-background',
      'text-text',
      'font-sans',
      'antialiased',
      'selection:bg-primary/20',
      'selection:text-primary',
    ];

    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full',
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    const variantClasses = {
      dashboard: [
        'grid',
        'grid-cols-1',
        'md:grid-cols-[280px_1fr]',
        'lg:grid-cols-[320px_1fr]',
        'gap-6',
        'min-h-screen',
      ],
      form: ['max-w-2xl', 'mx-auto', 'space-y-6'],
      list: ['grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4', 'auto-rows-fr'],
      detail: ['max-w-4xl', 'mx-auto', 'space-y-6'],
    };

    return clsx(
      base,
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      variantClasses[variant],
      className
    );
  };

  return (
    <Component className={getLayoutClasses()} {...props}>
      {children}
    </Component>
  );
};

// Enhanced Header Component
export const EnhancedHeader: React.FC<{
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  variant?: 'simple' | 'with-actions' | 'with-search';
  className?: string;
}> = ({ title, subtitle, breadcrumbs, actions, variant = 'simple', className }) => {
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
      <nav className="flex items-center gap-2 text-sm text-text-muted">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-text-muted/60">/</span>}
            {crumb.href ? (
              <a href={crumb.href} className="hover:text-text transition-colors">
                {crumb.label}
              </a>
            ) : (
              <span className="text-text">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  };

  const renderSearch = () => {
    if (variant !== 'with-search') return null;

    return (
      <div className="relative">
        <input
          type="search"
          placeholder="Suchen..."
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  };

  return (
    <header
      className={clsx(
        'bg-surface/40',
        'border-b',
        'border-border/40',
        'backdrop-blur-sm',
        'sticky',
        'top-0',
        'z-40',
        'p-4',
        'md:p-6',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {renderBreadcrumbs()}

        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">{title}</h1>
            {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
          </div>

          {/* Actions */}
          {variant === 'with-actions' && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        {/* Search Bar */}
        {renderSearch()}
      </div>
    </header>
  );
};

// Enhanced Sidebar Component
export const EnhancedSidebar: React.FC<{
  children: React.ReactNode;
  title?: string;
  variant?: 'navigation' | 'filters' | 'details';
  collapsible?: boolean;
  className?: string;
}> = ({ children, title, variant = 'navigation', collapsible = false, className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getSidebarClasses = () => {
    const base = [
      'bg-surface/40',
      'border-r',
      'border-border/40',
      'backdrop-blur-sm',
      'min-h-screen',
      'sticky',
      'top-0',
      'z-30',
      'transition-all',
      'duration-300',
      'ease-in-out',
    ];

    const variantClasses = {
      navigation: ['w-72', 'md:w-80', 'lg:w-96', 'p-4', 'md:p-6'],
      filters: ['w-64', 'md:w-80', 'lg:w-96', 'p-4', 'md:p-6'],
      details: ['w-80', 'md:w-96', 'lg:w-[36rem]', 'p-4', 'md:p-6'],
    };

    const collapsedClasses = isCollapsed ? ['w-20', 'md:w-24', 'lg:w-28', 'px-2', 'md:px-3'] : [];

    return clsx(base, variantClasses[variant], collapsedClasses, className);
  };

  const renderTitle = () => {
    if (!title || isCollapsed) return null;

    return (
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste zuklappen'}
          >
            <svg
              className={clsx('w-5 h-5 text-text-muted', isCollapsed && 'rotate-180')}
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className={getSidebarClasses()}>
      {renderTitle()}

      <div className={clsx('space-y-4', isCollapsed && 'text-center')}>{children}</div>
    </aside>
  );
};

// Enhanced Main Content Component
export const EnhancedMain: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'full-width' | 'centered';
  className?: string;
}> = ({ children, variant = 'default', className }) => {
  const getMainClasses = () => {
    const base = ['min-h-screen', 'bg-background'];

    const variantClasses = {
      default: ['p-4', 'md:p-6', 'lg:p-8'],
      'full-width': ['p-0', 'm-0'],
      centered: ['px-4', 'md:px-6', 'lg:px-8', 'max-w-4xl', 'mx-auto'],
    };

    return clsx(base, variantClasses[variant], className);
  };

  return <main className={getMainClasses()}>{children}</main>;
};

// Enhanced Footer Component
export const EnhancedFooter: React.FC<{
  children?: React.ReactNode;
  variant?: 'simple' | 'with-links' | 'full';
  className?: string;
}> = ({ children, variant = 'simple', className }) => {
  const renderSimpleFooter = () => (
    <div className="text-center py-6 text-text-muted text-sm">
      © {new Date().getFullYear()} ZOE Solar. Alle Rechte vorbehalten.
    </div>
  );

  const renderLinksFooter = () => (
    <div className="border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-text mb-4">Produkt</h3>
            <ul className="space-y-2 text-text-muted">
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Preise
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4">Unternehmen</h3>
            <ul className="space-y-2 text-text-muted">
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Über uns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Karriere
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4">Support</h3>
            <ul className="space-y-2 text-text-muted">
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Hilfe
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Kontakt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Status
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-4">Rechtliches</h3>
            <ul className="space-y-2 text-text-muted">
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  AGB
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Datenschutz
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text transition-colors">
                  Impressum
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/40 mt-8 pt-8 text-center text-text-muted">
          © {new Date().getFullYear()} ZOE Solar. Alle Rechte vorbehalten.
        </div>
      </div>
    </div>
  );

  const renderFullFooter = () => (
    <footer className="bg-surface/40 border-t border-border/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text-inverted"
                >
                  <path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="font-bold text-xl">ZOE Solar</div>
                <div className="text-text-muted text-sm">Accounting Suite</div>
              </div>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Intelligente Dokumentenverarbeitung für moderne Unternehmen. Sparen Sie Zeit,
              reduzieren Sie Fehler und optimieren Sie Ihre Buchhaltung.
            </p>
          </div>
          <div className="md:col-span-2">{children}</div>
        </div>
      </div>
    </footer>
  );

  const getFooterContent = () => {
    switch (variant) {
      case 'with-links':
        return renderLinksFooter();
      case 'full':
        return renderFullFooter();
      default:
        return renderSimpleFooter();
    }
  };

  return (
    <footer
      className={clsx(
        'bg-surface/40',
        'border-t',
        'border-border/40',
        'backdrop-blur-sm',
        'mt-auto',
        className
      )}
    >
      {getFooterContent()}
    </footer>
  );
};

// Responsive Grid System
export const EnhancedGrid: React.FC<{
  children: React.ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ children, cols = {}, gap = 'md', className }) => {
  const getGridClasses = () => {
    const base = ['grid', 'w-full'];

    const colClasses = {
      sm: cols.sm ? `grid-cols-${cols.sm}` : 'grid-cols-1',
      md: cols.md ? `md:grid-cols-${cols.md}` : '',
      lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
      xl: cols.xl ? `xl:grid-cols-${cols.xl}` : '',
    };

    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    return clsx(base, Object.values(colClasses).filter(Boolean), gapClasses[gap], className);
  };

  return <div className={getGridClasses()}>{children}</div>;
};

// Focus Management Hook
export const useFocusManagement = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  return { containerRef };
};
