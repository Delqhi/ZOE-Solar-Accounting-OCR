/**
 * 2026 GLASSMORPHISM 2.0 - MICRO-INTERACTIONS DEMO
 * Comprehensive demo of all micro-interaction and haptic feedback features
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { useState, useRef } from 'react';
import { InteractiveButton, InteractiveInput, InteractiveCard, LoadingSpinner, Toast } from './InteractiveComponents';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { DepthContainer, DepthCard, FloatingElement } from './depth3D';
import { TypographyHeading, TypographyBody } from './typography';
import { useGlobalInteractions } from '../../hooks/useMicroInteractions';

export const MicroInteractionsDemo: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const haptic = useHapticFeedback();
  const { settings, updateSettings } = useGlobalInteractions();

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle haptic settings
  const toggleHaptic = () => {
    const newEnabled = !hapticEnabled;
    setHapticEnabled(newEnabled);
    if (newEnabled) {
      haptic.enable();
      showToast('Haptic feedback enabled', 'success');
    } else {
      haptic.disable();
      showToast('Haptic feedback disabled', 'warning');
    }
  };

  // Show toast messages
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
  };

  // Demo actions
  const handleButtonAction = (action: string) => {
    showToast(`Button action: ${action}`, 'success');
    haptic.trigger(action.toLowerCase().replace(' ', '_'));
  };

  const handleInputAction = () => {
    if (inputValue.trim()) {
      showToast(`Input submitted: ${inputValue}`, 'success');
      haptic.trigger('form_submit');
    } else {
      showToast('Please enter some text', 'warning');
      haptic.trigger('form_error');
    }
  };

  const handleCardAction = () => {
    showToast('Card clicked with haptic feedback', 'info');
    haptic.trigger('button_click');
  };

  const handleLoadingAction = async () => {
    setIsLoading(true);
    showToast('Starting long operation...', 'info');
    haptic.trigger('loading_start');

    // Simulate long operation
    setTimeout(() => {
      setIsLoading(false);
      showToast('Operation completed successfully', 'success');
      haptic.trigger('task_completed');
    }, 3000);
  };

  const handleDragAction = () => {
    showToast('Drag and drop action', 'info');
    haptic.trigger('drag_start');
    setTimeout(() => haptic.trigger('drop_success'), 1000);
  };

  const handleBatchAction = () => {
    showToast('Executing batch operations...', 'info');
    haptic.batchTrigger(['light_tap', 'success_short', 'medium_tap', 'success_long'], 200);
  };

  const handleSuccessAction = () => {
    showToast('Success operation completed', 'success');
    haptic.success();
  };

  const handleErrorAction = () => {
    showToast('Error occurred - check console', 'error');
    haptic.error();
  };

  const handleWarningAction = () => {
    showToast('Warning notification', 'warning');
    haptic.warning();
  };

  return (
    <div ref={containerRef} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <FloatingElement depth={1} height={8} duration={8000} delay={100}>
        <DepthCard depth={3} style={{ padding: '2rem', marginBottom: '2rem' }}>
          <TypographyHeading level="h2" style={{ marginBottom: '1rem' }}>
            🎯 2026 Micro-Interactions & Haptic Feedback Demo
          </TypographyHeading>
          <TypographyBody style={{ color: '#A7B0BD', marginBottom: '2rem' }}>
            Experience the next generation of user interactions with advanced micro-animations, haptic feedback, and glassmorphism 2.0 effects.
          </TypographyBody>

          {/* Control Panel */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <InteractiveButton
              variant="primary"
              onClick={toggleHaptic}
              haptic={true}
              ripple={true}
              glow={true}
            >
              {hapticEnabled ? '🔴 Disable Haptics' : '🟢 Enable Haptics'}
            </InteractiveButton>

            <InteractiveButton
              variant="secondary"
              onClick={() => haptic.test()}
              haptic={true}
            >
              🧪 Test Haptics
            </InteractiveButton>

            <InteractiveButton
              variant="ghost"
              onClick={() => haptic.triggerIntensity('STRONG')}
              haptic={true}
            >
              💥 Strong Vibration
            </InteractiveButton>
          </div>

          {/* Interactive Components Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Input Demo */}
            <DepthCard depth={2} hoverEffect={true} floating={true} style={{ padding: '1.5rem' }}>
              <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
                📝 Interactive Input
              </TypographyHeading>
              <InteractiveInput
                label="Demo Input"
                placeholder="Type here to see floating label..."
                helperText="Try typing and watch the haptic feedback!"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => haptic.trigger('navigation')}
                onBlur={() => haptic.trigger('form_submit')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleInputAction();
                }}
              />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <InteractiveButton
                  variant="ghost"
                  size="sm"
                  onClick={handleInputAction}
                  haptic={true}
                >
                  Submit
                </InteractiveButton>
                <InteractiveButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setInputValue('');
                    showToast('Input cleared', 'info');
                  }}
                  haptic={true}
                >
                  Clear
                </InteractiveButton>
              </div>
            </DepthCard>

            {/* Button Variants Demo */}
            <DepthCard depth={2} hoverEffect={true} floating={true} style={{ padding: '1.5rem' }}>
              <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
                🎨 Button Variants
              </TypographyHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <InteractiveButton
                  variant="primary"
                  onClick={() => handleButtonAction('Save Document')}
                  haptic={true}
                  ripple={true}
                  glow={true}
                >
                  💾 Save Document
                </InteractiveButton>

                <InteractiveButton
                  variant="success"
                  onClick={() => handleButtonAction('Upload File')}
                  haptic={true}
                  ripple={true}
                  glow={true}
                >
                  📤 Upload File
                </InteractiveButton>

                <InteractiveButton
                  variant="danger"
                  onClick={() => handleButtonAction('Delete Item')}
                  haptic={true}
                  ripple={true}
                  glow={true}
                >
                  🗑️ Delete Item
                </InteractiveButton>

                <InteractiveButton
                  variant="secondary"
                  onClick={() => handleButtonAction('Export Data')}
                  haptic={true}
                  ripple={true}
                  glow={true}
                >
                  📤 Export Data
                </InteractiveButton>
              </div>
            </DepthCard>

            {/* Card Interactions Demo */}
            <DepthCard depth={2} hoverEffect={true} floating={true} style={{ padding: '1.5rem' }}>
              <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
                🃏 Interactive Cards
              </TypographyHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InteractiveCard
                  depth={3}
                  hoverEffect={true}
                  clickEffect={true}
                  haptic={true}
                  glow={true}
                  floating={true}
                  onClick={handleCardAction}
                >
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <TypographyHeading level="h5" style={{ marginBottom: '0.5rem' }}>
                      Card 1
                    </TypographyHeading>
                    <TypographyBody>Click me for feedback!</TypographyBody>
                  </div>
                </InteractiveCard>

                <InteractiveCard
                  depth={2}
                  hoverEffect={true}
                  clickEffect={true}
                  haptic={true}
                  glow={true}
                  floating={true}
                  onClick={() => showToast('Second card clicked!', 'success')}
                >
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <TypographyHeading level="h5" style={{ marginBottom: '0.5rem' }}>
                      Card 2
                    </TypographyHeading>
                    <TypographyBody>Another interactive card</TypographyBody>
                  </div>
                </InteractiveCard>
              </div>
            </DepthCard>

            {/* Loading & Status Demo */}
            <DepthCard depth={2} hoverEffect={true} floating={true} style={{ padding: '1.5rem' }}>
              <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
                🔄 Loading & Status
              </TypographyHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  {isLoading ? (
                    <LoadingSpinner size="md" color="#00D4FF" />
                  ) : (
                    <div style={{ width: '24px', height: '24px' }} />
                  )}
                  <TypographyBody>{isLoading ? 'Processing...' : 'Ready to process'}</TypographyBody>
                </div>

                <InteractiveButton
                  variant={isLoading ? 'ghost' : 'primary'}
                  onClick={handleLoadingAction}
                  disabled={isLoading}
                  haptic={true}
                >
                  {isLoading ? '⏳ Processing...' : '🚀 Start Long Operation'}
                </InteractiveButton>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <InteractiveButton
                    variant="success"
                    size="sm"
                    onClick={handleSuccessAction}
                    haptic={true}
                  >
                    ✅ Success
                  </InteractiveButton>
                  <InteractiveButton
                    variant="danger"
                    size="sm"
                    onClick={handleErrorAction}
                    haptic={true}
                  >
                    ❌ Error
                  </InteractiveButton>
                  <InteractiveButton
                    variant="warning"
                    size="sm"
                    onClick={handleWarningAction}
                    haptic={true}
                  >
                    ⚠️ Warning
                  </InteractiveButton>
                </div>
              </div>
            </DepthCard>

            {/* Advanced Interactions Demo */}
            <DepthCard depth={2} hoverEffect={true} floating={true} style={{ padding: '1.5rem' }}>
              <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
                🎭 Advanced Interactions
              </TypographyHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <InteractiveButton
                  variant="secondary"
                  onClick={handleDragAction}
                  haptic={true}
                  ripple={true}
                >
                  🖱️ Drag & Drop Simulation
                </InteractiveButton>

                <InteractiveButton
                  variant="ghost"
                  onClick={handleBatchAction}
                  haptic={true}
                  ripple={true}
                >
                  📦 Batch Operations
                </InteractiveButton>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <InteractiveButton
                    variant="primary"
                    size="sm"
                    onClick={() => haptic.triggerPattern('NAVIGATION')}
                    haptic={true}
                  >
                    🧭 Navigation
                  </InteractiveButton>
                  <InteractiveButton
                    variant="primary"
                    size="sm"
                    onClick={() => haptic.triggerPattern('FORM_SUBMIT')}
                    haptic={true}
                  >
                    📋 Form Submit
                  </InteractiveButton>
                  <InteractiveButton
                    variant="primary"
                    size="sm"
                    onClick={() => haptic.triggerPattern('LOADING_START')}
                    haptic={true}
                  >
                    ⏳ Loading Start
                  </InteractiveButton>
                  <InteractiveButton
                    variant="primary"
                    size="sm"
                    onClick={() => haptic.triggerPattern('SUCCESS_LONG')}
                    haptic={true}
                  >
                    🎉 Success Long
                  </InteractiveButton>
                </div>
              </div>
            </DepthCard>
          </div>

          {/* Pattern Showcase */}
          <DepthCard depth={1} style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
              🔊 Available Haptic Patterns
            </TypographyHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {haptic.patterns.map((pattern) => (
                <div key={pattern.name} style={{
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  <TypographyBody style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    {pattern.name}
                  </TypographyBody>
                  <TypographyBody style={{ fontSize: '12px', color: '#A7B0BD', marginBottom: '0.5rem' }}>
                    Pattern: {pattern.pattern.join(', ')}ms
                  </TypographyBody>
                  <TypographyBody style={{ fontSize: '12px', color: '#A7B0BD' }}>
                    {pattern.description}
                  </TypographyBody>
                  <InteractiveButton
                    variant="ghost"
                    size="sm"
                    onClick={() => haptic.triggerPattern(pattern.name)}
                    style={{ marginTop: '0.5rem', fontSize: '11px' }}
                    haptic={true}
                  >
                    Test Pattern
                  </InteractiveButton>
                </div>
              ))}
            </div>
          </DepthCard>
        </DepthCard>
      </FloatingElement>

      {/* Toast Component */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default MicroInteractionsDemo;