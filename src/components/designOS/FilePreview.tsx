/**
 * designOS File Preview Components
 * Preview uploaded files with thumbnails and metadata
 */

import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Stack } from './Layout';

export type FileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'unknown';

export interface FilePreviewProps {
  fileName: string;
  fileSize: number;
  fileType: FileType;
  previewUrl?: string;
  documentId?: string;
  onRemove?: () => void;
  onDownload?: () => void;
  className?: string;
}

// Helper to get file type from name
export function getFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  if (ext === 'png') return 'png';
  return 'unknown';
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File icon SVGs
const FileIcons = {
  pdf: (color: string = 'currentColor') => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  image: (color: string = 'currentColor') => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  unknown: (color: string = 'currentColor') => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="12" y1="6" x2="12.01" y2="6" />
    </svg>
  ),
};

export function FilePreview({
  fileName,
  fileSize,
  fileType: propFileType,
  previewUrl,
  documentId,
  onRemove,
  onDownload,
  className = '',
}: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);
  
  const fileType = propFileType || getFileType(fileName);
  const isImage = fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png';
  const showPreview = isImage && previewUrl && !imageError;

  const iconColor = fileType === 'pdf' ? 'var(--color-error)' : 
                    isImage ? 'var(--color-primary)' : 
                    'var(--color-text-muted)';

  return (
    <Card
      variant="filled"
      padding="md"
      className={className}
      style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'center',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Preview or Icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `1px solid var(--color-border)`,
        }}
      >
        {showPreview ? (
          <img
            src={previewUrl}
            alt={fileName}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          FileIcons[fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png' ? 'image' : fileType === 'pdf' ? 'pdf' : 'unknown'](iconColor)
        )}
      </div>

      {/* File Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--spacing-sm)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={fileName}
            >
              {fileName}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: '2px',
              }}
            >
              {formatFileSize(fileSize)} • {fileType.toUpperCase()}
            </div>
            {documentId && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-primary)',
                  marginTop: '2px',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                ID: {documentId}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                aria-label="Download"
                style={{ padding: '6px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                aria-label="Remove"
                style={{ padding: '6px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// File Preview List
export interface FilePreviewListProps {
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: FileType;
    previewUrl?: string;
    documentId?: string;
  }>;
  onRemoveFile?: (id: string) => void;
  onDownloadFile?: (id: string) => void;
  emptyMessage?: string;
}

export function FilePreviewList({ 
  files, 
  onRemoveFile, 
  onDownloadFile,
  emptyMessage = 'Keine Dateien hochgeladen'
}: FilePreviewListProps) {
  if (files.length === 0) {
    return (
      <Card variant="ghost" padding="lg">
        <div
          style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {emptyMessage}
        </div>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      {files.map((file) => (
        <FilePreview
          key={file.id}
          fileName={file.name}
          fileSize={file.size}
          fileType={file.type}
          previewUrl={file.previewUrl}
          documentId={file.documentId}
          onRemove={() => onRemoveFile?.(file.id)}
          onDownload={() => onDownloadFile?.(file.id)}
        />
      ))}
    </Stack>
  );
}

// Upload Queue Item
export interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
  previewUrl?: string;
}

export interface UploadQueueProps {
  queue: UploadQueueItem[];
  onRemoveItem?: (id: string) => void;
  onRetryItem?: (id: string) => void;
}

export function UploadQueue({ queue, onRemoveItem, onRetryItem }: UploadQueueProps) {
  if (queue.length === 0) return null;

  return (
    <Card variant="elevated" padding="lg">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Upload Queue ({queue.length})
        </h3>
      </div>

      <Stack gap="sm">
        {queue.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid var(--color-border)`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.file.name}
                >
                  {item.file.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {formatFileSize(item.file.size)}
                  {item.documentId && ` • ${item.documentId}`}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  backgroundColor:
                    item.status === 'completed' ? 'rgba(0, 204, 102, 0.1)' :
                    item.status === 'error' ? 'rgba(255, 71, 87, 0.1)' :
                    item.status === 'processing' ? 'rgba(255, 107, 0, 0.1)' :
                    item.status === 'uploading' ? 'rgba(0, 102, 255, 0.1)' :
                    'rgba(139, 148, 158, 0.1)',
                  color:
                    item.status === 'completed' ? 'var(--color-success)' :
                    item.status === 'error' ? 'var(--color-error)' :
                    item.status === 'processing' ? 'var(--color-secondary)' :
                    item.status === 'uploading' ? 'var(--color-primary)' :
                    'var(--color-text-muted)',
                }}
              >
                {item.status === 'uploading' ? 'Lädt...' :
                 item.status === 'processing' ? 'Verarbeitet...' :
                 item.status === 'completed' ? 'Fertig' :
                 item.status === 'error' ? 'Fehler' : 'Ausstehend'}
              </div>
            </div>

            {/* Progress Bar */}
            {(item.status === 'uploading' || item.status === 'processing') && (
              <div
                style={{
                  height: '4px',
                  backgroundColor: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginTop: 'var(--spacing-xs)',
                }}
              >
                <div
                  style={{
                    width: `${item.progress}%`,
                    height: '100%',
                    backgroundColor: item.status === 'processing' ? 'var(--color-secondary)' : 'var(--color-primary)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {item.error && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-error)',
                  marginTop: 'var(--spacing-xs)',
                }}
              >
                {item.error}
              </div>
            )}

            {/* Actions */}
            {(item.status === 'error' || item.status === 'completed') && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-xs)',
                  marginTop: 'var(--spacing-sm)',
                }}
              >
                {item.status === 'error' && onRetryItem && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onRetryItem(item.id)}
                  >
                    Erneut versuchen
                  </Button>
                )}
                {onRemoveItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    Entfernen
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </Stack>
    </Card>
  );
}