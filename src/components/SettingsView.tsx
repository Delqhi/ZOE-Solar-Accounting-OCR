/** SettingsView Component - Placeholder */

import React from 'react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  _onSave: (settings: AppSettings) => Promise<void>;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, _onSave, onClose }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Einstellungen</h2>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Schließen</button>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p>Einstellungen werden angezeigt...</p>
        <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(settings, null, 2)}</pre>
      </div>
    </div>
  );
};
