/**
 * 2026 GLASSMORPHISM 2.0 - ENHANCED MAIN APPLICATION
 * Main application component with advanced 3D depth effects and Glassmorphism 2.0
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useState, useMemo } from 'react';
import { Button, Stack, Grid, Center, Container } from './components/designOS';
import { UploadArea3D } from './components/designOS/UploadArea3D';
import { DatabaseGrid } from './components/database-grid';
import { DocumentDetail } from './components/DetailModal';
import { SettingsView } from './components/SettingsView';

import { FilterBar } from './components/FilterBar';
import { analyzeDocumentWithGemini } from './services/geminiService';
import { generateZoeInvoiceId } from './services/ruleEngine';
import * as storageService from './services/storageService';
import * as supabaseService from './services/supabaseService';
import { detectPrivateDocument } from './services/privateDocumentDetection';
import { DocumentRecord, DocumentStatus, AppSettings, ExtractedData } from './types';
import { normalizeExtractedData } from './services/extractedDataNormalization';
import { User } from './services/supabaseService';
import { App3D } from './components/designOS/App3D';
import { DepthContainer, DepthCard, FloatingElement } from './components/designOS/depth3D';
import {
  TypographyHeading,
  TypographyBody,
  TypographyGradient,
} from './components/designOS/typography';
import { use3DDepth, useFloating } from './hooks/use3D';

const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const readFileToBase64 = (file: File): Promise<{ base64: string; url: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve({ base64: res.split(',')[1], url: res });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const App: React.FC = () => {
  const [_user, _setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [viewMode, setViewMode] = useState<
    'document' | 'database' | 'settings' | 'auth' | 'backup'
  >('document');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filter, setFilter] = useState({
    status: 'all',
    search: '',
    dateRange: { from: '', to: '' },
    dateFilter: 'all',
  });
  const [dragCount, setDragCount] = useState(0);
  const [uploadStats, setUploadStats] = useState({ today: 0, total: 0 });
  const [systemHealth, setSystemHealth] = useState({
    lastBackup: null as Date | null,
    syncStatus: 'synced',
  });
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'settings'>(
    'overview'
  );
  const [originalDoc, setOriginalDoc] = useState<DocumentRecord | null>(null);
  const [compareDoc, setCompareDoc] = useState<DocumentRecord | null>(null);

  // Initialize 3D effects
  const depthHook = use3DDepth({ layers: 5, baseZ: 0, spacing: 8 });
  const floatingHook = useFloating({
    height: 12,
    duration: 6000,
    enabled: true,
  });

  const handleUpload = async (files: File[]) => {
    if (!user) {
      setViewMode('auth');
      return;
    }

    setIsUploading(true);
    setDragCount((prev) => prev + 1);

    try {
      for (const file of files) {
        const hash = await computeFileHash(file);
        const existing = documents.find((d) => d.fileHash === hash);
        if (existing) {
          alert(`Datei bereits hochgeladen: ${existing.fileName}`);
          continue;
        }

        const { base64, url } = await readFileToBase64(file);
        const extracted = await analyzeDocumentWithGemini(base64, file.type);

        // Normalize extracted data
        const normalizedData = normalizeExtractedData(extracted, file.type);

        const privateDoc = detectPrivateDocument(normalizedData);
        const invoiceNumber = normalizedData.invoiceNumber || `DOC-${Date.now()}`;
        const zoeInvoiceId = await generateZoeInvoiceId(invoiceNumber);

        const newDoc: DocumentRecord = {
          id: crypto.randomUUID(),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          content: url,
          extractedData: normalizedData,
          status: privateDoc ? DocumentStatus.Private : DocumentStatus.Pending,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user.id,
          fileHash: hash,
          zoeInvoiceId,
          privateDocument: privateDoc,
          duplicateOfId: null,
          attachments: [],
          metadata: {
            version: 1,
            extractedAt: new Date().toISOString(),
            extractor: 'gemini',
          },
        };

        await supabaseService.saveDocument(newDoc);
        await storageService.addDocument(newDoc);
        setDocuments((prev) => [...prev, newDoc]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload fehlgeschlagen: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDocument = async (doc: DocumentRecord) => {
    await supabaseService.saveDocument(doc);
    await storageService.updateDocument(doc);
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    setSelectedDocId(null);
  };

  const handleDeleteDocument = async (doc: DocumentRecord) => {
    await supabaseService.deleteDocument(doc.id);
    await storageService.deleteDocument(doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setSelectedDocId(null);
  };

  const handleMergeDocuments = async (primary: DocumentRecord, secondary: DocumentRecord) => {
    const merged = {
      ...secondary,
      attachments: [...(primary.attachments || []), ...(secondary.attachments || [])],
    };
    await handleSaveDocument(merged);
    await handleDeleteDocument(primary);
  };

  const handleRetryOCR = async (doc: DocumentRecord) => {
    const response = await fetch(doc.content);
    const blob = await response.blob();
    const file = new File([blob], doc.filename, { type: doc.mimeType });
    await handleUpload([file]);
  };

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (filter.status !== 'all') {
      filtered = filtered.filter((d) => d.status === filter.status);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.filename.toLowerCase().includes(searchLower) ||
          (d.extractedData?.supplier?.toLowerCase() || '').includes(searchLower) ||
          (d.extractedData?.invoiceNumber?.toLowerCase() || '').includes(searchLower)
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [documents, filter]);

  const renderContent = () => {
    if (viewMode === 'settings' && settings) {
      return (
        <FloatingElement height={15} duration={6000} delay={0}>
          <SettingsView
            settings={settings}
            onSave={async (s) => {
              setSettings(s);
              await storageService.saveSettings(s);
            }}
            onClose={() => setViewMode('document')}
          />
        </FloatingElement>
      );
    }

    if (viewMode === 'database') {
      return (
        <FloatingElement height={10} duration={5000} delay={1000}>
          <DatabaseGrid
            documents={filteredDocuments}
            onOpen={(d) => {
              setSelectedDocId(d.id);
            }}
            onDelete={handleDeleteDocument}
            onMerge={handleMergeDocuments}
            onDuplicateCompare={(d) => {
              const original = documents.find((doc) => doc.id === d.duplicateOfId);
              if (original) {
                setOriginalDoc(original);
                setCompareDoc(d);
              }
            }}
          />
        </FloatingElement>
      );
    }

    if (selectedDocId) {
      const doc = documents.find((d) => d.id === selectedDocId);
      if (doc)
        return (
          <FloatingElement height={12} duration={4000} delay={0}>
            <DocumentDetail
              document={doc}
              allDocuments={documents}
              isOpen={true}
              onSave={handleSaveDocument}
              onDelete={handleDeleteDocument}
              onRetryOCR={handleRetryOCR}
              onSelectDocument={(d) => setSelectedDocId(d.id)}
              onClose={() => setSelectedDocId(null)}
              onMerge={handleMergeDocuments}
            />
          </FloatingElement>
        );
    }

    return (
      <FloatingElement height={20} duration={8000} delay={0}>
        <Center className="h-full bg-background relative">
          <Container className="max-w-xl w-full z-10">
            <Stack gap="xl" align="center">
              <FloatingElement height={15} duration={10000} delay={0}>
                <TypographyHeading
                  level="h2"
                  className="text-2xl md:text-3xl font-bold text-center text-text"
                >
                  <TypographyGradient type="primary">ZOE Solar</TypographyGradient> Accounting
                </TypographyHeading>
              </FloatingElement>

              <FloatingElement height={10} duration={6000} delay={1000}>
                <TypographyBody className="text-center text-text-muted">
                  Advanced document processing with AI and 3D depth effects
                </TypographyBody>
              </FloatingElement>

              {/* 3D Enhanced Upload Area */}
              <UploadArea3D
                onUploadComplete={(result) => console.log('Upload complete:', result)}
              />

              {/* Quick Stats */}
              <FloatingElement height={8} duration={4000} delay={2000}>
                <DepthCard
                  depth={2}
                  style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <TypographyBody style={{ fontSize: '0.875rem', color: '#00D4FF' }}>
                    {dragCount} uploads today • {documents.length} total documents • 3D effects
                    active
                  </TypographyBody>
                </DepthCard>
              </FloatingElement>
            </Stack>
          </Container>
        </Center>
      </FloatingElement>
    );
  };

  return (
    <App3D
      title="ZOE Solar Accounting"
      subtitle="2026 Glassmorphism 2.0 with 3D Effects"
      backgroundImage="https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=1200&q=80"
    >
      {/* 3D Enhanced Navigation */}
      <FloatingElement height={10} duration={6000} delay={0} zIndex={100}>
        <DepthContainer
          depth={3}
          floating={true}
          interactive={true}
          style={{
            position: 'sticky',
            top: '20px',
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '1rem',
            margin: '20px auto',
            maxWidth: '800px',
          }}
        >
          <Grid columns={4} gap="md" align="center">
            <Button
              variant={viewMode === 'document' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('document')}
              style={{ borderRadius: '12px' }}
            >
              📁 Documents
            </Button>
            <Button
              variant={viewMode === 'database' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('database')}
              style={{ borderRadius: '12px' }}
            >
              🗃️ Database
            </Button>
            <Button
              variant={viewMode === 'settings' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('settings')}
              style={{ borderRadius: '12px' }}
            >
              ⚙️ Settings
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewMode('auth')}
              style={{ borderRadius: '12px' }}
            >
              👤 Profile
            </Button>
          </Grid>
        </DepthContainer>
      </FloatingElement>

      {/* Filter Bar */}
      {viewMode === 'database' && (
        <FloatingElement height={8} duration={4000} delay={1000}>
          <FilterBar filter={filter} onFilterChange={setFilter} documentCount={documents.length} />
        </FloatingElement>
      )}

      {/* Main Content */}
      <main style={{ minHeight: '60vh' }}>{renderContent()}</main>

      {/* Status Footer */}
      <FloatingElement height={6} duration={3000} delay={3000} zIndex={10}>
        <DepthContainer
          depth={2}
          floating={true}
          style={{
            marginTop: '4rem',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <TypographyBody style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            System Status: {systemHealth.syncStatus} • Last Backup:{' '}
            {systemHealth.lastBackup ? systemHealth.lastBackup.toLocaleString() : 'Never'} • 3D
            Effects: Active
          </TypographyBody>
        </DepthContainer>
      </FloatingElement>
    </App3D>
  );
};

export default App;
