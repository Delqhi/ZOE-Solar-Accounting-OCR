import React from 'react';
import { ExtractedData, LineItem } from '../../types';
import { validateSumCheck } from '../../services/validation';

interface EditorViewProps {
  formData: Partial<ExtractedData>;
  settings: any | null;
  onChange: (field: keyof ExtractedData, value: any) => void;
  onCheckboxChange: (field: keyof ExtractedData, checked: boolean) => void;
  onLineItemChange: (index: number, field: keyof LineItem, value: any) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
  onBlur: () => void;

  // Refs for focus
  belegDatumRef?: React.RefObject<HTMLInputElement>;
  lieferantNameRef?: React.RefObject<HTMLInputElement>;
  bruttoBetragRef?: React.RefObject<HTMLInputElement>;
}

const INPUT_CLASS = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none placeholder-slate-400 transition-all";
const LABEL_CLASS = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

export const EditorView: React.FC<EditorViewProps> = ({
  formData,
  settings,
  onChange,
  onCheckboxChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onBlur,
  belegDatumRef,
  lieferantNameRef,
  bruttoBetragRef,
}) => {
  const accounts = settings?.accountDefinitions || [];
  const taxes = settings?.taxDefinitions || [];
  const selectedAccount = accounts.find((a: any) => a.id === formData.kontierungskonto);
  const availableTaxes = selectedAccount
    ? taxes.filter((t: any) => selectedAccount.steuerkategorien.includes(t.value))
    : taxes;

  // Calculate sum validation
  const sumValid = formData.nettoBetrag && formData.mwstBetrag19 && formData.bruttoBetrag
    ? validateSumCheck(formData.nettoBetrag, formData.mwstBetrag19, formData.bruttoBetrag)
    : true;

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Required Fields Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">Pflichtfelder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Belegdatum</label>
            <input
              ref={belegDatumRef}
              type="date"
              value={formData.belegDatum || ''}
              onChange={(e) => onChange('belegDatum', e.target.value)}
              onBlur={onBlur}
              className={INPUT_CLASS}
              placeholder="TT.MM.JJJJ"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Lieferant</label>
            <input
              ref={lieferantNameRef}
              type="text"
              value={formData.lieferantName || ''}
              onChange={(e) => onChange('lieferantName', e.target.value)}
              onBlur={onBlur}
              className={INPUT_CLASS}
              placeholder="Firmenname"
            />
          </div>
        </div>
      </div>

      {/* Financial Data */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Beträge</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={LABEL_CLASS}>Netto</label>
            <input
              ref={bruttoBetragRef}
              type="number"
              step="0.01"
              value={formData.nettoBetrag || ''}
              onChange={(e) => onChange('nettoBetrag', parseFloat(e.target.value))}
              onBlur={onBlur}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>MwSt</label>
            <input
              type="number"
              step="0.01"
              value={formData.mwstBetrag19 || ''}
              onChange={(e) => onChange('mwstBetrag19', parseFloat(e.target.value))}
              onBlur={onBlur}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Brutto</label>
            <input
              type="number"
              step="0.01"
              value={formData.bruttoBetrag || ''}
              onChange={(e) => onChange('bruttoBetrag', parseFloat(e.target.value))}
              onBlur={onBlur}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {!sumValid && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            ⚠️ Summenprüfung fehlgeschlagen: Netto + MwSt ≠ Brutto
          </div>
        )}
      </div>

      {/* SKR03 & Tax */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Kontierung</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>SKR03 Konto</label>
            <select
              value={formData.kontierungskonto || ''}
              onChange={(e) => onChange('kontierungskonto', e.target.value)}
              onBlur={onBlur}
              className={INPUT_CLASS}
            >
              <option value="">-- Konto wählen --</option>
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.id} - {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Steuerkategorie</label>
            <select
              value={formData.steuerkategorie || ''}
              onChange={(e) => onChange('steuerkategorie', e.target.value)}
              onBlur={onBlur}
              className={INPUT_CLASS}
            >
              <option value="">-- Kategorie wählen --</option>
              {availableTaxes.map((tax: any) => (
                <option key={tax.value} value={tax.value}>
                  {tax.label} ({tax.value}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      {formData.lineItems && formData.lineItems.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Positionen</h3>
            <button
              onClick={onAddLineItem}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              + Position hinzufügen
            </button>
          </div>

          <div className="space-y-2">
            {formData.lineItems.map((item: LineItem, idx: number) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Beschreibung"
                  value={item.description}
                  onChange={(e) => onLineItemChange(idx, 'description', e.target.value)}
                  onBlur={onBlur}
                  className={`${INPUT_CLASS} flex-1`}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Betrag"
                  value={item.amount}
                  onChange={(e) => onLineItemChange(idx, 'amount', parseFloat(e.target.value))}
                  onBlur={onBlur}
                  className={`${INPUT_CLASS} w-24`}
                />
                <button
                  onClick={() => onRemoveLineItem(idx)}
                  className="px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.privatanteil || false}
            onChange={(e) => onCheckboxChange('privatanteil', e.target.checked)}
            onBlur={onBlur}
            className="rounded border-gray-300"
          />
          Privatbeleg
        </label>
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
        <div>
          <label className={LABEL_CLASS}>Verwendungszweck</label>
          <input
            type="text"
            value={formData.beschreibung || ''}
            onChange={(e) => onChange('beschreibung', e.target.value)}
            onBlur={onBlur}
            className={INPUT_CLASS}
            placeholder="Optionale Beschreibung"
          />
        </div>
      </div>
    </div>
  );
};
