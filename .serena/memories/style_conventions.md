# Style Conventions & Best Practices - ZOE Solar Accounting OCR

## TypeScript Standards
- **Strict Mode:** Enabled (strict: true in tsconfig.json)
- **No Implicit Any:** All variables must have explicit types
- **Strict Null Checks:** Null/undefined handling required
- **No Unused Variables:** Clean code enforcement
- **Path Aliases:** Use `@/` for src imports

## Naming Conventions
- **Components:** PascalCase (e.g., `DatabaseView.tsx`)
- **Services:** camelCase with suffix (e.g., `geminiService.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useDocuments.ts`)
- **Types/Interfaces:** PascalCase (e.g., `ExtractedData`)
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Files:** camelCase for utilities, PascalCase for components

## Code Style
- **Imports:** Group by external, internal, relative with blank lines
- **Functions:** Explicit return types for public APIs
- **Error Handling:** Try-catch with proper error types
- **Async/Await:** Preferred over raw promises
- **Destructuring:** Use for props and context

## Component Patterns
- **Functional Components:** Only functional components with hooks
- **Props Interface:** Define interface for each component
- **Default Props:** Avoid, use optional chaining instead
- **Memoization:** Use React.memo for expensive renders
- **Custom Hooks:** Extract reusable logic to hooks

## File Organization
```
src/
├── services/      # Pure business logic, no React
├── components/    # UI components only
├── hooks/         # Custom React hooks
├── types.ts       # All TypeScript interfaces
├── utils/         # Utility functions (if needed)
└── constants/     # Application constants
```

## ESLint Rules
- `@typescript-eslint/no-explicit-any`: Error
- `react-hooks/exhaustive-deps`: Warn
- `simple-import-sort/imports`: Error
- `import/first`: Error
- `react/react-in-jsx-scope`: Off (React 19)

## Prettier Configuration
- **Tab Width:** 2 spaces
- **Semicolons:** true
- **Single Quotes:** true
- **Trailing Comma:** es5
- **Print Width:** 80

## Testing Standards
- **Unit Tests:** Co-located or in `__tests__` directory
- **Test Naming:** `describe` blocks for features, `it` for behaviors
- **Mocking:** Mock external services (Supabase, APIs)
- **Coverage:** Aim for >80% coverage

## Documentation
- **JSDoc:** Required for public functions and complex logic
- **README:** Keep updated with feature changes
- **Types:** Document interface fields with comments

## Performance Best Practices
- **Code Splitting:** Manual chunks in vite.config.ts
- **Lazy Loading:** Use React.lazy for route components
- **Memoization:** React.memo, useMemo, useCallback where needed
- **Bundle Size:** Monitor with rollup-plugin-visualizer
