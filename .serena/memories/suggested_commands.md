# Suggested Commands - ZOE Solar Accounting OCR

## Development Commands
```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing Commands
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests for CI
npm run test:ci

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Code Quality Commands
```bash
# Lint code
npm run lint

# Lint and fix issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Full check (typecheck + build)
npm run check
```

## Git Commands
```bash
# Setup husky hooks
npm run prepare

# Run lint-staged (called by husky)
npm run lint-staged
```

## System Utilities (macOS/Darwin)
```bash
# List files
ls -la

# Find files
find . -name "*.ts" -type f

# Search in files (use ripgrep instead of grep)
rg "pattern" src/

# File search (use fd instead of find)
fd -e ts -t f

# Directory listing with colors
exa -la

# View file with syntax highlighting
bat src/App.tsx
```

## Deployment Commands
```bash
# Manual deployment script
./deploy.sh

# Update Vercel environment
./update-vercel-env.sh

# Fix Supabase deployment
./fix-supabase-deploy.sh

# Check Supabase status
node check-supabase-status.js
```

## Docker Commands
```bash
# Start Supabase locally
docker-compose -f docker-compose.supabase.yml up -d

# Check running containers
docker ps

# View container logs
docker logs <container-name>
```
