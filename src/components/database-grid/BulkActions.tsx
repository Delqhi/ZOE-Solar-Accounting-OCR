import React from 'react';

interface BulkActionsProps {
  selectedIds: Set<string>;
  onBulkExport: () => void;
  onBulkDelete: () => void;
  onBulkMarkPrivate: () => void;
  onBulkExportCSV: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onBulkExport,
  onBulkDelete,
  onBulkMarkPrivate,
  onBulkExportCSV,
}) => {
  if (selectedIds.size === 0) return null;

  return (
    <div className="bg-purple-900/20 border border-purple-700/40 p-3 flex gap-2 items-center flex-wrap">
      <span className="text-sm font-semibold text-purple-200">Aktionen für {selectedIds.size} Dokumente:</span>

      <button
        onClick={onBulkExport}
        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        ELSTER Export
      </button>

      <button
        onClick={onBulkExportCSV}
        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        CSV Export
      </button>

      <button
        onClick={onBulkMarkPrivate}
        className="px-3 py-1.5 text-sm bg-surface border border-border text-text rounded hover:bg-surface-hover"
      >
        Als Privat markieren
      </button>

      <button
        onClick={onBulkDelete}
        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
      >
        Löschen
      </button>
    </div>
  );
};
