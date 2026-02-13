/**
 * designOS Component Demo
 * Comprehensive showcase of all designOS components
 */

import { useState } from 'react';
import {
  // Buttons
  Button,
  PrimaryButton,
  SecondaryButton,
  AccentButton,
  GhostButton,
  OutlineButton,
  
  // Inputs
  Input,
  FilledInput,
  OutlineInput,
  UnderlineInput,
  
  // Cards
  Card,
  ElevatedCard,
  FilledCard,
  OutlineCard,
  GhostCard,
  
  // Layout
  Stack,
  Grid,
  Flex,
  Center,
  Container,
  
  // Progress
  Progress,
  PrimaryProgress,
  SecondaryProgress,
  SuccessProgress,
  ErrorProgress,
  UploadStatus,
  
  // Theme
  ThemeSwitcher,
  useTheme,
  
  // Error & Loading
  ErrorBoundary,
  LoadingSpinner,
  LoadingWrapper,
  Skeleton,
  SkeletonGroup,
  
  // File Preview
  FilePreview,
  FilePreviewList,
  UploadQueue,
  
  // Toast
  Toast,
  useToast,
  ToastProvider,
} from './designOS';

// Demo Component
export const DesignOSDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const { showToast, ToastContainer } = useToast();

  // Button Demo
  const ButtonDemo = () => (
    <Card variant="elevated" padding="lg">
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Buttons</h3>
      <Stack gap="md">
        <Flex wrap gap="sm">
          <PrimaryButton onClick={() => showToast('Primary button clicked!', 'success')}>
            Primary
          </PrimaryButton>
          <SecondaryButton onClick={() => showToast('Secondary button clicked!', 'info')}>
            Secondary
          </SecondaryButton>
          <AccentButton onClick={() => showToast('Accent button clicked!', 'info')}>
            Accent
          </AccentButton>
          <GhostButton onClick={() => showToast('Ghost button clicked!', 'warning')}>
            Ghost
          </GhostButton>
          <OutlineButton onClick={() => showToast('Outline button clicked!', 'info')}>
            Outline
          </OutlineButton>
        </Flex>
        
        <Flex wrap gap="sm">
          <PrimaryButton size="sm">Small</PrimaryButton>
          <PrimaryButton size="md">Medium</PrimaryButton>
          <PrimaryButton size="lg">Large</PrimaryButton>
          <PrimaryButton disabled>Disabled</PrimaryButton>
          <PrimaryButton>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            With Icon
          </PrimaryButton>
        </Flex>
      </Stack>
    </Card>
  );

  // Input Demo
  const InputDemo = () => {
    const [values, setValues] = useState({ filled: '', outline: '', underline: '' });

    return (
      <Card variant="elevated" padding="lg">
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Inputs</h3>
        <Stack gap="md">
          <FilledInput
            placeholder="Filled Input"
            value={values.filled}
            onChange={(e) => setValues({ ...values, filled: e.target.value })}
            label="Filled Input"
            inputSize="md"
          />
          <OutlineInput
            placeholder="Outline Input"
            value={values.outline}
            onChange={(e) => setValues({ ...values, outline: e.target.value })}
            label="Outline Input"
            inputSize="md"
          />
          <UnderlineInput
            placeholder="Underline Input"
            value={values.underline}
            onChange={(e) => setValues({ ...values, underline: e.target.value })}
            label="Underline Input"
            inputSize="md"
          />
          
          <Grid columns={3} gap="md">
            <FilledInput
              placeholder="Small"
              inputSize="sm"
              label="Small Input"
            />
            <FilledInput
              placeholder="Medium"
              inputSize="md"
              label="Medium Input"
            />
            <FilledInput
              placeholder="Large"
              inputSize="lg"
              label="Large Input"
            />
          </Grid>

          <Grid columns={3} gap="md">
            <OutlineInput
              placeholder="Success"
              validation="success"
              label="Success State"
            />
            <OutlineInput
              placeholder="Warning"
              validation="warning"
              label="Warning State"
            />
            <OutlineInput
              placeholder="Error"
              validation="error"
              label="Error State"
            />
          </Grid>
        </Stack>
      </Card>
    );
  };

  // Card Demo
  const CardDemo = () => (
    <Card variant="elevated" padding="lg">
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Cards</h3>
      <Grid columns={2} gap="md">
        <ElevatedCard padding="md">
          <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Elevated Card</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Shadow elevation for depth
          </p>
        </ElevatedCard>
        <FilledCard padding="md">
          <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Filled Card</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Solid background surface
          </p>
        </FilledCard>
        <OutlineCard padding="md">
          <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Outline Card</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Border only styling
          </p>
        </OutlineCard>
        <GhostCard padding="md">
          <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Ghost Card</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Minimal transparent style
          </p>
        </GhostCard>
      </Grid>
    </Card>
  );

  // Progress Demo
  const ProgressDemo = () => {
    const [demoProgress, setDemoProgress] = useState(0);

    return (
      <Card variant="elevated" padding="lg">
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Progress & Status</h3>
        <Stack gap="md">
          <PrimaryProgress value={demoProgress} label="Primary Progress" />
          <SecondaryProgress value={demoProgress} label="Secondary Progress" />
          <SuccessProgress value={demoProgress} label="Success Progress" />
          <ErrorProgress value={demoProgress} label="Error Progress" />
          
          <Flex gap="sm" justify="center">
            <PrimaryButton size="sm" onClick={() => setDemoProgress(Math.max(0, demoProgress - 10))}>
              -10%
            </PrimaryButton>
            <PrimaryButton size="sm" onClick={() => setDemoProgress(Math.min(100, demoProgress + 10))}>
              +10%
            </PrimaryButton>
            <GhostButton size="sm" onClick={() => setDemoProgress(0)}>
              Reset
            </GhostButton>
          </Flex>

          <UploadStatus status="uploading" progress={45} fileName="document.pdf" />
          <UploadStatus status="processing" progress={78} fileName="invoice.jpg" />
          <UploadStatus status="completed" fileName="receipt.png" />
          <UploadStatus status="error" fileName="failed.pdf" error="Upload fehlgeschlagen" />
        </Stack>
      </Card>
    );
  };

  // Loading Demo
  const LoadingDemo = () => (
    <Card variant="elevated" padding="lg">
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Loading & Skeleton</h3>
      <Stack gap="md">
        <Flex gap="md" wrap>
          <LoadingSpinner size="sm" label="Small" />
          <LoadingSpinner size="md" label="Medium" />
          <LoadingSpinner size="lg" label="Large" />
        </Flex>

        <LoadingWrapper isLoading={isLoading} loadingComponent={<LoadingSpinner size="md" label="Loading data..." />}>
          <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--color-text)' }}>Content loaded successfully!</p>
          </div>
        </LoadingWrapper>

        <PrimaryButton onClick={() => setIsLoading(!isLoading)}>
          Toggle Loading State
        </PrimaryButton>

        <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Skeleton Placeholders</h4>
        <SkeletonGroup count={4} />
      </Stack>
    </Card>
  );

  // File Preview Demo
  const FilePreviewDemo = () => {
    const [files, setFiles] = useState([
      { id: '1', name: 'invoice_2024.pdf', size: 2456789, type: 'pdf' as const, documentId: 'ZOE-2024-001' },
      { id: '2', name: 'receipt.jpg', size: 1234567, type: 'jpg' as const, previewUrl: 'https://via.placeholder.com/150' },
      { id: '3', name: 'scan.png', size: 890123, type: 'png' as const, documentId: 'ZOE-2024-002' },
    ]);

    // Mock File objects for the queue
    const mockFile1 = new File([''], 'upload1.pdf', { type: 'application/pdf' });
    const mockFile2 = new File([''], 'upload2.jpg', { type: 'image/jpeg' });
    const mockFile3 = new File([''], 'upload3.pdf', { type: 'application/pdf' });

    const [queue, setQueue] = useState([
      { id: 'q1', file: mockFile1, status: 'uploading' as const, progress: 45 },
      { id: 'q2', file: mockFile2, status: 'processing' as const, progress: 80 },
      { id: 'q3', file: mockFile3, status: 'error' as const, progress: 0, error: 'Netzwerkfehler' },
    ]);

    return (
      <Card variant="elevated" padding="lg">
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>File Preview & Queue</h3>
        <Stack gap="md">
          <FilePreviewList
            files={files}
            onRemoveFile={(id) => setFiles(files.filter(f => f.id !== id))}
            onDownloadFile={(id) => showToast(`Download: ${id}`, 'info')}
          />

          <UploadQueue
            queue={queue}
            onRemoveItem={(id) => setQueue(queue.filter(q => q.id !== id))}
            onRetryItem={(id) => showToast(`Retry: ${id}`, 'info')}
          />
        </Stack>
      </Card>
    );
  };

  // Toast Demo
  const ToastDemo = () => (
    <Card variant="elevated" padding="lg">
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Toast Notifications</h3>
      <Stack gap="md">
        <Flex wrap gap="sm">
          <PrimaryButton onClick={() => showToast('Erfolgreich gespeichert!', 'success', 3000, 'top-right')}>
            Success Toast
          </PrimaryButton>
          <SecondaryButton onClick={() => showToast('Ein Fehler ist aufgetreten', 'error', 4000, 'top-center')}>
            Error Toast
          </SecondaryButton>
          <AccentButton onClick={() => showToast('Bitte überprüfen Sie die Daten', 'warning', 5000, 'bottom-left')}>
            Warning Toast
          </AccentButton>
          <GhostButton onClick={() => showToast('Information: System aktualisiert', 'info', 3000, 'bottom-right')}>
            Info Toast
          </GhostButton>
        </Flex>

        <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Positionen</h4>
        <Flex wrap gap="sm">
          <OutlineButton onClick={() => showToast('Top Right', 'info', 2000, 'top-right')}>TR</OutlineButton>
          <OutlineButton onClick={() => showToast('Top Left', 'info', 2000, 'top-left')}>TL</OutlineButton>
          <OutlineButton onClick={() => showToast('Top Center', 'info', 2000, 'top-center')}>TC</OutlineButton>
          <OutlineButton onClick={() => showToast('Bottom Right', 'info', 2000, 'bottom-right')}>BR</OutlineButton>
          <OutlineButton onClick={() => showToast('Bottom Left', 'info', 2000, 'bottom-left')}>BL</OutlineButton>
          <OutlineButton onClick={() => showToast('Bottom Center', 'info', 2000, 'bottom-center')}>BC</OutlineButton>
        </Flex>
      </Stack>
    </Card>
  );

  // Layout Demo
  const LayoutDemo = () => (
    <Card variant="elevated" padding="lg">
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Layout Components</h3>
      <Stack gap="lg">
        <div>
          <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-text)' }}>Stack (Vertical)</h4>
          <Stack gap="sm">
            <Card variant="outline" padding="sm">Item 1</Card>
            <Card variant="outline" padding="sm">Item 2</Card>
            <Card variant="outline" padding="sm">Item 3</Card>
          </Stack>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-text)' }}>Flex (Horizontal)</h4>
          <Flex gap="sm" wrap>
            <Card variant="outline" padding="sm">Item 1</Card>
            <Card variant="outline" padding="sm">Item 2</Card>
            <Card variant="outline" padding="sm">Item 3</Card>
          </Flex>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-text)' }}>Grid (2 Columns)</h4>
          <Grid columns={2} gap="sm">
            <Card variant="outline" padding="sm">Grid 1</Card>
            <Card variant="outline" padding="sm">Grid 2</Card>
            <Card variant="outline" padding="sm">Grid 3</Card>
            <Card variant="outline" padding="sm">Grid 4</Card>
          </Grid>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-text)' }}>Center</h4>
          <Center>
            <Card variant="filled" padding="md" style={{ width: '200px' }}>
              Centered Content
            </Card>
          </Center>
        </div>
      </Stack>
    </Card>
  );

  // Error Boundary Demo
  const ErrorDemo = () => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
      throw new Error('This is a test error for ErrorBoundary demo');
    }

    return (
      <Card variant="elevated" padding="lg">
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text)' }}>Error Boundary</h3>
        <Stack gap="md">
          <p style={{ color: 'var(--color-text-muted)' }}>
            Click the button to trigger an error and see the ErrorBoundary in action.
          </p>
          <PrimaryButton onClick={() => setHasError(true)}>
            Trigger Error
          </PrimaryButton>
        </Stack>
      </Card>
    );
  };

  return (
    <ToastProvider>
      <Container style={{ maxWidth: '1200px', padding: 'var(--spacing-xl)' }}>
        <Stack gap="xl">
          {/* Header */}
          <Center>
            <Card variant="elevated" padding="xl" style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', color: 'var(--color-text)' }}>
                designOS Component Library
              </h1>
              <p style={{ margin: 'var(--spacing-md) 0 0 0', color: 'var(--color-text-muted)' }}>
                Complete showcase of all designOS components with live examples
              </p>
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <ThemeSwitcher />
              </div>
            </Card>
          </Center>

          {/* Component Demos */}
          <Grid columns={1} gap="xl">
            <ButtonDemo />
            <InputDemo />
            <CardDemo />
            <ProgressDemo />
            <LoadingDemo />
            <FilePreviewDemo />
            <ToastDemo />
            <LayoutDemo />
            
            <ErrorBoundary>
              <ErrorDemo />
            </ErrorBoundary>
          </Grid>

          {/* Footer */}
          <Center>
            <Card variant="ghost" padding="md">
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                designOS v1.0 • All components are production-ready • Dark-first architecture
              </p>
            </Card>
          </Center>
        </Stack>
      </Container>

      {/* Toast Container (required for toasts to work) */}
      <ToastContainer />
    </ToastProvider>
  );
};

export default DesignOSDemo;