/**
 * 2026 GLASSMORPHISM 2.0 - MICRO-INTERACTIONS & HAPTIC FEEDBACK
 * Advanced micro-interactions with haptic support for superior UX
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useCallback, useRef, useEffect } from 'react';

export interface HapticFeedbackConfig {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  pattern?: number[]; // Custom vibration pattern
  duration?: number; // Duration for continuous feedback
  enabled?: boolean;
}

export interface MicroInteractionConfig {
  type: 'hover' | 'click' | 'focus' | 'drag' | 'drop' | 'scroll' | 'error' | 'success';
  intensity: 'subtle' | 'medium' | 'strong';
  duration?: number;
  easing?: string;
  enabled?: boolean;
}

export interface UseMicroInteractionsOptions {
  hapticEnabled: boolean;
  visualEnabled: boolean;
  audioEnabled: boolean;
}

export const useMicroInteractions = (options: UseMicroInteractionsOptions = {
  hapticEnabled: true,
  visualEnabled: true,
  audioEnabled: false
}) => {
  const hapticRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Haptic Feedback System
  const triggerHaptic = useCallback((config: HapticFeedbackConfig) => {
    if (!options.hapticEnabled || !navigator.vibrate) return;

    const { type, pattern, duration = 100, enabled = true } = config;

    if (!enabled) return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate([20, 10, 20]);
          break;
        case 'medium':
          navigator.vibrate([40, 20, 40]);
          break;
        case 'heavy':
          navigator.vibrate([80, 40, 80]);
          break;
        case 'success':
          navigator.vibrate([50, 10, 50, 10, 50]);
          break;
        case 'warning':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          navigator.vibrate([150, 75, 150, 75, 150]);
          break;
        default:
          if (pattern) {
            navigator.vibrate(pattern);
          } else {
            navigator.vibrate(duration);
          }
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [options.hapticEnabled]);

  // Visual Micro-Interactions
  const applyVisualEffect = useCallback((element: HTMLElement, config: MicroInteractionConfig) => {
    if (!options.visualEnabled) return;

    const { type, intensity, duration = 200, easing = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' } = config;

    const baseStyle = {
      transition: `all ${duration}ms ${easing}`,
      willChange: 'transform, opacity, filter'
    };

    switch (type) {
      case 'hover':
        element.style.transform = intensity === 'strong' ? 'translateY(-2px)' :
                                  intensity === 'medium' ? 'translateY(-1px)' : 'translateY(-1px)';
        element.style.boxShadow = intensity === 'strong' ? '0 8px 24px rgba(0, 102, 255, 0.3)' :
                                   intensity === 'medium' ? '0 4px 16px rgba(0, 102, 255, 0.2)' : '0 2px 8px rgba(0, 102, 255, 0.15)';
        element.style.filter = intensity === 'strong' ? 'brightness(1.05)' : 'brightness(1.02)';
        break;

      case 'click':
        element.style.transform = 'scale(0.98)';
        element.style.opacity = '0.9';
        setTimeout(() => {
          element.style.transform = '';
          element.style.opacity = '';
        }, duration);
        break;

      case 'focus':
        element.style.outline = intensity === 'strong' ? '3px solid rgba(0, 212, 255, 0.6)' :
                                intensity === 'medium' ? '2px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(0, 212, 255, 0.3)';
        element.style.boxShadow = intensity === 'strong' ? '0 0 0 4px rgba(0, 212, 255, 0.2)' :
                                   intensity === 'medium' ? '0 0 0 3px rgba(0, 212, 255, 0.15)' : '0 0 0 2px rgba(0, 212, 255, 0.1)';
        break;

      case 'drag':
        element.style.opacity = intensity === 'strong' ? '0.6' : '0.8';
        element.style.transform = intensity === 'strong' ? 'rotate(2deg)' : 'rotate(1deg)';
        element.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
        break;

      case 'drop':
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = '0 16px 40px rgba(0, 212, 255, 0.4)';
        setTimeout(() => {
          element.style.transform = '';
          element.style.boxShadow = '';
        }, duration);
        break;

      case 'scroll':
        element.style.opacity = intensity === 'strong' ? '0.8' : '0.95';
        setTimeout(() => {
          element.style.opacity = '';
        }, duration);
        break;

      case 'success':
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = '0 8px 24px rgba(0, 204, 102, 0.4)';
        element.style.border = '2px solid rgba(0, 204, 102, 0.5)';
        setTimeout(() => {
          element.style.transform = '';
          element.style.boxShadow = '';
          element.style.border = '';
        }, duration);
        break;

      case 'error':
        element.style.transform = 'scale(0.98)';
        element.style.boxShadow = '0 8px 24px rgba(255, 71, 87, 0.4)';
        element.style.border = '2px solid rgba(255, 71, 87, 0.5)';
        setTimeout(() => {
          element.style.transform = '';
          element.style.boxShadow = '';
          element.style.border = '';
        }, duration);
        break;
    }
  }, [options.visualEnabled]);

  // Audio Feedback (Optional)
  const playAudioFeedback = useCallback((frequency: number = 880, duration: number = 100) => {
    if (!options.audioEnabled || !window.AudioContext) return;

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  }, [options.audioEnabled]);

  // Combined Interaction Handler
  const triggerInteraction = useCallback((element: HTMLElement, interaction: {
    visual?: MicroInteractionConfig;
    haptic?: HapticFeedbackConfig;
    audio?: { frequency?: number; duration?: number };
  }) => {
    // Visual feedback
    if (interaction.visual) {
      applyVisualEffect(element, interaction.visual);
    }

    // Haptic feedback
    if (interaction.haptic) {
      triggerHaptic(interaction.haptic);
    }

    // Audio feedback
    if (interaction.audio) {
      playAudioFeedback(interaction.audio.frequency, interaction.audio.duration);
    }
  }, [applyVisualEffect, triggerHaptic, playAudioFeedback]);

  // Button Interaction Hook
  const useButtonInteraction = useCallback((elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseDown = () => {
      triggerInteraction(element, {
        visual: { type: 'click', intensity: 'medium' },
        haptic: { type: 'light' }
      });
    };

    const handleMouseEnter = () => {
      triggerInteraction(element, {
        visual: { type: 'hover', intensity: 'medium' }
      });
    };

    const handleFocus = () => {
      triggerInteraction(element, {
        visual: { type: 'focus', intensity: 'medium' }
      });
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('focus', handleFocus);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('focus', handleFocus);
    };
  }, [triggerInteraction]);

  // Input Field Interaction Hook
  const useInputInteraction = useCallback((elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = () => {
      triggerInteraction(element, {
        visual: { type: 'focus', intensity: 'medium' }
      });
    };

    const handleBlur = () => {
      element.style.outline = '';
      element.style.boxShadow = '';
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, [triggerInteraction]);

  // Drag and Drop Interaction Hook
  const useDragInteraction = useCallback((elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current;
    if (!element) return;

    const handleDragStart = () => {
      triggerInteraction(element, {
        visual: { type: 'drag', intensity: 'strong' },
        haptic: { type: 'medium' }
      });
    };

    const handleDragEnd = () => {
      triggerInteraction(element, {
        visual: { type: 'drop', intensity: 'strong' },
        haptic: { type: 'success' }
      });
    };

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);

    return () => {
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragend', handleDragEnd);
    };
  }, [triggerInteraction]);

  // Scroll Interaction Hook
  const useScrollInteraction = useCallback((elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current;
    if (!element) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      element.style.opacity = '0.95';
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        element.style.opacity = '';
      }, 100);
    };

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Success/Error Feedback Hook
  const useFeedbackInteraction = useCallback((elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current;
    if (!element) return;

    const triggerSuccess = () => {
      triggerInteraction(element, {
        visual: { type: 'success', intensity: 'medium' },
        haptic: { type: 'success' },
        audio: { frequency: 880, duration: 150 }
      });
    };

    const triggerError = () => {
      triggerInteraction(element, {
        visual: { type: 'error', intensity: 'strong' },
        haptic: { type: 'error' },
        audio: { frequency: 220, duration: 300 }
      });
    };

    const triggerLoading = () => {
      // Continuous haptic feedback
      if (options.hapticEnabled && navigator.vibrate) {
        hapticRef.current = setInterval(() => {
          navigator.vibrate([50, 50]);
        }, 200);
      }
    };

    const stopLoading = () => {
      if (hapticRef.current) {
        clearInterval(hapticRef.current);
        hapticRef.current = null;
      }
    };

    return {
      triggerSuccess,
      triggerError,
      triggerLoading,
      stopLoading
    };
  }, [triggerInteraction, options.hapticEnabled]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (hapticRef.current) {
        clearInterval(hapticRef.current);
      }
    };
  }, []);

  return {
    triggerHaptic,
    applyVisualEffect,
    playAudioFeedback,
    triggerInteraction,
    useButtonInteraction,
    useInputInteraction,
    useDragInteraction,
    useScrollInteraction,
    useFeedbackInteraction
  };
};

// Hook for global micro-interaction settings
export const useGlobalInteractions = () => {
  const [settings, setSettings] = React.useState({
    hapticEnabled: true,
    visualEnabled: true,
    audioEnabled: false,
    animationSpeed: 1.0
  });

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings
  };
};

// Performance-optimized micro-interaction utilities
export const MicroInteractionUtils = {
  // Debounced interactions to prevent spam
  debounceInteraction: (fn: Function, delay: number = 100) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  // Throttled interactions for high-frequency events
  throttleInteraction: (fn: Function, limit: number = 100) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Smooth easing functions
  easingFunctions: {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    cubicBezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
      // Simplified cubic bezier implementation
      const cx = 3 * x1;
      const bx = 3 * (x2 - x1) - cx;
      const ax = 1 - cx - bx;
      const cy = 3 * y1;
      const by = 3 * (y2 - y1) - cy;
      const ay = 1 - cy - by;

      const solveCurveX = (x: number, t: number) => ((ax * t + bx) * t + cx) * t - x;

      let t0 = 0;
      let t1 = 1;
      let t2 = x;
      let x2 = 0;
      let d2 = 0;

      while (t2 !== 0 && t2 !== 1 && Math.abs(t1 - t0) > 1e-5) {
        x2 = solveCurveX(t2, t0);
        if (x2 > 0) { t1 = t2; } else { t0 = t2; }
        t2 = (t1 - t0) * 0.5 + t0;
      }

      return ((ay * t2 + by) * t2 + cy) * t2;
    }
  },

  // Color manipulation for micro-interactions
  colorUtils: {
    lighten: (color: string, amount: number) => {
      // Simple color lightening logic
      return color;
    },
    darken: (color: string, amount: number) => {
      // Simple color darkening logic
      return color;
    },
    getContrast: (color: string) => {
      // Contrast calculation
      return '#000000';
    }
  }
};

export default useMicroInteractions;