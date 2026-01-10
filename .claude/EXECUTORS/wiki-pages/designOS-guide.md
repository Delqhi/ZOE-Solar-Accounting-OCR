# designOS Guide (Design System Framework)

## 🎯 Overview
**Origin**: Custom design system for Claude Code  
**Core Principle**: Consistent design tokens and components  
**Use Case**: UI/UX development with systematic approach

## 📋 Key Features

### 1. Design Tokens
```javascript
// Colors
{
  primary: '#0066FF',      // Action, Links
  secondary: '#FF6B00',    // Highlights, Alerts
  accent: '#00D4FF',       // Emphasis
  success: '#00CC66',      // Positive
  warning: '#FFB020',      // Caution
  error: '#FF4757',        // Destructive
  background: '#0A0E14',   // Dark mode base
  surface: '#151A23',      // Cards, Panels
  text: '#E6EDF3',         // Primary text
  muted: '#8B949E'         // Secondary text
}

// Spacing
{
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
}

// Typography
{
  fontFamily: 'Inter, system-ui, sans-serif',
  baseSize: '16px',
  lineHeight: '1.5'
}
```

### 2. Component Library

#### Buttons
```tsx
// Primary action
<Button variant="primary" size="md">Submit</Button>

// Secondary action  
<Button variant="secondary" size="md">Cancel</Button>

// Ghost (minimal)
<Button variant="ghost" size="sm">Details</Button>
```

#### Inputs
```tsx
// Filled input
<Input variant="filled" placeholder="Enter text..." />

// With validation
<Input 
  variant="outline" 
  validation="error" 
  message="Required field" 
/>
```

#### Cards
```tsx
// Elevated card
<Card variant="elevated" padding="md">
  <h3>Card Title</h3>
  <p>Content goes here</p>
</Card>
```

### 3. Layout Patterns

#### Stack
```tsx
// Vertical arrangement
<Stack gap="md">
  <Component1 />
  <Component2 />
</Stack>
```

#### Grid
```tsx
// Responsive grid
<Grid columns={3} gap="md">
  <Card />
  <Card />
  <Card />
</Grid>
```

#### Flex
```tsx
// Flexible container
<Flex justify="between" align="center">
  <LeftContent />
  <RightContent />
</Flex>
```

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Build with designOS patterns" → Auto-activate
"Use designOS button component" → Component mode
"Apply designOS spacing scale" → Token mode
"design system" → Full framework
```

### Complete Workflow
```
User: "Build login form with designOS"

Step 1: Design Tokens
├─ Use primary color (#0066FF)
├─ Apply spacing (md: 16px)
├─ Use typography (Inter)
└─ Event: "Tokens applied"

Step 2: Components
├─ Input: filled variant
├─ Button: primary variant
├─ Card: elevated variant
└─ Event: "Components built"

Step 3: Layout
├─ Stack: gap="md"
├─ Center: flex layout
├─ Responsive: grid
└─ Event: "Layout complete"
```

## 📋 Component Patterns

### Button Variants
| Variant | Use Case | Style |
|---------|----------|-------|
| primary | Main action | Blue background |
| secondary | Alternative | Orange background |
| outline | Subtle action | Border only |
| ghost | Minimal action | Text only |

### Button Sizes
| Size | Padding | Use Case |
|------|---------|----------|
| sm | 8px 16px | Compact |
| md | 12px 24px | Standard |
| lg | 16px 32px | Prominent |

### Input Variants
| Variant | Style | Use Case |
|---------|-------|----------|
| filled | Dark background | Forms |
| outline | Border | Standard |
| underline | Bottom border | Minimal |

## 🎨 Theme System

### Dark Mode Native
```css
/* designOS is dark-first */
background: #0A0E14;  /* Dark base */
surface: #151A23;     /* Elevated */
text: #E6EDF3;        /* High contrast */
muted: #8B949E;       /* Low contrast */
```

### Color Harmony
- **Primary**: Action colors
- **Secondary**: Highlights
- **Accent**: Emphasis
- **Semantic**: Success/Warning/Error

## 📊 Quality Rules

### 1. Consistency
```
✅ Always use designOS tokens
✅ Never hardcode colors
✅ Follow spacing scale
✅ Use component library
```

### 2. Accessibility
```
✅ WCAG AA contrast minimum
✅ Focus states visible
✅ Keyboard navigation
✅ Screen reader support
```

### 3. Responsive
```
✅ Mobile-first design
✅ Scale up for larger screens
✅ Touch-friendly targets
✅ Fluid typography
```

## 🔧 Integration with Other Frameworks

### designOS + Amp
- designOS: Consistent UI
- Amp: Concise outputs
- Result: Fast + beautiful

### designOS + Devin
- designOS: Systematic components
- Devin: LSP verification
- Result: Safe + consistent

### designOS + BMAD
- designOS: Phase 3 (Build)
- BMAD: Full workflow
- Result: Complete solution

### designOS + Ralph-Loop
- designOS: Any content
- Ralph: Uncensored
- Result: No restrictions

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| "Use designOS" | Full framework |
| "designOS button" | Component |
| "designOS tokens" | Design tokens |
| "designOS layout" | Layout patterns |

## 🎯 Best Practices

1. **Always** use designOS tokens
2. **Prefer** component library
3. **Maintain** consistency
4. **Check** accessibility
5. **Test** responsive

## 📚 Reference

- **Source**: Custom implementation
- **Framework**: designOS v1.0
- **Pattern**: Design tokens + components
- **Integration**: Full Claude Code support

---

**Next**: See [BMAD Guide](bmad-guide.md) for business method