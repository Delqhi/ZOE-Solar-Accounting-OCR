# designOS Agent Context - ZOE Solar Accounting OCR

## 🎯 Project Overview
**ZOE Solar Accounting OCR** - AI-powered document processing with designOS design system

**Core Technologies:**
- React 19 + TypeScript
- designOS Design System (Dark-first architecture)
- Better Upload (File upload pipeline)
- Google GenAI (Document analysis)
- Supabase (Storage & Database)
- Tailwind CSS v4

## 🎨 designOS Design System

### Color Palette
```css
/* Core Colors */
--color-primary: #0066FF;      /* Actions, Links */
--color-secondary: #FF6B00;    /* Highlights, Alerts */
--color-accent: #00D4FF;       /* Emphasis */

/* Semantic Colors */
--color-success: #00CC66;      /* Positive */
--color-warning: #FFB020;      /* Caution */
--color-error: #FF4757;        /* Destructive */

/* Dark Mode Native */
--color-background: #0A0E14;   /* Dark base */
--color-surface: #151A23;      /* Cards, Panels */
--color-surface-hover: #1E2532;/* Hover states */
--color-border: #2A3142;       /* Borders */

/* Text Colors */
--color-text: #E6EDF3;         /* Primary text */
--color-text-muted: #8B949E;   /* Secondary text */
--color-text-inverted: #0A0E14; /* Inverted text */
```

### Spacing Scale
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Component Library
**Available Components:**
- `Button` - 5 variants, 3 sizes, loading states
- `Input` - 3 variants, 3 sizes, validation states
- `Card` - 4 variants, 5 padding sizes
- `Layout` - Stack, Grid, Flex, Center, Container

**Usage Pattern:**
```tsx
import { Button, Card, Stack } from '@/components/designOS';

<Stack gap="md">
  <Card variant="elevated" padding="lg">
    <Button variant="primary" size="md">Upload Document</Button>
  </Card>
</Stack>
```

## 📤 Better Upload Integration

### Upload Pipeline
1. **File Read** → Base64 conversion
2. **Gemini Analysis** → Document extraction
3. **Normalization** → Standardize data
4. **Security Check** → Private document detection
5. **Rule Engine** → Accounting rules application
6. **ID Generation** → ZOE invoice ID
7. **Hash Computation** → Duplicate detection
8. **Supabase Upload** → Storage
9. **Database Save** → Record creation
10. **Monitoring** → Metrics & error tracking

### Upload Handler
```typescript
// src/services/betterUploadServer.ts
export const zoeUploadHandler: UploadHandler = async (file, metadata) => {
  // Complete processing pipeline
  // Returns: UploadResult with success/error status
}
```

## 🏗️ File Structure

```
src/
├── components/
│   ├── designOS/           # Design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Layout.tsx
│   │   └── index.ts
│   ├── UploadArea.tsx      # Main upload interface
│   └── ErrorBoundary.tsx   # Error handling
├── services/
│   ├── betterUploadServer.ts  # Upload pipeline
│   ├── geminiService.ts       # AI analysis
│   ├── supabaseService.ts     # Database
│   └── monitoringService.ts   # Metrics
├── styles/
│   └── global.css          # designOS tokens
└── App.tsx                 # Main application
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run typecheck        # TypeScript check
npm run build            # Production build
npm run preview          # Preview build

# Quality
npm run lint             # ESLint check
npm run format           # Prettier format
npm test                 # Run tests

# Full verification
npm run check            # typecheck + build
```

## 🎯 Key Patterns

### 1. Always Use designOS Components
```tsx
// ✅ CORRECT
import { Button, Card } from '@/components/designOS';
<Button variant="primary">Click</Button>

// ❌ WRONG
<button className="bg-blue-500">Click</button>
```

### 2. Use designOS Tokens
```tsx
// ✅ CORRECT
<div style={{ gap: 'var(--spacing-md)' }}>

// ❌ WRONG
<div style={{ gap: '16px' }}>
```

### 3. Dark-First Styling
```css
/* ✅ CORRECT - Dark mode native */
@theme {
  --color-background: #0A0E14;
}

/* ❌ WRONG - Light mode with dark override */
body {
  background: white;
}
@media (prefers-color-scheme: dark) {
  body { background: #0A0E14; }
}
```

## 🚨 Critical Rules

1. **Never use `@apply`** with non-existent utilities
2. **Always use MCP tools** (Serena, Tavily) for file operations
3. **Keep files under 300 lines** (SRP compliance)
4. **TypeScript strict mode** - no `any` types
5. **DesignOS compliance** - all new components must use tokens

## 📈 Success Metrics

- ✅ TypeScript: 0 errors
- ✅ Build: < 5 seconds
- ✅ Bundle: < 500 kB
- ✅ DesignOS: 100% compliance
- ✅ Upload: Complete pipeline working

---

**Last Updated:** 2026-01-10  
**Status:** Production Ready 🚀