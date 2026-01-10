/**
 * designOS Component Library
 * Auto-generated for Claude Code integration
 */

export const designOS = {
  // Design Tokens
  tokens: {
    colors: {
      primary: '#0066FF',
      secondary: '#FF6B00',
      accent: '#00D4FF',
      success: '#00CC66',
      warning: '#FFB020',
      error: '#FF4757',
      background: '#0A0E14',
      surface: '#151A23',
      text: '#E6EDF3',
      muted: '#8B949E'
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      baseSize: '16px',
      lineHeight: '1.5'
    }
  },
  
  // Component Factory
  button: (options) => ({
    variant: options.variant || 'primary',
    size: options.size || 'md',
    label: options.label || 'Button',
    styles: {
      padding: options.size === 'sm' ? '8px 16px' : 
               options.size === 'lg' ? '16px 32px' : '12px 24px',
      borderRadius: '6px',
      fontWeight: '600'
    }
  }),
  
  input: (options) => ({
    variant: options.variant || 'outline',
    placeholder: options.placeholder || '',
    validation: options.validation || null,
    styles: {
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #30363D'
    }
  }),
  
  card: (options) => ({
    variant: options.variant || 'elevated',
    padding: options.padding || 'md',
    styles: {
      background: '#151A23',
      borderRadius: '8px',
      padding: options.padding === 'sm' ? '12px' :
               options.padding === 'lg' ? '24px' : '16px'
    }
  })
};

// Auto-detection keywords
export const DESIGNOS_KEYWORDS = [
  'designOS',
  'design system',
  'design tokens',
  'theme',
  'component library',
  'ui kit',
  'design language',
  'design tokens',
  'figma',
  'design system'
];

// Component patterns
export const DESIGNOS_PATTERNS = {
  layout: ['stack', 'grid', 'flex', 'cluster'],
  interaction: ['hover', 'focus', 'active', 'disabled'],
  state: ['loading', 'error', 'empty', 'success']
};

// Validation rules
export const DESIGNOS_RULES = {
  colors: 'Use theme tokens only',
  spacing: '8px base unit',
  typography: 'Inter, system-ui, sans-serif',
  components: 'Use designOS components when available'
};