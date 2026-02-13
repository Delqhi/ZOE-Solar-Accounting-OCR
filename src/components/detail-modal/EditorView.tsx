/**
 * EditorView - Document data editor component
 * 2026 Best Practices - Minimal implementation
 */
import React from 'react';
import type { ExtractedData, AppSettings, LineItem } from '../../types';

interface EditorViewProps {
  formData: ExtractedData;
  settings: AppSettings | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLineItemChange: (index: number, field: string, value: string | number) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
  onBlur: (field: string) => void;
  belegDatumRef: React.RefObject<HTMLInputElement | null>;
  lieferantNameRef: React.RefObject<HTMLInputElement | null>;
  bruttoBetragRef: React.RefObject<HTMLInputElement | null>;
}

export const EditorView: React.FC<EditorViewProps> = ({
  formData,
  onChange,
  onCheckboxChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  belegDatumRef,
  lieferantNameRef,
  bruttoBetragRef,
}) => {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input
            ref={belegDatumRef}
            type="date"
            name="belegDatum"
            value={formData.belegDatum || ''}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lieferant</label>
          <input
            ref={lieferantNameRef}
            type="text"
            name="lieferantName"
            value={formData.lieferantName || ''}
            onChange={onChange}
            placeholder="Lieferantenname"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Betrag</label>
          <input
            ref={bruttoBetragRef}
            type="number"
            name="bruttoBetrag"
            value={formData.bruttoBetrag || ''}
            onChange={onChange}
            placeholder="0.00"
            step="0.01"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Belegnummer</label>
          <input
            type="text"
            name="belegNummerLieferant"
            value={formData.belegNummerLieferant || ''}
            onChange={onChange}
            placeholder="Rechnungsnummer"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mehrwertsteuer %</label>
          <input
            type="number"
            name="mwstSatz19"
            value={formData.mwstSatz19 || 19}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="kleinbetrag"
            checked={formData.kleinbetrag || false}
            onChange={onCheckboxChange}
            className="w-4 h-4"
          />
          <label className="text-sm">Kleinbetrag</label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="reverseCharge"
            checked={formData.reverseCharge || false}
            onChange={onCheckboxChange}
            className="w-4 h-4"
          />
          <label className="text-sm">Reverse Charge</label>
        </div>

        {/* Line Items */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Positionen</h4>
          {(formData.lineItems || []).map((item: LineItem, index: number) => (
            <div key={index} className="flex gap-2 items-start mb-2 p-2 bg-gray-50 rounded">
              <input
                type="text"
                value={item.description || ''}
                onChange={(e) => onLineItemChange(index, 'description', e.target.value)}
                placeholder="Beschreibung"
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
              <input
                type="number"
                value={item.quantity || 1}
                onChange={(e) => onLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                placeholder="Anz."
                className="w-16 px-2 py-1 border rounded text-sm"
              />
              <input
                type="number"
                value={item.amount || 0}
                onChange={(e) => onLineItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="Preis"
                step="0.01"
                className="w-20 px-2 py-1 border rounded text-sm"
              />
              <button
                onClick={() => onRemoveLineItem(index)}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={onAddLineItem}
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400"
          >
            + Position hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorView;
