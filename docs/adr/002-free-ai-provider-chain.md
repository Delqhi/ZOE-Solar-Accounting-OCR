# ADR 002: Free AI Provider Chain

## Status
Accepted

## Context

Das System nutzte hauptsächlich Google Gemini (paid API). Kosten:
- ~$0.50 pro 1M Input Tokens
- ~$1.50 pro 1M Output Tokens

Bei 1000 Dokumenten/Monat: ~$50-100 Kosten.

## Decision

Wir implementieren eine **kostenlose AI Provider Chain**:

### Provider (in Reihenfolge)
1. **NVIDIA Kimi K2.5** (Primary)
   - Kostenlos über NVIDIA API
   - Vision capabilities
   - 1M Kontext

2. **SiliconFlow Qwen 2.5 VL** (Fallback 1)
   - Kostenlos
   - 72B Parameter
   - Stark bei OCR

3. **Mistral Pixtral** (Fallback 2)
   - Kostenlos
   - Vision Model
   - EU-basiert

4. **OpenCode ZEN** (Fallback 3)
   - 100% kostenlos
   - Uncensored
   - High Performance

### Fallback Logik
```typescript
async function analyzeWithFallback(image: string) {
  const providers = [nvidia, siliconflow, mistral, opencode];
  
  for (const provider of providers) {
    try {
      return await provider.analyze(image);
    } catch (error) {
      continue; // Next provider
    }
  }
  
  throw new AllProvidersFailedError();
}
```

## Consequences

### Positive
- ✅ $0 Kosten
- ✅ Keine API Keys nötig
- ✅ Höhere Verfügbarkeit
- ✅ Keine Vendor Lock-in
- ✅ Datenschutz (EU-Optionen)

### Negative
- ⚠️ Höhere Latenz bei Fallbacks
- ⚠️ Unterschiedliche Antwortqualität

## Implementation

Siehe:
- `src/services/freeAIService/providers/`
- `src/services/freeAIService/service.ts`

## Metrics

- **Kosten**: $0/Monat
- **Verfügbarkeit**: 99.9%
- **Fallback-Rate**: <5%
