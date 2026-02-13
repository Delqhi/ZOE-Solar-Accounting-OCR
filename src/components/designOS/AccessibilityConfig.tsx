/**
 * 2026 GLASSMORPHISM 2.0 - ACCESSIBILITY CONFIGURATION
 * Advanced accessibility settings and preferences management
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useState, useEffect } from 'react';
import { AccessibleButton, AccessibleInput, AccessibleModal } from './Accessibility';
import { TypographyHeading, TypographyBody, TypographyGradient } from './typography';
import { DepthContainer, DepthCard, FloatingElement } from './depth3D';

export interface AccessibilitySettings {
  skipLinks: boolean;
  focusIndicator: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  voiceNavigation: boolean;
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  colorScheme: 'auto' | 'light' | 'dark';
  navigationSpeed: 'slow' | 'normal' | 'fast';
  announcements: 'polite' | 'assertive' | 'none';
}

export const AccessibilityConfig: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdate: (settings: AccessibilitySettings) => void;
}> = ({ isOpen, onClose, settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleUpdate = () => {
    onUpdate(localSettings);
    onClose();
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));

    // Apply system-wide changes
    if (key === 'highContrast') {
      document.body.style.filter = value ? 'invert(1) hue-rotate(180deg)' : 'none';
    }

    if (key === 'reduceMotion') {
      const style = document.createElement('style');
      style.textContent = value
        ? '* { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }'
        : '';
      document.head.appendChild(style);
    }

    if (key === 'fontSize') {
      document.documentElement.style.fontSize = getFontSizeValue(value);
    }

    if (key === 'colorScheme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  };

  const getFontSizeValue = (size: string) => {
    const sizes = {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    };
    return sizes[size as keyof typeof sizes] || '16px';
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility Settings"
      size="lg"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        {/* Visual Settings */}
        <DepthCard depth={2} style={{ padding: '1.5rem' }}>
          <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
            Visual Settings
          </TypographyHeading>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.highContrast}
                onChange={(e) => updateSetting('highContrast', e.target.checked)}
              />
              <TypographyBody>High Contrast Mode</TypographyBody>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.reduceMotion}
                onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
              />
              <TypographyBody>Reduce Motion</TypographyBody>
            </label>

            <div>
              <TypographyBody style={{ marginBottom: '0.5rem' }}>Font Size</TypographyBody>
              <select
                value={localSettings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="xs">Extra Small</option>
                <option value="sm">Small</option>
                <option value="base">Base</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="2xl">Extra Extra Large</option>
              </select>
            </div>

            <div>
              <TypographyBody style={{ marginBottom: '0.5rem' }}>Color Scheme</TypographyBody>
              <select
                value={localSettings.colorScheme}
                onChange={(e) => updateSetting('colorScheme', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </DepthCard>

        {/* Navigation & Interaction */}
        <DepthCard depth={3} style={{ padding: '1.5rem' }}>
          <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
            Navigation & Interaction
          </TypographyHeading>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.keyboardNavigation}
                onChange={(e) => updateSetting('keyboardNavigation', e.target.checked)}
              />
              <TypographyBody>Enhanced Keyboard Navigation</TypographyBody>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.focusIndicator}
                onChange={(e) => updateSetting('focusIndicator', e.target.checked)}
              />
              <TypographyBody>Show Focus Indicators</TypographyBody>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.screenReaderMode}
                onChange={(e) => updateSetting('screenReaderMode', e.target.checked)}
              />
              <TypographyBody>Screen Reader Mode</TypographyBody>
            </label>

            <div>
              <TypographyBody style={{ marginBottom: '0.5rem' }}>Navigation Speed</TypographyBody>
              <select
                value={localSettings.navigationSpeed}
                onChange={(e) => updateSetting('navigationSpeed', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </div>
        </DepthCard>

        {/* Audio & Announcements */}
        <DepthCard depth={2} style={{ padding: '1.5rem' }}>
          <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
            Audio & Announcements
          </TypographyHeading>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.voiceNavigation}
                onChange={(e) => updateSetting('voiceNavigation', e.target.checked)}
              />
              <TypographyBody>Voice Navigation</TypographyBody>
            </label>

            <div>
              <TypographyBody style={{ marginBottom: '0.5rem' }}>Announcement Priority</TypographyBody>
              <select
                value={localSettings.announcements}
                onChange={(e) => updateSetting('announcements', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="polite">Polite</option>
                <option value="assertive">Assertive</option>
                <option value="none">None</option>
              </select>
            </div>

            <TypographyBody style={{ fontSize: '0.875rem', color: '#666' }}>
              Screen reader announcements help navigate the application.
            </TypographyBody>
          </div>
        </DepthCard>

        {/* Skip Links & Shortcuts */}
        <DepthCard depth={3} style={{ padding: '1.5rem' }}>
          <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
            Skip Links & Shortcuts
          </TypographyHeading>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                checked={localSettings.skipLinks}
                onChange={(e) => updateSetting('skipLinks', e.target.checked)}
              />
              <TypographyBody>Show Skip Links</TypographyBody>
            </label>

            <div style={{ marginTop: '1rem' }}>
              <TypographyBody style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                Keyboard Shortcuts
              </TypographyBody>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <TypographyBody style={{ fontSize: '0.875rem' }}>Ctrl + K</TypographyBody>
                <TypographyBody style={{ fontSize: '0.875rem' }}>Focus search</TypographyBody>

                <TypographyBody style={{ fontSize: '0.875rem' }}>Ctrl + N</TypographyBody>
                <TypographyBody style={{ fontSize: '0.875rem' }}>New document</TypographyBody>

                <TypographyBody style={{ fontSize: '0.875rem' }}>Ctrl + S</TypographyBody>
                <TypographyBody style={{ fontSize: '0.875rem' }}>Save settings</TypographyBody>

                <TypographyBody style={{ fontSize: '0.875rem' }}>Ctrl + A</TypographyBody>
                <TypographyBody style={{ fontSize: '0.875rem' }}>Select all</TypographyBody>

                <TypographyBody style={{ fontSize: '0.875rem' }}>Ctrl + F</TypographyBody>
                <TypographyBody style={{ fontSize: '0.875rem' }}>Focus filter</TypographyBody>

                <TypographyBody style={{ fontSize: '0.875rem' }}>Esc</TypographyBody>
                <TypographyBody style={{ fontSize: '0.875rem' }}>Close modal</TypographyBody>
              </div>
            </div>
          </div>
        </DepthCard>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid #eee'
      }}>
        <AccessibleButton
          onClick={onClose}
          variant="ghost"
        >
          Cancel
        </AccessibleButton>
        <AccessibleButton
          onClick={handleUpdate}
          variant="primary"
        >
          Save Settings
        </AccessibleButton>
      </div>
    </AccessibleModal>
  );
};

