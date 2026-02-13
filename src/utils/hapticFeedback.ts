/**
 * 2026 GLASSMORPHISM 2.0 - HAPTIC FEEDBACK UTILITIES
 * Comprehensive haptic feedback system for all interaction types
 * Version: 2026.0 | Source: 2026 Best Practices
 */

export interface HapticPattern {
  name: string;
  pattern: number[];
  description: string;
  useCases: string[];
}

export interface HapticIntensity {
  name: string;
  duration: number;
  amplitude: number;
  description: string;
}

// Standard haptic patterns
export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  // Basic interactions
  LIGHT_TAP: {
    name: 'Light Tap',
    pattern: [20, 10, 20],
    description: 'Subtle feedback for button presses',
    useCases: ['Button clicks', 'Toggle switches', 'Menu selections']
  },

  MEDIUM_TAP: {
    name: 'Medium Tap',
    pattern: [40, 20, 40],
    description: 'Clear feedback for important actions',
    useCases: ['Form submissions', 'Navigation', 'Confirmations']
  },

  HEAVY_TAP: {
    name: 'Heavy Tap',
    pattern: [80, 40, 80],
    description: 'Strong feedback for critical actions',
    useCases: ['Deletions', 'Warnings', 'Error states']
  },

  // Success patterns
  SUCCESS_SHORT: {
    name: 'Success Short',
    pattern: [50, 10, 50],
    description: 'Quick success confirmation',
    useCases: ['Task completed', 'Save successful', 'Upload complete']
  },

  SUCCESS_LONG: {
    name: 'Success Long',
    pattern: [50, 10, 50, 10, 50],
    description: 'Extended success feedback',
    useCases: ['Large uploads', 'Complex operations', 'Batch processing']
  },

  // Error patterns
  ERROR_SHORT: {
    name: 'Error Short',
    pattern: [100, 50, 100],
    description: 'Quick error notification',
    useCases: ['Form validation', 'Network errors', 'Permission denied']
  },

  ERROR_LONG: {
    name: 'Error Long',
    pattern: [150, 75, 150, 75, 150],
    description: 'Extended error feedback',
    useCases: ['Critical errors', 'System failures', 'Data corruption']
  },

  // Warning patterns
  WARNING_SHORT: {
    name: 'Warning Short',
    pattern: [30, 30, 30],
    description: 'Subtle warning notification',
    useCases: ['Low battery', 'Connection issues', 'Pending actions']
  },

  WARNING_LONG: {
    name: 'Warning Long',
    pattern: [50, 50, 50, 50, 50],
    description: 'Extended warning feedback',
    useCases: ['Security warnings', 'Data loss risk', 'System updates']
  },

  // Navigation patterns
  NAVIGATION: {
    name: 'Navigation',
    pattern: [25, 25, 25],
    description: 'Feedback for navigation actions',
    useCases: ['Page transitions', 'Menu navigation', 'Tab switching']
  },

  DRAG_START: {
    name: 'Drag Start',
    pattern: [30],
    description: 'Feedback when drag begins',
    useCases: ['Drag and drop', 'Sliders', 'Scrolling']
  },

  DRAG_END: {
    name: 'Drag End',
    pattern: [60],
    description: 'Feedback when drag ends',
    useCases: ['Drop actions', 'Snap to position', 'Release']
  },

  // Loading patterns
  LOADING_PULSE: {
    name: 'Loading Pulse',
    pattern: [100, 200],
    description: 'Continuous loading feedback',
    useCases: ['File uploads', 'Data processing', 'Network requests']
  },

  LOADING_RAPID: {
    name: 'Loading Rapid',
    pattern: [50, 50],
    description: 'Rapid loading feedback',
    useCases: ['Quick operations', 'Async tasks', 'Background processing']
  }
};

// Haptic intensities
export const HAPTIC_INTENSITIES: Record<string, HapticIntensity> = {
  SUBTLE: {
    name: 'Subtle',
    duration: 50,
    amplitude: 0.3,
    description: 'Very light feedback'
  },

  LIGHT: {
    name: 'Light',
    duration: 100,
    amplitude: 0.5,
    description: 'Light feedback'
  },

  MEDIUM: {
    name: 'Medium',
    duration: 200,
    amplitude: 0.7,
    description: 'Medium feedback'
  },

  STRONG: {
    name: 'Strong',
    duration: 400,
    amplitude: 1.0,
    description: 'Strong feedback'
  }
};

// Haptic feedback manager
export class HapticManager {
  private isEnabled: boolean;
  private patterns: Map<string, HapticPattern>;
  private intensities: Map<string, HapticIntensity>;

  constructor() {
    this.isEnabled = this.isHapticSupported();
    this.patterns = new Map(Object.entries(HAPTIC_PATTERNS));
    this.intensities = new Map(Object.entries(HAPTIC_INTENSITIES));
  }

  // Check if haptic feedback is supported
  private isHapticSupported(): boolean {
    return 'vibrate' in navigator;
  }

  // Enable/disable haptic feedback
  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  // Basic vibration
  vibrate(pattern: number | number[]): boolean {
    if (!this.isEnabled) return false;

    try {
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(pattern);
      }
      return true;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }

  // Predefined pattern feedback
  triggerPattern(patternName: string): boolean {
    const pattern = this.patterns.get(patternName);
    if (!pattern) {
      console.warn(`Unknown haptic pattern: ${patternName}`);
      return false;
    }

    return this.vibrate(pattern.pattern);
  }

  // Intensity-based feedback
  triggerIntensity(intensityName: string): boolean {
    const intensity = this.intensities.get(intensityName);
    if (!intensity) {
      console.warn(`Unknown haptic intensity: ${intensityName}`);
      return false;
    }

    return this.vibrate(intensity.duration);
  }

