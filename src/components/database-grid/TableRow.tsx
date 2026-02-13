
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
    COMPLETED: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
    REVIEW_NEEDED: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    DUPLICATE: 'bg-purple-900/30 text-purple-300 border-purple-700/50',
    ERROR: 'bg-red-900/30 text-red-300 border-red-700/50',
    PROCESSING: 'bg-blue-900/30 text-blue-300 border-blue-700/50',
    PRIVATE: 'bg-gray-900/30 text-gray-300 border-gray-700/50',
  };

  return (
    <tr className={`border-b hover:bg-surface-hover transition-colors ${isSelected ? 'bg-primary/10' : ''}`}>
      {/* Checkbox */}
      <td className="p-2 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-border"
        />
      </td>

      {/* ZOE ID */}
      <td className="p-2">
        <div className="font-mono text-xs text-text-muted">{document.data?.eigeneBelegNummer || '-'}</div>
      </td>

      {/* Date */}
      <td className="p-2">
        <div className="text-sm text-text">{document.data?.belegDatum || '-'}</div>
        <div className="text-xs text-text-muted">{document.uploadDate}</div>
      </td>

      {/* Vendor */}
      <td className="p-2">
        <div className="text-sm font-medium text-text truncate max-w-[200px]">
          {document.data?.lieferantName || document.fileName}
        </div>
      </td>

      {/* Amounts */}
      <td className="p-2 text-right">
        <div className="text-sm text-text font-mono">
          {document.data?.bruttoBetrag?.toFixed(2)} €
        </div>
        <div className="text-xs text-text-muted">
          N: {document.data?.nettoBetrag?.toFixed(2)} · M: {document.data?.mwstBetrag19?.toFixed(2)}
        </div>
      </td>

      {/* Account */}
      <td className="p-2">
        <div className="text-sm font-mono text-text">{document.data?.kontierungskonto || '-'}</div>
        <div className="text-xs text-text-muted">{document.data?.steuerkategorie || '-'}</div>
      </td>

      {/* Status */}
      <td className="p-2">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[document.status] || 'bg-gray-900/30 text-gray-300 border-gray-700/50'}`}>
          {document.status}
        </span>
        {document.duplicateOfId && (
          <div className="text-xs text-purple-300 mt-1">Link zum Original</div>
        )}
      </td>

      {/* Actions */}
      <td className="p-2">
        <div className="flex gap-1 justify-end">
          <button
            onClick={onOpen}
            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover"
            title="Öffnen"
          >
            Öffnen
          </button>
          <button
            onClick={onExport}
            className="px-2 py-1 text-xs bg-surface border border-border text-text rounded hover:bg-surface-hover"
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
            className="px-2 py-1 text-xs bg-error text-white rounded hover:bg-error-hover"
            title="Löschen"
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
};
