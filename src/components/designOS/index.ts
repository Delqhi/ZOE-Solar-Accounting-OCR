/**
 * designOS Design System - Component Library
 * Export all designOS components for easy import
 */

// Buttons
export { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  AccentButton, 
  GhostButton, 
  OutlineButton 
} from './Button';

// Inputs
export { 
  Input, 
  FilledInput, 
  OutlineInput, 
  UnderlineInput 
} from './Input';

// Cards
export { 
  Card, 
  ElevatedCard, 
  FilledCard, 
  OutlineCard, 
  GhostCard 
} from './Card';

// Layout
export { 
  Stack, 
  Grid, 
  Flex, 
  Center, 
  Container 
} from './Layout';

// Types
export type { ButtonVariant, ButtonSize } from './Button';
export type { InputVariant, InputSize, ValidationState } from './Input';
export type { CardVariant, CardPadding } from './Card';

// Progress
export { 
  Progress, 
  PrimaryProgress, 
  SecondaryProgress, 
  SuccessProgress, 
  ErrorProgress,
  UploadStatus,
  createUploadProgress
} from './Progress';
export type { ProgressProps, ProgressVariant, ProgressSize, UploadStatusProps, UploadProgress } from './Progress';

// Theme Switcher
export { ThemeSwitcher, useTheme, ThemeProvider } from './ThemeSwitcher';
export type { Theme, ThemeSwitcherProps } from './ThemeSwitcher';

// Error Boundary & Loading
export { 
  ErrorBoundary, 
  LoadingSpinner, 
  LoadingWrapper, 
  Skeleton, 
  SkeletonGroup 
} from './ErrorBoundary';
export type { 
  LoadingSpinnerProps, 
  LoadingWrapperProps, 
  SkeletonProps 
} from './ErrorBoundary';

// File Preview
export { 
  FilePreview, 
  FilePreviewList, 
  UploadQueue,
  getFileType,
  formatFileSize
} from './FilePreview';
export type { 
  FilePreviewProps, 
  FilePreviewListProps, 
  UploadQueueProps,
  UploadQueueItem,
  FileType 
} from './FilePreview';

// Toast
export { 
  Toast, 
  ToastProvider, 
  useToast,
  createToastAPI
} from './Toast';
export type { 
  ToastProps, 
  ToastVariant, 
  ToastPosition,
  UseToastReturn 
} from './Toast';