import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(settings.taxCategories);

  const handleAdd = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      setCategories(updated);
      onSave({ ...settings, taxCategories: updated });
      setNewCategory('');
    }
  };

  const handleDelete = (cat: string) => {
    if (confirm(`Steuerkategorie "${cat}" wirklich löschen?`)) {
      const updated = categories.filter(c => c !== cat);
      setCategories(updated);
      onSave({ ...settings, taxCategories: updated });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-none">
         <h2 className="font-bold text-slate-800 text-lg">Einstellungen</h2>
         <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Tax Categories Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Steuerkategorien</h3>
                    <p className="text-xs text-slate-500 mt-1">Definiere die Auswahlmöglichkeiten für die Umsatzsteuer-Zuordnung.</p>
                </div>
                
                <div className="p-5">
                    {/* List */}
                    <div className="space-y-2 mb-6">
                        {categories.map((cat, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-200 transition-colors">
                                <span className="text-sm font-medium text-slate-700">{cat}</span>
                                <button 
                                    onClick={() => handleDelete(cat)}
                                    className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Löschen"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Neue Kategorie (z.B. '19% Dienstleistung')"
                            className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                        <button 
                            onClick={handleAdd}
                            disabled={!newCategory.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Hinzufügen
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100 flex gap-3">
                 <svg className="w-5 h-5 flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 <p>
                    Diese Kategorien stehen dir im Beleg-Detail zur Verfügung. Löschst du eine Kategorie, bleibt sie in bereits gespeicherten Belegen erhalten, ist aber für neue Belege nicht mehr auswählbar.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};