  // Contextual feedback
  triggerForContext(context: string, intensity: string = 'MEDIUM'): boolean {
    const contextPatterns: Record<string, string> = {
      // User interactions
      'button_click': 'LIGHT_TAP',
      'toggle_switch': 'LIGHT_TAP',
      'menu_selection': 'LIGHT_TAP',
      'form_submit': 'MEDIUM_TAP',
      'navigation': 'NAVIGATION',

      // Success states
      'save_success': 'SUCCESS_SHORT',
      'upload_complete': 'SUCCESS_LONG',
      'task_completed': 'SUCCESS_SHORT',

      // Error states
      'validation_error': 'ERROR_SHORT',
      'network_error': 'ERROR_SHORT',
      'critical_error': 'ERROR_LONG',

      // Warnings
      'low_battery': 'WARNING_SHORT',
      'connection_issue': 'WARNING_SHORT',
      'security_warning': 'WARNING_LONG',

      // Drag and drop
      'drag_start': 'DRAG_START',
      'drag_end': 'DRAG_END',
      'drop_success': 'SUCCESS_SHORT',
      'drop_error': 'ERROR_SHORT',

      // Loading states
      'loading_start': 'LOADING_PULSE',
      'loading_end': 'LIGHT_TAP'
    };

    const patternName = contextPatterns[context];
    if (!patternName) {
      console.warn(`No haptic pattern defined for context: ${context}`);
      return this.triggerIntensity(intensity);
    }

    return this.triggerPattern(patternName);
  }

  // Continuous feedback (for loading states)
  startContinuous(pattern: number[] = [100, 200]): NodeJS.Timeout | null {
    if (!this.isEnabled) return null;

    return setInterval(() => {
      this.vibrate(pattern);
    }, pattern.reduce((a, b) => a + b, 0));
  }

  stopContinuous(intervalId: NodeJS.Timeout | null): void {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }

  // Batch feedback (for multiple actions)
  triggerBatch(patterns: string[], delay: number = 100): Promise<boolean[]> {
    return new Promise((resolve) => {
      const results: boolean[] = [];
      let currentIndex = 0;

      const triggerNext = () => {
        if (currentIndex >= patterns.length) {
          resolve(results);
          return;
        }

        const pattern = patterns[currentIndex];
        const success = this.triggerPattern(pattern);
        results.push(success);

        currentIndex++;
        setTimeout(triggerNext, delay);
      };

      triggerNext();
    });
  }

  // Custom pattern creation
  createPattern(name: string, pattern: number[], description: string, useCases: string[]): void {
    this.patterns.set(name, {
      name,
      pattern,
      description,
      useCases
    });
  }

  // Get all available patterns
  getAvailablePatterns(): HapticPattern[] {
    return Array.from(this.patterns.values());
  }

  // Get all available intensities
  getAvailableIntensities(): HapticIntensity[] {
    return Array.from(this.intensities.values());
  }

  // Test haptic feedback
  test(): boolean {
    return this.triggerPattern('LIGHT_TAP');
  }
}

// Global haptic manager instance
export const hapticManager = new HapticManager();

// React hook for haptic feedback
export const useHapticFeedback = () => {
  const trigger = (context: string, intensity?: string) => {
    return hapticManager.triggerForContext(context, intensity);
  };

  const triggerPattern = (patternName: string) => {
    return hapticManager.triggerPattern(patternName);
  };

  const triggerIntensity = (intensityName: string) => {
    return hapticManager.triggerIntensity(intensityName);
  };

  const startContinuous = (pattern?: number[]) => {
    return hapticManager.startContinuous(pattern);
  };

  const stopContinuous = (intervalId: NodeJS.Timeout | null) => {
    hapticManager.stopContinuous(intervalId);
  };

  const batchTrigger = (patterns: string[], delay?: number) => {
    return hapticManager.triggerBatch(patterns, delay);
  };

  return {
    trigger,
    triggerPattern,
    triggerIntensity,
    startContinuous,
    stopContinuous,
    batchTrigger,
    test: hapticManager.test,
    isSupported: hapticManager.isEnabled,
    enable: hapticManager.enable,
    disable: hapticManager.disable,
    patterns: hapticManager.getAvailablePatterns(),
    intensities: hapticManager.getAvailableIntensities()
  };
};

// Utility functions for common haptic patterns
export const hapticUtils = {
  // Quick success feedback
  success: () => hapticManager.triggerPattern('SUCCESS_SHORT'),

  // Error feedback
  error: () => hapticManager.triggerPattern('ERROR_SHORT'),

  // Warning feedback
  warning: () => hapticManager.triggerPattern('WARNING_SHORT'),

  // Button click feedback
  buttonClick: () => hapticManager.triggerPattern('LIGHT_TAP'),

  // Navigation feedback
  navigation: () => hapticManager.triggerPattern('NAVIGATION'),

  // Loading feedback
  loadingStart: () => hapticManager.triggerPattern('LOADING_PULSE'),

  // Drag and drop feedback
  dragStart: () => hapticManager.triggerPattern('DRAG_START'),
  dragEnd: () => hapticManager.triggerPattern('DRAG_END'),
  dropSuccess: () => hapticManager.triggerPattern('SUCCESS_SHORT'),
  dropError: () => hapticManager.triggerPattern('ERROR_SHORT'),

  // Form feedback
  formSubmit: () => hapticManager.triggerPattern('MEDIUM_TAP'),
  formError: () => hapticManager.triggerPattern('ERROR_SHORT'),

  // File operations
  fileUpload: () => hapticManager.triggerPattern('SUCCESS_LONG'),
  fileDelete: () => hapticManager.triggerPattern('HEAVY_TAP')
};

export default hapticManager;