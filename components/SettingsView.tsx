import React, { useMemo, useState } from 'react';
import { AppSettings, AccountDefinition, DatevConfig, ElsterStammdaten, StartupChecklist, ElsterBesteuerungUst, ElsterRechtsform } from '../types';

// Vercel-style constants
const INPUT_CLASS = "w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all placeholder-gray-400";
const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide";
const BUTTON_PRIMARY = "bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 active:bg-gray-900 transition-all";
const BUTTON_SECONDARY = "bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-all";
const CARD_STYLE = "bg-white border border-gray-200 rounded-xl overflow-hidden";
const SECTION_TITLE = "text-lg font-semibold text-gray-900";

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
          className="underline decoration-dotted underline-offset-2 cursor-help"
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
      if (confirm('Konto wirklich loeschen?')) {
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

  const handleSaveAccounts = () => {
      onSave(buildSettingsSnapshot());
      alert('Einstellungen gespeichert!');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="h-12 border-b border-gray-200 bg-white px-6 flex items-center justify-between flex-none">
         <div className="flex items-center gap-4">
           <h2 className="font-semibold text-gray-900">Einstellungen</h2>
           <div className="flex border border-gray-200 rounded-md p-0.5">
             {([
               { id: 'system', label: 'System' },
               { id: 'elster', label: 'ELSTER' },
               { id: 'startup', label: 'Startup' },
             ] as Array<{ id: SettingsTab; label: string }>).map(t => (
               <button
                 key={t.id}
                 onClick={() => setActiveTab(t.id)}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === t.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
               >
                 {t.label}
               </button>
             ))}
           </div>
         </div>
         <div className="flex gap-2">
             <button onClick={handleSaveAccounts} className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-all">Speichern</button>
             <button onClick={onClose} className="text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-md text-sm transition-colors">Schliessen</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
              {activeTab === 'system' && (
                <>
                  {/* Tax Categories */}
                  <div className={CARD_STYLE}>
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900">Steuerkategorien (System-Vorgabe)</h3>
                      </div>
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                              <tr>
                                  <th className="px-4 py-2">ID</th>
                                  <th className="px-4 py-2">Bezeichnung</th>
                                  <th className="px-4 py-2">MwSt</th>
                                  <th className="px-4 py-2 text-center">Vorsteuer</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {taxes.map((t) => (
                                  <tr key={t.value} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{t.value}</td>
                                      <td className="px-4 py-2 font-medium text-gray-900">{t.label}</td>
                                      <td className="px-4 py-2 text-gray-600">{t.ust_satz * 100}%</td>
                                      <td className="px-4 py-2 text-center">{t.vorsteuer ? 'Ja' : 'Nein'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Accounting Accounts */}
                  <div className={CARD_STYLE}>
                       <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">Kontierungskonten (SKR03)</h3>
                          <div className="flex gap-2">
                              <input
                                value={newAccountName}
                                onChange={e => setNewAccountName(e.target.value)}
                                placeholder="Neues Konto..."
                                className="border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-gray-400 transition-all"
                              />
                              <button onClick={handleAddAccount} className="text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-md text-sm border border-gray-200 font-medium transition-all">+ Add</button>
                          </div>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2 w-16">SKR03</th>
                                    <th className="px-4 py-2 w-1/4">Konto Name</th>
                                    <th className="px-4 py-2">Erlaubte Steuerkategorien</th>
                                    <th className="px-4 py-2 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {accounts.map((acc, idx) => (
                                    <tr key={acc.id + idx} className="group hover:bg-gray-50">
                                        <td className="px-4 py-3 align-top">
                                            <input
                                                value={acc.skr03 || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAccounts(prev => prev.map(a => a.id === acc.id ? {...a, skr03: val} : a));
                                                }}
                                                placeholder="0000"
                                                className="w-full bg-transparent border-b border-transparent focus:border-gray-400 outline-none font-mono text-gray-700 font-medium"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 align-top">
                                            <input
                                                value={acc.name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAccounts(prev => prev.map(a => a.id === acc.id ? {...a, name: val} : a));
                                                }}
                                                className="w-full bg-transparent border-b border-transparent focus:border-gray-400 outline-none"
                                            />
                                            <div className="text-[10px] text-gray-400 font-mono mt-1">{acc.id}</div>
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
                                                                    ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {t.value}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleRemoveAccount(acc.id)} className="text-gray-300 hover:text-red-600 transition-colors p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>

                  {/* DATEV Export */}
                  <div className={CARD_STYLE}>
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900">DATEV Export (Buchungsstapel)</h3>
                          <div className="text-xs text-gray-500 mt-1">
                              Fuer den Import in DATEV wird in der Regel ein Buchungsstapel im EXTF/DTVF-CSV-Format benoetigt.
                          </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className={LABEL_CLASS}>Berater-Nr.</label>
                          <input
                              value={datevConfig.beraterNr}
                              onChange={e => setDatevConfig(prev => ({ ...prev, beraterNr: e.target.value }))}
                              placeholder="z.B. 123456"
                              className={INPUT_CLASS}
                          />
                      </div>
                      <div>
                          <label className={LABEL_CLASS}>Mandant-Nr.</label>
                          <input
                              value={datevConfig.mandantNr}
                              onChange={e => setDatevConfig(prev => ({ ...prev, mandantNr: e.target.value }))}
                              placeholder="z.B. 98765"
                              className={INPUT_CLASS}
                          />
                      </div>

                      <div>
                          <label className={LABEL_CLASS}>Wirtschaftsjahr Beginn (YYYYMMDD)</label>
                          <input
                              value={datevConfig.wirtschaftsjahrBeginn}
                              onChange={e => setDatevConfig(prev => ({ ...prev, wirtschaftsjahrBeginn: e.target.value }))}
                              placeholder="20250101"
                              className={`${INPUT_CLASS} font-mono`}
                          />
                      </div>
                      <div>
                          <label className={LABEL_CLASS}>Sachkontenlaenge</label>
                          <input
                              value={String(datevConfig.sachkontenlaenge ?? '')}
                              onChange={e => setDatevConfig(prev => ({ ...prev, sachkontenlaenge: Number(e.target.value) }))}
                              placeholder="4"
                              inputMode="numeric"
                              className={`${INPUT_CLASS} font-mono`}
                          />
                      </div>

                      <div>
                          <label className={LABEL_CLASS}>Herkunft-Kz</label>
                          <input
                              value={datevConfig.herkunftKz}
                              onChange={e => setDatevConfig(prev => ({ ...prev, herkunftKz: e.target.value }))}
                              placeholder="RE"
                              className={`${INPUT_CLASS} font-mono`}
                          />
                      </div>
                      <div>
                          <label className={LABEL_CLASS}>Diktatkuerzel (optional)</label>
                          <input
                              value={datevConfig.diktatkuerzel || ''}
                              onChange={e => setDatevConfig(prev => ({ ...prev, diktatkuerzel: e.target.value }))}
                              placeholder=""
                              className={INPUT_CLASS}
                          />
                      </div>

                      <div className="md:col-span-2">
                          <label className={LABEL_CLASS}>Stapel-Bezeichnung (optional)</label>
                          <input
                              value={datevConfig.stapelBezeichnung || ''}
                              onChange={e => setDatevConfig(prev => ({ ...prev, stapelBezeichnung: e.target.value }))}
                              placeholder="Buchungsstapel"
                              className={INPUT_CLASS}
                          />
                      </div>
                  </div>

                  <div className="px-4 pb-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">BU-Schluessel Mapping (Steuerkategorie -> DATEV)</div>
                      <div className="text-xs text-gray-500 mb-3">
                          Bitte mit der Steuerkanzlei abstimmen. Leere Werte blockieren den DATEV-Export, sobald die Steuerkategorie verwendet wird.
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                  <tr>
                                      <th className="px-3 py-2 w-32">Steuerkategorie</th>
                                      <th className="px-3 py-2">Bezeichnung</th>
                                      <th className="px-3 py-2 w-32">BU-Schluessel</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {taxes.map(t => (
                                      <tr key={t.value} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 font-mono text-xs text-gray-600">{t.value}</td>
                                          <td className="px-3 py-2 text-gray-900">{t.label}</td>
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
                                                  className={`${INPUT_CLASS} font-mono`}
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
                                    <div className={CARD_STYLE}>
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-900">ELSTER Stammdaten (Mandant)</h3>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Diese Daten beziehen sich auf die eigene Steuernummer/USt-IdNr (nicht auf die Lieferanten-Steuernummer im Beleg).
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className={LABEL_CLASS}>Unternehmensname *</label>
                                                <input
                                                    value={elsterStammdaten.unternehmensName}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, unternehmensName: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Land (ISO) *</label>
                                                <input
                                                    value={elsterStammdaten.land}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, land: e.target.value.toUpperCase() }))}
                                                    placeholder="DE"
                                                    className={`${INPUT_CLASS} font-mono`}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>PLZ *</label>
                                                <input
                                                    value={elsterStammdaten.plz}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, plz: e.target.value }))}
                                                    placeholder="12345"
                                                    inputMode="numeric"
                                                    className={`${INPUT_CLASS} font-mono`}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Ort *</label>
                                                <input
                                                    value={elsterStammdaten.ort}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, ort: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Strasse *</label>
                                                <input
                                                    value={elsterStammdaten.strasse}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, strasse: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Hausnummer *</label>
                                                <input
                                                    value={elsterStammdaten.hausnummer}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, hausnummer: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className={LABEL_CLASS}>Eigene Steuernummer *</label>
                                                <input
                                                    value={elsterStammdaten.eigeneSteuernummer}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, eigeneSteuernummer: e.target.value }))}
                                                    placeholder="z.B. 12/345/67890"
                                                    className={`${INPUT_CLASS} font-mono`}
                                                />
                                                <div className="text-[11px] text-gray-500 mt-1">
                                                    Hinweis: Format wird bewusst tolerant akzeptiert (Ziffern + Trennzeichen).
                                                </div>
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Eigene USt-IdNr (optional)</label>
                                                <input
                                                    value={elsterStammdaten.eigeneUstIdNr || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, eigeneUstIdNr: e.target.value.toUpperCase() }))}
                                                    placeholder="DE123456789"
                                                    className={`${INPUT_CLASS} font-mono`}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Finanzamt (optional)</label>
                                                <input
                                                    value={elsterStammdaten.finanzamtName || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, finanzamtName: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Finanzamt-Nr (optional)</label>
                                                <input
                                                    value={elsterStammdaten.finanzamtNr || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, finanzamtNr: e.target.value }))}
                                                    placeholder="0000"
                                                    inputMode="numeric"
                                                    className={`${INPUT_CLASS} font-mono`}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Rechtsform (optional)</label>
                                                <select
                                                    value={(elsterStammdaten.rechtsform || '') as string}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, rechtsform: (e.target.value || undefined) as ElsterRechtsform | undefined }))}
                                                    className={INPUT_CLASS}
                                                >
                                                    <option value="">(nicht gesetzt)</option>
                                                    {(['einzelunternehmen','gmbh','ug','gbr','ohg','kg','ev','sonstiges'] as ElsterRechtsform[]).map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>USt-Besteuerung (optional)</label>
                                                <select
                                                    value={(elsterStammdaten.besteuerungUst || 'unbekannt') as ElsterBesteuerungUst}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, besteuerungUst: (e.target.value || 'unbekannt') as ElsterBesteuerungUst }))}
                                                    className={INPUT_CLASS}
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
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                                />
                                                <div className="text-sm text-gray-700">Kleinunternehmer (§19) (optional)</div>
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>IBAN (optional)</label>
                                                <input
                                                    value={elsterStammdaten.iban || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                                                    className={`${INPUT_CLASS} font-mono`}
                                                />
                                            </div>

                                            <div>
                                                <label className={LABEL_CLASS}>Kontakt E-Mail (optional)</label>
                                                <input
                                                    value={elsterStammdaten.kontaktEmail || ''}
                                                    onChange={e => setElsterStammdaten(prev => ({ ...prev, kontaktEmail: e.target.value }))}
                                                    className={INPUT_CLASS}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'startup' && (
                                <>
                                    <div className={CARD_STYLE}>
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-900">Startup (Onboarding)</h3>
                                            <div className="text-xs text-gray-500 mt-1">Einfacher Fortschritt-Tracker – wird lokal gespeichert.</div>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <label className="flex items-center gap-3 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={startupChecklist.uploadErsterBeleg}
                                                    onChange={e => setStartupChecklist(prev => ({ ...prev, uploadErsterBeleg: e.target.checked }))}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                                />
                                                Ersten Beleg hochladen
                                            </label>
                                            <label className="flex items-center gap-3 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={startupChecklist.datevKonfiguriert}
                                                    onChange={e => setStartupChecklist(prev => ({ ...prev, datevKonfiguriert: e.target.checked }))}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                                />
                                                DATEV-Konfiguration pruefen
                                            </label>
                                            <label className="flex items-center gap-3 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={startupChecklist.elsterStammdatenKonfiguriert}
                                                    onChange={e => setStartupChecklist(prev => ({ ...prev, elsterStammdatenKonfiguriert: e.target.checked }))}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                                                />
                                                ELSTER-Stammdaten ausfuellen
                                            </label>
                                            <div className="text-xs text-gray-500 pt-2">
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
