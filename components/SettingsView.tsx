
import React, { useMemo, useState } from 'react';
import { AppSettings, AccountDefinition, DatevConfig, ElsterStammdaten, StartupChecklist, ElsterBesteuerungUst, ElsterRechtsform } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const taxes = settings.taxDefinitions || [];
  const [accounts, setAccounts] = useState<AccountDefinition[]>(settings.accountDefinitions || []);
  const [newAccountName, setNewAccountName] = useState('');
    type SettingsTab = 'system' | 'elster' | 'startup';
    const [activeTab, setActiveTab] = useState<SettingsTab>('system');

    const Tip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
        <span
            className="underline decoration-dotted underline-offset-2"
            title={text}
        >
            {children}
        </span>
    );

    const defaultElster: ElsterStammdaten = useMemo(() => ({
        unternehmensName: '',
        land: 'DE',
        plz: '',
        ort: '',
        strasse: '',
        hausnummer: '',
        eigeneSteuernummer: '',
        eigeneUstIdNr: '',
        finanzamtName: '',
        finanzamtNr: '',
        rechtsform: undefined,
        besteuerungUst: 'unbekannt',
        kleinunternehmer: false,
        iban: '',
        kontaktEmail: '',
    }), []);

    const [elsterStammdaten, setElsterStammdaten] = useState<ElsterStammdaten>(() => ({
        ...defaultElster,
        ...(settings.elsterStammdaten || {}),
    }));

    const defaultStartup: StartupChecklist = useMemo(() => ({
        uploadErsterBeleg: false,
        datevKonfiguriert: false,
        elsterStammdatenKonfiguriert: false,
    }), []);

    const [startupChecklist, setStartupChecklist] = useState<StartupChecklist>(() => ({
        ...defaultStartup,
        ...(settings.startupChecklist || {}),
    }));
    const [datevConfig, setDatevConfig] = useState<DatevConfig>(() => {
        const fallbackYear = new Date().getFullYear();
        const base: DatevConfig = {
            beraterNr: '',
            mandantNr: '',
            wirtschaftsjahrBeginn: `${fallbackYear}0101`,
            sachkontenlaenge: 4,
            waehrung: 'EUR',
            herkunftKz: 'RE',
            diktatkuerzel: '',
            stapelBezeichnung: 'Buchungsstapel',
            taxCategoryToBuKey: {},
        };
        const existing = settings.datevConfig;
        return {
            ...base,
            ...existing,
            taxCategoryToBuKey: {
                ...base.taxCategoryToBuKey,
                ...(existing?.taxCategoryToBuKey || {}),
            },
        };
    });

    const buildSettingsSnapshot = (overrides?: Partial<AppSettings>): AppSettings => {
        return {
            ...settings,
            accountDefinitions: accounts,
            datevConfig,
            elsterStammdaten,
            startupChecklist,
            ...(overrides || {}),
        };
    };

  const handleRemoveAccount = (id: string) => {
      if (confirm('Konto wirklich löschen?')) {
          const updated = accounts.filter(a => a.id !== id);
          setAccounts(updated);
          onSave(buildSettingsSnapshot({ accountDefinitions: updated }));
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
      onSave(buildSettingsSnapshot({ accountDefinitions: updated }));
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
  
  const validateDatevConfig = (): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Check required fields
      if (!datevConfig.beraterNr.trim()) {
          errors.push('Berater-Nr. ist erforderlich');
      } else if (!/^\d+$/.test(datevConfig.beraterNr)) {
          errors.push('Berater-Nr. muss numerisch sein');
      }

      if (!datevConfig.mandantNr.trim()) {
          errors.push('Mandant-Nr. ist erforderlich');
      } else if (!/^\d+$/.test(datevConfig.mandantNr)) {
          errors.push('Mandant-Nr. muss numerisch sein');
      }

      // Check BU-Schlüssel for tax categories that are in use
      const usedTaxCategories = taxes.filter(t => ['19_pv', '7_pv'].includes(t.value));
      const missingBuKeys = usedTaxCategories.filter(t => {
          const buKey = datevConfig.taxCategoryToBuKey?.[t.value];
          return !buKey || buKey.trim() === '';
      });

      if (missingBuKeys.length > 0) {
          const names = missingBuKeys.map(t => t.label).join(', ');
          errors.push(`Fehlende BU-Schlüssel für: ${names}`);
      }

      return { valid: errors.length === 0, errors };
  };

  const handleSaveAccounts = () => {
      const validation = validateDatevConfig();
      if (!validation.valid) {
          alert('Validierungsfehler:\n\n' + validation.errors.join('\n'));
          return;
      }
      onSave(buildSettingsSnapshot());
      alert('Einstellungen gespeichert!');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-none">
         <div className="flex items-center gap-4">
           <h2 className="font-bold text-slate-800">Einstellungen</h2>
           <div className="flex bg-slate-100 p-0.5 rounded-md">
             {([
               { id: 'system', label: 'System' },
               { id: 'elster', label: 'ELSTER' },
               { id: 'startup', label: 'Startup' },
             ] as Array<{ id: SettingsTab; label: string }>).map(t => (
               <button
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
               >
                 {t.label}
               </button>
             ))}
           </div>
         </div>
         <div className="flex gap-2">
             <button onClick={handleSaveAccounts} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Speichern</button>
             <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Schließen</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
              {activeTab === 'system' && (
                <>
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

                  {/* DATEV Export (EXTF/DTVF) */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200">
                          <h3 className="font-bold text-slate-800">🧾 DATEV Export (Buchungsstapel)</h3>
                          <div className="text-xs text-slate-500 mt-1">
                              Für den Import in DATEV wird in der Regel ein Buchungsstapel im EXTF/DTVF-CSV-Format benötigt.
                          </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Berater-Nr.</label>
                          <input
                              value={datevConfig.beraterNr}
                              onChange={e => setDatevConfig(prev => ({ ...prev, beraterNr: e.target.value }))}
                              placeholder="z.B. 123456"
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Mandant-Nr.</label>
                          <input
                              value={datevConfig.mandantNr}
                              onChange={e => setDatevConfig(prev => ({ ...prev, mandantNr: e.target.value }))}
                              placeholder="z.B. 98765"
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Wirtschaftsjahr Beginn (YYYYMMDD)</label>
                          <input
                              value={datevConfig.wirtschaftsjahrBeginn}
                              onChange={e => setDatevConfig(prev => ({ ...prev, wirtschaftsjahrBeginn: e.target.value }))}
                              placeholder="20250101"
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Sachkontenlänge</label>
                          <input
                              value={String(datevConfig.sachkontenlaenge ?? '')}
                              onChange={e => setDatevConfig(prev => ({ ...prev, sachkontenlaenge: Number(e.target.value) }))}
                              placeholder="4"
                              inputMode="numeric"
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Herkunft-Kz</label>
                          <input
                              value={datevConfig.herkunftKz}
                              onChange={e => setDatevConfig(prev => ({ ...prev, herkunftKz: e.target.value }))}
                              placeholder="RE"
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Diktatkürzel (optional)</label>
                          <input
                              value={datevConfig.diktatkuerzel || ''}
                              onChange={e => setDatevConfig(prev => ({ ...prev, diktatkuerzel: e.target.value }))}
                              placeholder=""
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                          />
                      </div>

                      <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Stapel-Bezeichnung (optional)</label>
                          <input
                              value={datevConfig.stapelBezeichnung || ''}
                              onChange={e => setDatevConfig(prev => ({ ...prev, stapelBezeichnung: e.target.value }))}
                              placeholder="Buchungsstapel"
                              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-200">
                      <div className="text-sm font-semibold text-slate-800 mb-2">BU-Schlüssel Mapping (Steuerkategorie → DATEV)</div>
                      <div className="text-xs text-slate-500 mb-3">
                          Bitte mit der Steuerkanzlei abstimmen. Leere Werte blockieren den DATEV-Export, sobald die Steuerkategorie verwendet wird.
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-100 text-slate-500 font-semibold">
                                  <tr>
                                      <th className="px-3 py-2 w-32">Steuerkategorie</th>
                                      <th className="px-3 py-2">Bezeichnung</th>
                                      <th className="px-3 py-2 w-32">BU-Schlüssel</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {taxes.map(t => (
                                      <tr key={t.value} className="hover:bg-slate-50">
                                          <td className="px-3 py-2 font-mono text-xs text-slate-600">{t.value}</td>
                                          <td className="px-3 py-2 text-slate-800">{t.label}</td>
                                          <td className="px-3 py-2">
                                              <input
                                                  value={datevConfig.taxCategoryToBuKey?.[t.value] ?? ''}
                                                  onChange={e => {
                                                      const val = e.target.value;
                                                      setDatevConfig(prev => ({
                                                          ...prev,
                                                          taxCategoryToBuKey: {
                                                              ...(prev.taxCategoryToBuKey || {}),
                                                              [t.value]: val,
                                                          },
                                                      }));
                                                  }}
                                                  placeholder="z.B. 9"
                                                  className="w-full border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 font-mono"
                                              />
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'elster' && (
                                <>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                                            <h3 className="font-bold text-slate-800">🏛️ ELSTER Stammdaten (Mandant)</h3>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Diese Daten beziehen sich auf die eigene Steuernummer/USt‑IdNr (nicht auf die Lieferanten‑Steuernummer im Beleg).
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Unternehmensname *</label>
                                                <input
                                                    value={elsterStammdaten.unternehmensName}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, unternehmensName: e.target.value }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Land (ISO) *</label>
                                                <input
                                                    value={elsterStammdaten.land}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, land: e.target.value.toUpperCase() }))}
                                                    placeholder="DE"
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">PLZ *</label>
                                                <input
                                                    value={elsterStammdaten.plz}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, plz: e.target.value }))}
                                                    placeholder="12345"
                                                    inputMode="numeric"
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Ort *</label>
                                                <input
                                                    value={elsterStammdaten.ort}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, ort: e.target.value }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Straße *</label>
                                                <input
                                                    value={elsterStammdaten.strasse}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, strasse: e.target.value }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Hausnummer *</label>
                                                <input
                                                    value={elsterStammdaten.hausnummer}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, hausnummer: e.target.value }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Eigene Steuernummer *</label>
                                                <input
                                                    value={elsterStammdaten.eigeneSteuernummer}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, eigeneSteuernummer: e.target.value }))}
                                                    placeholder="z.B. 12/345/67890"
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                />
                                                <div className="text-[11px] text-slate-500 mt-1">
                                                    Hinweis: Format wird bewusst tolerant akzeptiert (Ziffern + Trennzeichen).
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Eigene USt‑IdNr (optional)</label>
                                                <input
                                                    value={elsterStammdaten.eigeneUstIdNr || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, eigeneUstIdNr: e.target.value.toUpperCase() }))}
                                                    placeholder="DE123456789"
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Finanzamt (optional)</label>
                                                <input
                                                    value={elsterStammdaten.finanzamtName || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, finanzamtName: e.target.value }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Finanzamt‑Nr (optional)</label>
                                                <input
                                                    value={elsterStammdaten.finanzamtNr || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, finanzamtNr: e.target.value }))}
                                                    placeholder="0000"
                                                    inputMode="numeric"
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Rechtsform (optional)</label>
                                                <select
                                                    value={(elsterStammdaten.rechtsform || '') as string}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, rechtsform: (e.target.value || undefined) as ElsterRechtsform | undefined }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                >
                                                    <option value="">(nicht gesetzt)</option>
                                                    {(['einzelunternehmen','gmbh','ug','gbr','ohg','kg','ev','sonstiges'] as ElsterRechtsform[]).map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">USt‑Besteuerung (optional)</label>
                                                <select
                                                    value={(elsterStammdaten.besteuerungUst || 'unbekannt') as ElsterBesteuerungUst}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, besteuerungUst: (e.target.value || 'unbekannt') as ElsterBesteuerungUst }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                >
                                                    {(['unbekannt','ist','soll'] as ElsterBesteuerungUst[]).map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-2 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={elsterStammdaten.kleinunternehmer === true}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, kleinunternehmer: e.target.checked }))}
                                                />
                                                <div className="text-sm text-slate-700">Kleinunternehmer (§19) (optional)</div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">IBAN (optional)</label>
                                                <input
                                                    value={elsterStammdaten.iban || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Kontakt E‑Mail (optional)</label>
                                                <input
                                                    value={elsterStammdaten.kontaktEmail || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, kontaktEmail: e.target.value }))}
                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'startup' && (
                                <>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                                            <h3 className="font-bold text-slate-800">🚀 Startup (Onboarding)</h3>
                                            <div className="text-xs text-slate-500 mt-1">Einfacher Fortschritt‑Tracker – wird lokal gespeichert.</div>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <label className="flex items-center gap-3 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={startupChecklist.uploadErsterBeleg}
                                                    onChange={e => setStartupChecklist(prev => ({ ...prev, uploadErsterBeleg: e.target.checked }))}
                                                />
                                                Ersten Beleg hochladen
                                            </label>
                                            <label className="flex items-center gap-3 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={startupChecklist.datevKonfiguriert}
                                                    onChange={e => setStartupChecklist(prev => ({ ...prev, datevKonfiguriert: e.target.checked }))}
                                                />
                                                DATEV‑Konfiguration prüfen
                                            </label>
                                            <label className="flex items-center gap-3 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={startupChecklist.elsterStammdatenKonfiguriert}
                                                    onChange={e => setStartupChecklist(prev => ({ ...prev, elsterStammdatenKonfiguriert: e.target.checked }))}
                                                />
                                                ELSTER‑Stammdaten ausfüllen
                                            </label>
                                            <div className="text-xs text-slate-500 pt-2">
                                                Tipp: Speichern nicht vergessen (oben rechts).
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

          </div>
      </div>
    </div>
  );
};
