import React from 'react';
import { DocumentRecord } from '../../types';

interface TableRowProps {
  document: DocumentRecord;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onExport: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  document,
  isSelected,
  onToggleSelect,
  onOpen,
  onExport,
  onDelete,
  onDuplicate,
}) => {
  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    REVIEW_NEEDED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    DUPLICATE: 'bg-purple-100 text-purple-700 border-purple-200',
    ERROR: 'bg-red-100 text-red-700 border-red-200',
    PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
    PRIVATE: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <tr className={`border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
      {/* Checkbox */}
      <td className="p-2 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300"
        />
      </td>

      {/* ZOE ID */}
      <td className="p-2">
        <div className="font-mono text-xs text-gray-600">{document.data?.eigeneBelegNummer || '-'}</div>
      </td>

      {/* Date */}
      <td className="p-2">
        <div className="text-sm text-gray-900">{document.data?.belegDatum || '-'}</div>
        <div className="text-xs text-gray-500">{document.uploadDate}</div>
      </td>

      {/* Vendor */}
      <td className="p-2">
        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
          {document.data?.lieferantName || document.fileName}
        </div>
      </td>

      {/* Amounts */}
      <td className="p-2 text-right">
        <div className="text-sm text-gray-900 font-mono">
          {document.data?.bruttoBetrag?.toFixed(2)} €
        </div>
        <div className="text-xs text-gray-500">
          N: {document.data?.nettoBetrag?.toFixed(2)} · M: {document.data?.mwstBetrag19?.toFixed(2)}
        </div>
      </td>

      {/* Account */}
      <td className="p-2">
        <div className="text-sm font-mono text-gray-700">{document.data?.kontierungskonto || '-'}</div>
        <div className="text-xs text-gray-500">{document.data?.steuerkategorie || '-'}</div>
      </td>

      {/* Status */}
      <td className="p-2">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[document.status] || 'bg-gray-100 text-gray-700'}`}>
          {document.status}
        </span>
        {document.duplicateOfId && (
          <div className="text-xs text-purple-600 mt-1">Link zum Original</div>
        )}
      </td>

      {/* Actions */}
      <td className="p-2">
        <div className="flex gap-1 justify-end">
          <button
            onClick={onOpen}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Öffnen"
          >
            Öffnen
          </button>
          <button
            onClick={onExport}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            title="Export"
          >
            PDF
          </button>
          {document.status === 'DUPLICATE' && (
            <button
              onClick={onDuplicate}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              title="Vergleichen"
            >
              Vergleich
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            title="Löschen"
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
};
