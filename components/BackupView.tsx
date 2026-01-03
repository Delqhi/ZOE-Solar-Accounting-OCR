import React, { useState } from 'react';
import { downloadBackupJSON, downloadBackupSQL, restoreFromBackup } from '../services/backupService';

interface BackupViewProps {
  onDataChanged: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ onDataChanged }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<'json' | 'sql'>('json');

  const handleDownloadJSON = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await downloadBackupJSON();
      setMessage({ type: 'success', text: 'JSON-Backup wurde heruntergeladen.' });
    } catch (err) {
      setMessage({ type: 'error', text: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSQL = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await downloadBackupSQL();
      setMessage({ type: 'success', text: 'SQL-Backup wurde heruntergeladen.' });
    } catch (err) {
      setMessage({ type: 'error', text: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setMessage({ type: 'error', text: 'Bitte wählen Sie eine Backup-Datei aus.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await restoreFromBackup(restoreFile);
      if (result.success) {
        setMessage({
          type: 'success',
          text: `${result.documentsRestored} Dokumente wiederhergestellt.`
        });
        onDataChanged();
      } else {
        setMessage({ type: 'error', text: result.error || 'Wiederherstellung fehlgeschlagen.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setLoading(false);
      setRestoreFile(null);
    }
  };

  const handleSQLRestore = async () => {
    if (!restoreFile) {
      setMessage({ type: 'error', text: 'Bitte wählen Sie eine SQL-Datei aus.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const text = await restoreFile.text();

      // Check for SQL header
      if (!text.includes('-- ZOE Solar Accounting') && !text.includes('belege')) {
        setMessage({ type: 'error', text: 'Ungültiges SQL-Backup-Format.' });
        setLoading(false);
        return;
      }

      // For SQL restore, we show info that SQL must be imported via database tools
      setMessage({
        type: 'success',
        text: `SQL-Backup erkannt. Bitte importieren Sie die Datei manuell in Ihre PostgreSQL-Datenbank mit: psql -d datenbank < ${restoreFile.name}`
      });

      // Offer download of the SQL content
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zoe_restore_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      setMessage({ type: 'error', text: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setLoading(false);
      setRestoreFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setRestoreFile(file);
    if (file) {
      if (file.name.endsWith('.sql')) {
        setRestoreMode('sql');
      } else {
        setRestoreMode('json');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Backup & Wiederherstellung</h2>

      {/* Backup Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Backup erstellen</h3>
          <p className="text-sm text-gray-500 mt-1">Laden Sie alle Ihre Daten als Backup herunter.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleDownloadJSON}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              JSON-Backup herunterladen
            </button>
            <button
              onClick={handleDownloadSQL}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              SQL-Backup herunterladen
            </button>
          </div>
          <p className="text-xs text-gray-500">
            JSON-Backup enthält alle Daten im JSON-Format. SQL-Backup enthält ein SQL-Skript zum Import in eine PostgreSQL-Datenbank.
          </p>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
          <h3 className="text-lg font-semibold text-red-900">Daten wiederherstellen</h3>
          <p className="text-sm text-red-600 mt-1">Achtung: Diese Aktion überschreibt existierende Daten!</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup-Datei auswählen (.json oder .sql)
            </label>
            <input
              type="file"
              accept=".json,.sql"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {restoreFile && (
            <div className="flex items-center gap-4">
              <button
                onClick={restoreMode === 'sql' ? handleSQLRestore : handleRestore}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {restoreMode === 'sql' ? 'SQL-Info anzeigen' : 'Wiederherstellen'}
              </button>
              <span className="text-sm text-gray-600">
                {restoreFile.name}
                <span className="ml-2 text-xs text-gray-400">
                  ({restoreMode === 'sql' ? 'SQL-Backup' : 'JSON-Backup'})
                </span>
              </span>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Wichtig:</strong> Die Wiederherstellung fügt neue Dokumente hinzu und aktualisiert existierende anhand der ID.
                  Bereits hochgeladene Dateien werden nicht doppelt angelegt. SQL-Backups müssen in die PostgreSQL-Datenbank importiert werden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mt-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
