/**
 * Enhanced Empty State Component - 2026 UX Standards
 * Features: Animated illustrations, contextual actions, progressive disclosure
 */

import clsx from 'clsx';

interface EnhancedEmptyStateProps {
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: React.ReactNode;
  }>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'illustrated' | 'minimal' | 'hero';
  className?: string;
  showTips?: boolean;
  tips?: string[];
  animated?: boolean;
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  title,
  description,
  illustration,
  primaryAction,
  secondaryActions = [],
  size = 'md',
  variant = 'illustrated',
  className,
  showTips = false,
  tips = [],
  animated = true,
}) => {
  const getSizeClasses = () => {
    const base = [
      'text-center',
      'py-8',
      'px-6',
      'rounded-xl',
      'bg-surface/40',
      'border',
      'border-border/40',
      'backdrop-blur-sm',
    ];

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
    };

    return clsx(base, sizeClasses[size]);
  };

  const getVariantClasses = () => {
    const base = [
      'relative',
      'overflow-hidden',
    ];

    const variantClasses = {
      illustrated: [
        'bg-gradient-to-br',
        'from-surface/60',
        'to-surface/30',
        'animate-in',
        'fade-in',
        'duration-500',
      ],
      minimal: [
        'bg-transparent',
        'border-0',
        'shadow-none',
      ],
      hero: [
        'bg-gradient-to-r',
        'from-primary/5',
        'to-transparent',
        'border-primary/20',
        'animate-in',
        'slide-in-from-left',
        'duration-700',
      ],
    };

    return clsx(base, variantClasses[variant]);
  };

  const renderIllustration = () => {
    if (!illustration) return null;

    return (
      <div className={clsx(
        'mb-6',
        'flex',
        'justify-center',
        'items-center',
        animated && 'animate-in zoom-in-50 duration-500'
      )}>
        <div className="relative">
          {illustration}
          {/* Floating elements for illustrated variant */}
          {variant === 'illustrated' && (
            <>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-secondary/20 rounded-full animate-pulse" />
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTips = () => {
    if (!showTips || tips.length === 0) return null;

    return (
      <div className={clsx(
        'mt-6',
        'p-4',
        'bg-surface/60',
        'border',
        'border-border/40',
        'rounded-lg',
        'animate-in',
        'slide-in-from-bottom',
        'duration-500',
        'delay-200'
      )}>
        <h4 className="text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Tipps
        </h4>
        <ul className="space-y-1 text-xs text-text-muted">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary/50 rounded-full mt-1.5 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderActions = () => {
    if (!primaryAction && secondaryActions.length === 0) return null;

    return (
      <div className={clsx(
        'mt-6',
        'flex',
        'flex-wrap',
        'gap-3',
        'justify-center',
        animated && 'animate-in slide-in-from-bottom duration-500 delay-300'
      )}>
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary hover:to-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 active:translate-y-0 active:scale-98 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
            {primaryAction.label}
          </button>
        )}

        {secondaryActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-all duration-300',
              action.variant === 'primary' && [
                'bg-gradient-to-r from-secondary to-secondary/80 text-white hover:shadow-lg hover:shadow-secondary/20'
              ],
              action.variant === 'secondary' && [
                'bg-surface border border-border text-text hover:bg-surface-hover hover:border-border-hover'
              ],
              action.variant === 'ghost' && [
                'bg-transparent text-text-muted hover:text-text hover:bg-surface/60'
              ],
              !action.variant && [
                'bg-transparent text-text-muted hover:text-text hover:bg-surface/60 border border-border'
              ]
            )}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={clsx(
      getSizeClasses(),
      getVariantClasses(),
      className
    )}>
      {/* Background patterns for hero variant */}
      {variant === 'hero' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {renderIllustration()}

        <h2 className={clsx(
          'text-2xl',
          'font-bold',
          'text-text',
          'mb-2',
          animated && 'animate-in fade-in-up duration-500'
        )}>
          {title}
        </h2>

        {description && (
          <p className={clsx(
            'text-text-muted',
            'leading-relaxed',
            animated && 'animate-in fade-in-up duration-500 delay-100'
          )}>
            {description}
          </p>
        )}

        {renderActions()}
        {renderTips()}
      </div>

      {/* Decorative elements */}
      {variant === 'illustrated' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-transparent opacity-50" />
      )}
    </div>
  );
};

// Specific empty state variants
export const NoDocumentsState: React.FC<{
  onUpload?: () => void;
  onBrowse?: () => void;
}> = ({ onUpload, onBrowse }) => {
  return (
    <EnhancedEmptyState
      title="Keine Dokumente gefunden"
      description="Laden Sie Ihre ersten Belege hoch, um die KI-gestützte Analyse zu starten."
      variant="hero"
      size="lg"
      animated={true}
      illustration={
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-border/40 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary/60">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl border border-border/40 flex items-center justify-center transform rotate-12">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-secondary/60">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      }
      primaryAction={{
        label: "Beleg hochladen",
        onClick: onUpload || (() => {}),
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      }}
      secondaryActions={[
        {
          label: "Vorlagen anzeigen",
          onClick: onBrowse || (() => {}),
          variant: "ghost",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        }
      ]}
      tips={[
        "Unterstützte Formate: PDF, JPG, PNG, BMP, TIFF",
        "Maximale Dateigröße: 50MB pro Datei",
        "Die KI erkennt automatisch Beträge, Daten und Lieferanten"
      ]}
      showTips={true}
    />
  );
};

export const NoResultsState: React.FC<{
  searchTerm?: string;
  onClearFilter?: () => void;
  onResetFilters?: () => void;
}> = ({ searchTerm, onClearFilter, onResetFilters }) => {
  return (
    <EnhancedEmptyState
      title={searchTerm ? `Keine Ergebnisse für "${searchTerm}"` : "Keine Ergebnisse gefunden"}
      description={searchTerm
        ? "Versuchen Sie es mit einem anderen Suchbegriff oder passen Sie Ihre Filter an."
        : "Passen Sie Ihre Filter an, um mehr Ergebnisse zu finden."
      }
      variant="minimal"
      size="md"
      animated={true}
      illustration={
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-surface to-surface-hover rounded-xl border border-border/40 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-text-muted">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-error/20 rounded-full border border-error/30" />
        </div>
      }
      secondaryActions={[
        onClearFilter && {
          label: "Suche löschen",
          onClick: onClearFilter,
          variant: "ghost",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        },
        onResetFilters && {
          label: "Filter zurücksetzen",
          onClick: onResetFilters,
          variant: "ghost",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v2H4zM4 10h10v2H4zM4 16h16v2H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        }
      ].filter(Boolean) as any}
      tips={searchTerm ? [
        "Überprüfen Sie die Rechtschreibung",
        "Versuchen Sie allgemeinere Suchbegriffe",
        "Nutzen Sie Filter für genauere Ergebnisse"
      ] : [
        "Überprüfen Sie Ihre Filtereinstellungen",
        "Versuchen Sie weniger Filter gleichzeitig",
        "Passen Sie den Zeitraum an"
      ]}
      showTips={true}
    />
  );
};