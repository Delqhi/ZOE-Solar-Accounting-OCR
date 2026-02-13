/** 
 * designOS Progress Components
 * Upload progress tracking with designOS styling
 */



export type ProgressVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  value: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  label?: string;
  className?: string;
  showPercentage?: boolean;
}

const variantColors: Record<ProgressVariant, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
};

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'height: 4px;',
  md: 'height: 8px;',
  lg: 'height: 12px;',
};

export function Progress({
  value,
  variant = 'primary',
  size = 'md',
  label,
  className = '',
  showPercentage = true,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <div 
      className={`progress-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
        width: '100%',
      }}
    >
      {(label || showPercentage) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          height: size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            backgroundColor: variantColors[variant],
            height: '100%',
            transition: 'width 0.3s ease',
            borderRadius: 'var(--radius-full)',
          }}
        />
      </div>
    </div>
  );
}

// Specialized variants
export function PrimaryProgress(props: Omit<ProgressProps, 'variant'>) {
  return <Progress {...props} variant="primary" />;
}

export function SecondaryProgress(props: Omit<ProgressProps, 'variant'>) {
  return <Progress {...props} variant="secondary" />;
}

export function SuccessProgress(props: Omit<ProgressProps, 'variant'>) {
  return <Progress {...props} variant="success" />;
}

export function ErrorProgress(props: Omit<ProgressProps, 'variant'>) {
  return <Progress {...props} variant="error" />;
}

// Upload Status Card
export interface UploadStatusProps {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  fileName?: string;
  error?: string;
}

export function UploadStatus({ 
  status, 
  progress = 0, 
  fileName, 
  error 
}: UploadStatusProps) {
  const statusConfig = {
    idle: { color: 'var(--color-text-muted)', text: 'Ready to upload' },
    uploading: { color: 'var(--color-primary)', text: 'Uploading...' },
    processing: { color: 'var(--color-secondary)', text: 'Processing with AI...' },
    completed: { color: 'var(--color-success)', text: 'Upload completed!' },
    error: { color: 'var(--color-error)', text: 'Error occurred' },
  };

  const config = statusConfig[status];

  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--color-border)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        <span style={{ color: config.color, fontWeight: 500 }}>
          {config.text}
        </span>
        {fileName && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {fileName}
          </span>
        )}
      </div>
      
      {(status === 'uploading' || status === 'processing') && (
        <Progress 
          value={progress} 
          variant={status === 'processing' ? 'secondary' : 'primary'}
          size="md"
          showPercentage={status === 'uploading'}
        />
      )}
      
      {error && (
        <div
          style={{
            marginTop: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'rgba(255, 71, 87, 0.1)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

// Upload Progress Hook (for integration)
export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName: string;
  error: string | null;
  setProgress: (value: number) => void;
  setStatus: (status: UploadProgress['status']) => void;
  setFileName: (name: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function createUploadProgress(): UploadProgress {
  return {
    status: 'idle',
    progress: 0,
    fileName: '',
    error: null,
    setProgress(value) { this.progress = value; },
    setStatus(status) { this.status = status; },
    setFileName(name) { this.fileName = name; },
    setError(error) { this.error = error; },
    reset() {
      this.status = 'idle';
      this.progress = 0;
      this.fileName = '';
      this.error = null;
    },
  };
}