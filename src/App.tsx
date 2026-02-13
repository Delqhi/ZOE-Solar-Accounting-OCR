import { useState, useEffect } from 'react';
import { AlertCircle, Upload, Settings } from 'lucide-react';
import './App.css';

// Types
interface ProcessedDocument {
  id: string;
  name: string;
  pageCount: number;
  extractedData: Record<string, unknown>;
  timestamp: Date;
}

interface AppSettings {
  extractionMode: 'auto' | 'manual';
  outputFormat: 'json' | 'csv' | 'xml';
  language: string;
}

export function App() {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    extractionMode: 'auto',
    outputFormat: 'json',
    language: 'en',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [privateDocuments, setPrivateDocuments] = useState<ProcessedDocument[]>([]);
  const [notification, setNotification] = useState<unknown>(null);

  useEffect(() => {
    setDocuments([]);
    setSettings({
      extractionMode: 'auto',
      outputFormat: 'json',
      language: 'en',
    });
    setSelectedDocuments(new Set());
    setPrivateDocuments([]);
  }, []);

  // Prevent unused variable warnings
  void settings;
  void isProcessing;
  void showSettings;
  void selectedDocuments;
  void notification;

  const renderContent = () => {
    if (error) {
      return (
        <div className="error-alert">
          <AlertCircle size={24} />
          <div>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (documents.length === 0 && privateDocuments.length === 0) {
      return (
        <div className="empty-state">
          <Upload size={48} />
          <h2>No documents yet</h2>
          <p>Upload PDF files to get started</p>
        </div>
      );
    }

    return (
      <div className="content-container">
        {/* <DocumentList
          documents={documents}
          selectedDocuments={selectedDocuments}
          onSelectDocument={(id: string) => {
            const newSelected = new Set(selectedDocuments);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            setSelectedDocuments(newSelected);
          }}
        /> */}
        {/* {privateDocuments.length > 0 && <PrivateDocuments documents={privateDocuments} />} */}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Solar Accounting OCR</h1>
        <button
          type="button"
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Settings size={24} />
        </button>
      </header>

      {/* ProcessingPanel component removed */}
      {/* <ProcessingPanel
        isProcessing={isProcessing}
        onFilesSelected={async (files: File[]) => {
          setIsProcessing(true);
          setError(null);
          try {
            const processed: ProcessedDocument[] = [];
            for (const file of files) {
              const reader = new FileReader();
              reader.onload = async (e) => {
                const content = e.target?.result as ArrayBuffer;
                const pdf = await PDFDocument.load(content);
                processed.push({
                  id: Math.random().toString(36).substr(2, 9),
                  name: file.name,
                  pageCount: pdf.getPageCount(),
                  extractedData: {},
                  timestamp: new Date(),
                });
              };
              reader.readAsArrayBuffer(file);
            }
            setDocuments((prev) => [...prev, ...processed]);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Processing failed');
          } finally {
            setIsProcessing(false);
          }
        }}
      /> */}

      <main className="app-main">{renderContent()}</main>

      {/* SettingsModal component removed */}
      {/* {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings: AppSettings) => {
            setSettings(newSettings);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )} */}

      {/* NotificationCenter component removed */}
      {/* {notification && (
        <NotificationCenter
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )} */}
    </div>
  );
}

// Default export for lazy loading
export default App;
