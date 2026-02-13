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
  const [settings] = useState<AppSettings>({
    extractionMode: 'auto',
    outputFormat: 'json',
    language: 'en',
  });
  const [isProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments] = useState<Set<string>>(new Set());
  const [privateDocuments, setPrivateDocuments] = useState<ProcessedDocument[]>([]);
  const [notification] = useState<unknown>(null);

  useEffect(() => {
    setDocuments([]);
    setPrivateDocuments([]);
  }, []);

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
        <p>Documents: {documents.length}</p>
        {selectedDocuments.size > 0 && <p>Selected: {selectedDocuments.size}</p>}
        {notification && <p>Notification active</p>}
        {isProcessing && <p>Processing...</p>}
        {settings.language && <p>Language: {settings.language}</p>}
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

      <main className="app-main">{renderContent()}</main>

      {showSettings && (
        <div className="settings-modal">
          <h2>Settings</h2>
          <button onClick={() => setShowSettings(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

// Default export for lazy loading
export default App;
