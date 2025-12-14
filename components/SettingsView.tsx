
import React, { useState } from 'react';
import { AppSettings, AccountDefinition } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const taxes = settings.taxDefinitions || [];
  const [accounts, setAccounts] = useState<AccountDefinition[]>(settings.accountDefinitions || []);
  const [newAccountName, setNewAccountName] = useState('');

  const handleRemoveAccount = (id: string) => {
      if (confirm('Konto wirklich löschen?')) {
          const updated = accounts.filter(a => a.id !== id);
          setAccounts(updated);
          onSave({ ...settings, accountDefinitions: updated });
      }
  };

  const handleAddAccount = () => {
      if (!newAccountName.trim()) return;
      const id = newAccountName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newAcc: AccountDefinition = {
          id,
          name: newAccountName,
          skr03: "0000",
          steuerkategorien: ['19_pv', '7_pv']
      };
      const updated = [...accounts, newAcc];
      setAccounts(updated);
      setNewAccountName('');
      onSave({ ...settings, accountDefinitions: updated });
  };

  const handleUpdateAccountTaxes = (accId: string, taxVal: string) => {
      setAccounts(prev => prev.map(acc => {
          if (acc.id !== accId) return acc;
          const exists = acc.steuerkategorien.includes(taxVal);
          const newCats = exists 
             ? acc.steuerkategorien.filter(c => c !== taxVal) 
             : [...acc.steuerkategorien, taxVal];
          return { ...acc, steuerkategorien: newCats };
      }));
  };
  
  const handleSaveAccounts = () => {
      onSave({ ...settings, accountDefinitions: accounts });
      alert('Einstellungen gespeichert!');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-none">
         <h2 className="font-bold text-slate-800">System Einstellungen</h2>
         <div className="flex gap-2">
             <button onClick={handleSaveAccounts} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Speichern</button>
             <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Schließen</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
              
              {/* Tax Categories (Read Only) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <h3 className="font-bold text-slate-800">📊 Steuerkategorien (System-Vorgabe)</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-500 font-semibold">
                          <tr>
                              <th className="px-4 py-2">ID</th>
                              <th className="px-4 py-2">Bezeichnung</th>
                              <th className="px-4 py-2">MwSt</th>
                              <th className="px-4 py-2 text-center">Vorsteuer</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {taxes.map((t) => (
                              <tr key={t.value} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{t.value}</td>
                                  <td className="px-4 py-2 font-medium">{t.label}</td>
                                  <td className="px-4 py-2">{t.ust_satz * 100}%</td>
                                  <td className="px-4 py-2 text-center">{t.vorsteuer ? '✅' : '❌'}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* Accounting Accounts (Editable) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">🏦 Kontierungskonten (SKR03)</h3>
                      <div className="flex gap-2">
                          <input 
                            value={newAccountName}
                            onChange={e => setNewAccountName(e.target.value)}
                            placeholder="Neues Konto..."
                            className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                          />
                          <button onClick={handleAddAccount} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm border border-blue-200 font-medium">+ Add</button>
                      </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-4 py-2 w-16">SKR03</th>
                                <th className="px-4 py-2 w-1/4">Konto Name</th>
                                <th className="px-4 py-2">Erlaubte Steuerkategorien</th>
                                <th className="px-4 py-2 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {accounts.map((acc, idx) => (
                                <tr key={acc.id + idx} className="hover:bg-slate-50 group">
                                    <td className="px-4 py-3 align-top">
                                        <input 
                                            value={acc.skr03 || ''} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAccounts(prev => prev.map(a => a.id === acc.id ? {...a, skr03: val} : a));
                                            }}
                                            placeholder="0000"
                                            className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none font-mono text-slate-700 font-bold"
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800 align-top">
                                        <input 
                                            value={acc.name} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAccounts(prev => prev.map(a => a.id === acc.id ? {...a, name: val} : a));
                                            }}
                                            className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none"
                                        />
                                        <div className="text-[10px] text-slate-400 font-mono mt-1">{acc.id}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {taxes.map(t => {
                                                const isActive = acc.steuerkategorien.includes(t.value);
                                                return (
                                                    <button 
                                                        key={t.value}
                                                        onClick={() => handleUpdateAccountTaxes(acc.id, t.value)}
                                                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                                            isActive 
                                                                ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' 
                                                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {t.value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleRemoveAccount(acc.id)} className="text-slate-300 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
