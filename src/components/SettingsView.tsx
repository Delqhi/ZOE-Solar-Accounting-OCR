/** 🔱 ULTRA 2026 - SettingsView Component
 * Settings with AI Cost Monitoring integration
 */


import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  // Authentication and AI cost monitoring temporarily disabled
  const user = null;
  void onSave; // Mark as used

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text">Einstellungen</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
        >
          Schließen
        </button>
      </div>

      {/* AI Cost Monitoring - Temporarily disabled */}
      {user && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">AI Kostenmonitoring</h3>
          <div className="p-4 bg-surface border border-border rounded-lg text-text-muted text-sm">
            AI Cost Monitoring temporarily unavailable
          </div>
        </div>
      )}

      {/* Settings Display */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text">Systemkonfiguration</h3>
        <div className="bg-surface border border-border p-4 rounded-xl">
          <pre className="text-xs overflow-auto text-text-muted font-mono">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text">Schnellzugriff</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors text-left">
            <div className="font-medium">Daten exportieren</div>
            <div className="text-xs text-text-muted">Backup erstellen</div>
          </button>
          <button className="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors text-left">
            <div className="font-medium">Audit-Logs</div>
            <div className="text-xs text-text-muted">Aktivitäten anzeigen</div>
          </button>
        </div>
      </div>
    </div>
  );
};
