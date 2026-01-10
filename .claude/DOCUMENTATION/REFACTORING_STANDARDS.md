# 🔧 REFACTORING STANDARDS

## 📏 Code Quality Metrics

### File Size Limits
- **Max**: 300 lines
- **Ideal**: 100-250 lines
- **Enforcement**: Auto-split if exceeded

### Single Responsibility Principle
- **Score**: 10/10 required
- **Rule**: 1 File = 1 Responsibility
- **Check**: Automated verification

### Modular Programming
- **Pattern**: Orchestrator + Worker modules
- **Structure**: 
  - Main file (< 200 lines)
  - Worker files (100-250 lines)
  - Clear imports/exports

## 🎯 Refactoring Triggers

### Automatic Triggers
- File size > 300 lines
- Complexity score > 7/10
- Duplicate code detected
- Missing error handling
- No test coverage

### Manual Triggers
- "Refactor @file"
- "Simplify code"
- "Make maintainable"
- "Apply project standards"

## 🚀 Refactoring Workflow

### Phase 1: Analysis
1. Read file with LSP
2. Calculate complexity score
3. Identify violations
4. Generate improvement plan

### Phase 2: Execution
1. Split into modules
2. Apply ES module standards
3. Add explicit types
4. Improve error handling

### Phase 3: Validation
1. Run tests
2. Check coverage
3. Verify functionality
4. Update documentation

## 📋 Standards Checklist

- [ ] File < 300 lines
- [ ] SRP score = 10/10
- [ ] Uses function keyword (not arrow)
- [ ] Explicit return types
- [ ] Proper error handling
- [ ] Clear variable names
- [ ] No nested ternaries
- [ ] Test coverage > 80%
- [ ] Documentation updated

---

**Version:** 1.0
**Last Updated:** 2026-01-09
**Status:** ✅ Active
