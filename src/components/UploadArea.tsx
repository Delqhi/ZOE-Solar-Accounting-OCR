/**
 * designOS UploadArea Component
 * File upload with drag-and-drop, progress tracking, and error handling
 */
import React, { useState, useRef } from 'react';
import { 
  Card, 
  PrimaryButton, 
  GhostButton, 
  Stack, 
  Center,
  UploadStatus,
  LoadingSpinner,
  ErrorBoundary
} from './designOS';
import { zoeUploadHandler } from '../services/betterUploadServer';

interface UploadAreaProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName: string;
  error: string | null;
  documentId?: string;
  previewUrl?: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onUploadComplete, onUploadError }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    fileName: '',
    error: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setUploadState(prev => ({ ...prev, status: 'error', error: `Dateityp nicht unterstützt: ${file.name}` }));
        return false;
      }
      if (file.size > maxSize) {
        setUploadState(prev => ({ ...prev, status: 'error', error: `Datei zu groß (max 50MB): ${file.name}` }));
        return false;
      }
    }

    return true;
  };

  const simulateProgress = (interval: number, duration: number) => {
    let progress = 0;
    const step = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      progress += step;
      if (progress >= 90) {
        clearInterval(timer);
        progress = 90;
      }
      setUploadState(prev => ({ ...prev, progress: Math.min(progress, 90) }));
    }, interval);

    return timer;
  };

  const handleFileUpload = async (file: File) => {
    // Create UploadFile interface for better-upload handler
    const uploadFile = {
      name: file.name,
      size: file.type.length, // Placeholder - actual size from file
      type: file.type,
      arrayBuffer: async () => await file.arrayBuffer(),
    };

    try {
      // Start progress simulation
      const progressTimer = simulateProgress(200, 5000);

      // Call upload handler
      const result = await zoeUploadHandler(uploadFile);

      // Clear progress
      clearInterval(progressTimer);

      if (result.success) {
        setUploadState({
          status: 'completed',
          progress: 100,
          fileName: file.name,
          error: null,
          documentId: result.documentId,
          previewUrl: result.previewUrl,
        });

        onUploadComplete?.(result);

        // Reset after 3 seconds
        setTimeout(() => {
          setUploadState({
            status: 'idle',
            progress: 0,
            fileName: '',
            error: null,
          });
        }, 3000);
      } else {
        setUploadState({
          status: 'error',
          progress: 0,
          fileName: file.name,
          error: result.error || 'Upload failed',
        });
        onUploadError?.(result.error || 'Upload failed');
      }
    } catch (error: any) {
      setUploadState({
        status: 'error',
        progress: 0,
        fileName: file.name,
        error: error.message || 'Unexpected error occurred',
      });
      onUploadError?.(error.message || 'Unexpected error occurred');
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;
    
    if (validateFiles(fileArray)) {
      setUploadState(prev => ({ ...prev, status: 'uploading', fileName: fileArray[0].name }));
      
      // Process files one by one (for now, just the first one)
      for (const file of fileArray) {
        await handleFileUpload(file);
      }
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await handleFiles(files);
      event.target.value = ''; // Reset input
    }
  };

  const handleReset = () => {
    setUploadState({
      status: 'idle',
      progress: 0,
      fileName: '',
      error: null,
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <ErrorBoundary>
      <div style={{ width: '100%' }}>
        {/* Upload Status Display */}
        {(uploadState.status !== 'idle' || uploadState.error) && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <UploadStatus
              status={uploadState.status}
              progress={uploadState.progress}
              fileName={uploadState.fileName}
              error={uploadState.error || undefined}
            />
            
            {/* Document ID and Preview (when completed) */}
            {uploadState.status === 'completed' && uploadState.documentId && (
              <Card variant="filled" padding="md" style={{ marginTop: 'var(--spacing-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    Dokument-ID: <strong style={{ color: 'var(--color-text)' }}>{uploadState.documentId}</strong>
                  </span>
                  {uploadState.previewUrl && (
                    <a 
                      href={uploadState.previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: 'var(--color-primary)', 
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      Vorschau →
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Reset Button (on error or completion) */}
            {(uploadState.status === 'completed' || uploadState.status === 'error') && (
              <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', justifyContent: 'center' }}>
                <GhostButton onClick={handleReset} size="sm">
                  {uploadState.status === 'completed' ? 'Nächsten Upload' : 'Versuch erneut'}
                </GhostButton>
              </div>
            )}
          </div>
        )}

        {/* Upload Card */}
        <Card
          variant={isDragging ? 'elevated' : 'outline'}
          padding="lg"
          style={{
            transition: 'all 0.2s ease',
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            borderColor: uploadState.error ? 'var(--color-error)' : 'var(--color-border)',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Stack gap="md">
            <Center>
              <div style={{ textAlign: 'center' }}>
                {/* Upload Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto var(--spacing-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: uploadState.error 
                      ? 'rgba(255, 71, 87, 0.1)' 
                      : isDragging 
                        ? 'rgba(0, 102, 255, 0.1)' 
                        : 'var(--color-surface)',
                  }}
                >
                  {uploadState.status === 'uploading' || uploadState.status === 'processing' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={uploadState.error ? 'var(--color-error)' : isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                      strokeWidth="2"
                    >
                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </div>

                {/* Instructions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <p style={{ 
                    fontSize: 'var(--font-size-lg)', 
                    fontWeight: 500,
                    color: 'var(--color-text)'
                  }}>
                    {uploadState.status === 'uploading' ? 'Lade hoch...' : 
                     uploadState.status === 'processing' ? 'Verarbeite...' :
                     isDragging ? 'Dateien hier ablegen' : 'Dateien hochladen'}
                  </p>
                  <p style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--color-text-muted)' 
                  }}>
                    {uploadState.status === 'uploading' ? 'Bitte warten...' :
                     uploadState.status === 'processing' ? 'AI-Analyse läuft...' :
                     isDragging ? 'Lassen Sie die Dateien los, um sie zu verarbeiten' : 
                     'Klicken Sie zum Auswählen oder ziehen Sie Dateien hierher'}
                  </p>
                  <p style={{ 
                    fontSize: 'var(--font-size-xs)', 
                    color: 'var(--color-text-muted)' 
                  }}>
                    PDF, JPG, PNG • Max. 50MB
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-sm)', 
                  justifyContent: 'center', 
                  paddingTop: 'var(--spacing-md)' 
                }}>
                  <PrimaryButton
                    onClick={triggerFileInput}
                    disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                    size="md"
                  >
                    Dateien auswählen
                  </PrimaryButton>
                  <GhostButton
                    onClick={triggerFileInput}
                    disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                    size="md"
                  >
                    Oder hier klicken
                  </GhostButton>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  id="dropzone-file"
                  type="file"
                  style={{ display: 'none' }}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                />
              </div>
            </Center>
          </Stack>
        </Card>
      </div>
    </ErrorBoundary>
  );
};
