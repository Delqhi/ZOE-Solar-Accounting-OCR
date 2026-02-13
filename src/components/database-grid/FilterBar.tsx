
import { FilterState } from './hooks/useTableState';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  selectionCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  selectedIds: Set<string>;
  totalItems: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  selectionCount,
  onSelectAll,
  onClearSelection,
  selectedIds,
  totalItems,
}) => {
  const years = ['2026', '2025', '2024'];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const statuses = ['COMPLETED', 'REVIEW_NEEDED', 'DUPLICATE', 'ERROR', 'PROCESSING', 'PRIVATE'];

  const allSelected = selectionCount === totalItems && totalItems > 0;

  return (
    <div className="bg-surface border-b border-border p-3 space-y-3">
      {/* Selection & Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onSelectAll}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            allSelected
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-text border-border hover:bg-surface-hover'
          }`}
        >
          {allSelected ? 'Alle abwählen' : 'Alle wählen'}
        </button>

        {selectionCount > 0 && (
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded text-sm text-text">
            <span className="font-semibold text-primary">{selectionCount}</span> ausgewählt
            <button
              onClick={onClearSelection}
              className="text-error underline hover:text-error-hover"
            >
              Löschen
            </button>
          </div>
        )}

        <div className="ml-auto"></div>

        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm bg-surface text-text border border-border rounded hover:bg-surface-hover"
        >
          Filter zurücksetzen
        </button>
      </div>

      {/* Filter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Jahr</label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange({ year: e.target.value })}
            className="w-full border border-border bg-surface text-text rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Alle</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Quartal</label>
          <select
            value={filters.quarter}
            onChange={(e) => onFilterChange({ quarter: e.target.value })}
            className="w-full border border-border bg-surface text-text rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Alle</option>
            {quarters.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Monat</label>
          <select
            value={filters.month}
            onChange={(e) => onFilterChange({ month: e.target.value })}
            className="w-full border border-border bg-surface text-text rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Alle</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full border border-border bg-surface text-text rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Alle</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs text-text-muted mb-1">Lieferant</label>
          <input
            type="text"
            value={filters.vendor}
            onChange={(e) => onFilterChange({ vendor: e.target.value })}
            placeholder="Suchen..."
            className="w-full border border-border bg-surface text-text rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
