# Developer Onboarding Guide

## 🚀 Schnellstart

### 1. Repository Setup

```bash
# Clone
git clone https://github.com/DeepthinkAI2025/ZOE-Solar-Accounting-OCR.git
cd ZOE-Solar-Accounting-OCR

# Dependencies
npm install

# Dev Server
npm run dev
```

### 2. Umgebungsvariablen

```bash
cp .env.example .env
```

**Erforderlich:**
```env
VITE_SUPABASE_URL=https://deine-supabase-url.oci.oraclecloud.com
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

**Optional (FREE APIs):**
```env
# Alles Optional - wir nutzen FREE Chain!
VITE_GEMINI_API_KEY=        # Google Gemini (deprecated)
VITE_SILICONFLOW_API_KEY=   # SiliconFlow (optional)
```

### 3. Projektstruktur

```
src/
├── services/              # Business Logic
│   ├── freeAIService/     # AI OCR (11 Module)
│   ├── belegeService/     # Document CRUD (6 Module)
│   ├── auditService/      # Audit Logging (5 Module)
│   └── ...
├── components/            # React Components
├── hooks/                 # Custom Hooks
├── types/                 # TypeScript Types
└── lib/                   # Utilities
```

## 🏗️ Architektur

### Modular Services

**Prinzip:** <100 Zeilen pro Datei, Single Responsibility

**Beispiel:**
```typescript
// ✅ Richtig - Fokussiert
// src/services/freeAIService/providers/nvidia.ts
export async function analyzeImage(image: string): Promise<OCRResult> {
  // Nur NVIDIA-spezifische Logik
}

// ❌ Falsch - Zu viel
// src/services/geminiService.ts (alt, 500+ Zeilen)
```

### Service Import

```typescript
// Neuer modularer Import
import { analyzeDocumentFree } from '@/services/freeAIService';

// Oder spezifisch
import { nvidiaProvider } from '@/services/freeAIService/providers/nvidia';
```

## 🧪 Testing

### Unit Tests

```bash
# Alle Tests
npm run test

# Watch Mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test-Struktur

```typescript
// src/services/freeAIService/__tests__/nvidia.test.ts
import { describe, it, expect } from 'vitest';
import { nvidiaProvider } from '../providers/nvidia';

describe('NVIDIA Provider', () => {
  it('should analyze image', async () => {
    const result = await nvidiaProvider.analyzeImage('base64...');
    expect(result.text).toBeDefined();
  });
});
```

## 📝 Code Guidelines

### 1. File Size
- **Max 100 Zeilen** pro Datei
- Bei >100 Zeilen: Modularisieren

### 2. TypeScript
- **Strict Mode** aktiv
- **Keine `any` Typen**
- **Explizite Return Types**

### 3. Naming
```typescript
// Functions: camelCase
analyzeDocument()

// Components: PascalCase
DocumentUploader.tsx

// Types: PascalCase
interface ExtractedData {
  belegDatum: string;
}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
```

### 4. Imports
```typescript
// Reihenfolge:
// 1. React
import React from 'react';

// 2. Third-party
import { supabase } from '@supabase/supabase-js';

// 3. Absolute
import { Button } from '@/components/ui/button';

// 4. Relative
import { useAuth } from '../hooks/useAuth';
```

## 🔧 Development Workflow

### 1. Branch Naming
```
feature/modular-service-refactor
fix/ocr-timeout-issue
docs/api-documentation
```

### 2. Commits
```bash
git commit -m "feat: add NVIDIA provider module

- Implements free AI OCR via NVIDIA API
- Error handling with retries
- 100% test coverage"
```

### 3. Code Review Checklist
- [ ] <100 Zeilen pro Datei?
- [ ] Keine `any` Typen?
- [ ] Tests vorhanden?
- [ ] Dokumentation aktualisiert?
- [ ] Backward compatible?

## 🐛 Debugging

### IDE Setup
**VS Code Extensions:**
- TypeScript Importer
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### Debug Config
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug App",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### Logging
```typescript
// Services
import { logger } from '@/lib/logger';

logger.info('Processing document', { id: docId });
logger.error('OCR failed', error);
```

## 📚 Weiterführende Links

- [Architecture Decisions](./adr/)
- [API Documentation](./api/)
- [Contributing Guidelines](./contributing.md)
- [Troubleshooting](./troubleshooting.md)

## ❓ FAQ

**Q: Warum so viele kleine Dateien?**  
A: <100 Zeilen = bessere Lesbarkeit, Testbarkeit, Wartbarkeit

**Q: Muss ich alle Provider verstehen?**  
A: Nein, nutze einfach `analyzeDocumentFree()` - Fallbacks automatisch

**Q: Wie füge ich einen neuen Provider hinzu?**  
A: Siehe [Adding a Provider](./guides/adding-provider.md)

## 🎯 First Task

**Deine erste Aufgabe:**
1. Lies `src/services/freeAIService/providers/nvidia.ts`
2. Verstehe die Struktur
3. Schreibe einen Test dafür
4. Commit: `git commit -m "test: add NVIDIA provider tests"`

Willkommen im Team! 🚀
