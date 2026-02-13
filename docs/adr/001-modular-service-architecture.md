# ADR 001: Modular Service Architecture

## Status
Accepted

## Context

Das ZOE Solar Accounting OCR System hatte monolithische Service-Dateien mit 500+ Zeilen:
- `freeAIService.ts` (629 Zeilen)
- `belegeService.ts` (621 Zeilen)
- `auditService.ts` (503 Zeilen)

Dies führte zu:
- Hoher kognitiver Belastung
- Schlechter Testbarkeit
- Schwierigkeiten beim Code Review
- Geringer Wartbarkeit

## Decision

Wir modularisieren alle Services nach dem **Single Responsibility Principle**:

### Struktur
```
serviceName/
├── types.ts          # TypeScript Interfaces
├── config.ts         # Konfiguration
├── errors.ts         # Error Classes
├── core.ts           # Hauptlogik
├── utils.ts          # Hilfsfunktionen
└── index.ts          # Public API
```

### Regeln
1. **Max 100 Zeilen pro Datei**
2. **Eine Verantwortung pro Modul**
3. **Klare Import/Export Hierarchie**
4. **100% Backward Compatibility**

## Consequences

### Positive
- ✅ Besser testbar (isolierte Module)
- ✅ Einfacher zu verstehen (<100 Zeilen)
- ✅ Besseres Tree-Shaking
- ✅ Parallele Entwicklung möglich
- ✅ Klare Verantwortlichkeiten

### Negative
- ⚠️ Mehr Dateien im Projekt
- ⚠️ Etwas mehr Imports

## Implementation

Siehe:
- `src/services/freeAIService/`
- `src/services/belegeService/`
- `src/services/auditService/`

## References

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
