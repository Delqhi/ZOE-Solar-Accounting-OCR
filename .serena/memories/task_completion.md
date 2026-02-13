# Task Completion Checklist - ZOE Solar Accounting OCR

## Mandatory Steps After Code Changes

### 1. Code Quality Checks
- [ ] Run `npm run typecheck` - Must pass with 0 errors
- [ ] Run `npm run lint` - Must pass with 0 errors
- [ ] Run `npm run format:check` - Must pass

### 2. Testing
- [ ] Run `npm run test` - All 160 tests must pass
- [ ] Add/update tests for new functionality
- [ ] Test edge cases and error handling

### 3. Build Verification
- [ ] Run `npm run build` - Must complete successfully
- [ ] Check for console warnings/errors
- [ ] Verify bundle size hasn't increased significantly

### 4. Git Operations
```bash
# Stage all changes
git add -A

# Commit with conventional format
git commit -m "type(scope): description"

# Push to remote
git push origin main
```

### 5. Documentation Updates
- [ ] Update README.md if features changed
- [ ] Update relevant memory files
- [ ] Add JSDoc comments to new functions

## Commit Message Format
```
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting)
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks

Examples:
feat(ocr): add Gemini 2.5 Flash support
fix(supabase): resolve connection timeout issue
docs(readme): update API documentation
```

## Pre-commit Hook (Automated)
Husky runs automatically on commit:
- ESLint check
- Prettier formatting
- TypeScript compilation

## Post-Completion Tasks
1. Update `lastchanges.md` with changes
2. Verify deployment status
3. Check browser console for errors
4. Test critical user flows
