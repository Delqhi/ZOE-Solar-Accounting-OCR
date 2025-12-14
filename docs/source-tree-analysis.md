# Source Tree (annotiert)

Auszug (Top-Level, ohne `node_modules` Details):

```
.
├── App.tsx
├── index.tsx
├── index.html
├── components/
│   ├── UploadArea.tsx
│   ├── DatabaseView.tsx
│   ├── DatabaseGrid.tsx
│   ├── DetailModal.tsx
│   ├── PdfViewer.tsx
│   └── SettingsView.tsx
├── services/
│   ├── geminiService.ts
│   ├── fallbackService.ts
│   ├── ruleEngine.ts
│   └── storageService.ts
├── types.ts
├── vite.config.ts
├── package.json
└── docs/
    ├── index.md
    ├── project-overview.md
    ├── architecture.md
    ├── source-tree-analysis.md
    ├── development-guide.md
    └── bmm-workflow-status.yaml
```

## Struktur-Interpretation

- **UI-Orchestrierung** lebt zentral in `App.tsx`.
- **UI-Komponenten** sind flach in `components/` organisiert.
- **Domänenlogik/Integrationen** sind in `services/` gekapselt.
- **Typen** (Datenmodell & Settings) sind in `types.ts` zentralisiert.