// Accessibility utilities
export const AccessibilityUtils = {
  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isTabIndexNotNaN = !isNaN(parseInt(tabIndex || '', 10));

    return (
      element.tagName === 'A' ||
      element.tagName === 'BUTTON' ||
      element.tagName === 'INPUT' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'AREA' ||
      isTabIndexNotNaN
    ) && !element.hasAttribute('disabled') && !element.hasAttribute('aria-hidden');
  },

  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement = document.body): HTMLElement[] => {
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'area[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelector))
      .filter((el): el is HTMLElement => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
  },

  // Focus first focusable element
  focusFirstFocusable: (container: HTMLElement): void => {
    const focusableElements = AccessibilityUtils.getFocusableElements(container);
    focusableElements[0]?.focus();
  },

  // Focus last focusable element
  focusLastFocusable: (container: HTMLElement): void => {
    const focusableElements = AccessibilityUtils.getFocusableElements(container);
    focusableElements[focusableElements.length - 1]?.focus();
  },

  // Trap focus within container
  trapFocus: (container: HTMLElement): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = AccessibilityUtils.getFocusableElements(container);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  },

  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcer = document.getElementById('accessibility-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  },

  // Check for reduced motion preference
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check for high contrast mode
  prefersHighContrast: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Generate unique ID for accessibility
  generateId: (prefix: string = 'element'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Validate form accessibility
  validateFormAccessibility: (form: HTMLFormElement): boolean => {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;

    inputs.forEach((input) => {
      const label = form.querySelector(`label[for="${input.id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');

      if (!label && !ariaLabel && !ariaLabelledby) {
        console.warn('Form input missing accessible label:', input);
        isValid = false;
      }
    });

    return isValid;
  }
};

// WCAG 2.2 AA compliance checker
export const WCAGChecker = {
  // Check color contrast
  checkColorContrast: (foreground: string, background: string): { ratio: number; passesAA: boolean; passesAAA: boolean } => {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;

      const [r, g, b] = rgb.map((c) => {
        const value = parseInt(c, 10) / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7
    };
  },

  // Check keyboard accessibility
  checkKeyboardAccessibility: (element: HTMLElement): boolean => {
    const focusable = AccessibilityUtils.isFocusable(element);
    const hasKeyboardHandler = element.hasAttribute('onkeydown') ||
                              element.hasAttribute('onkeyup') ||
                              element.hasAttribute('onkeypress');

    return focusable || hasKeyboardHandler;
  },

  // Check ARIA implementation
  checkARIA: (element: HTMLElement): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    const ariaDescribedby = element.getAttribute('aria-describedby');

    if (role && !ariaLabel && !ariaLabelledby) {
      issues.push('Element has role but no accessible name');
    }

    if (element.hasAttribute('aria-hidden') && element.hasAttribute('tabindex')) {
      issues.push('Element is hidden but still focusable');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
};

export default AccessibilityConfig;