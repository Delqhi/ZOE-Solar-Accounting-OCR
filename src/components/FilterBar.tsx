/** FilterBar Component - Placeholder */



interface FilterBarProps {
  filterStatus?: string;
  onFilterStatusChange?: (status: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filterStatus, onFilterStatusChange }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg mb-4">
      <h3 className="font-bold mb-2">Filter</h3>
      <select
        value={filterStatus || 'all'}
        onChange={(e) => onFilterStatusChange?.(e.target.value)}
        className="border rounded p-2"
      >
        <option value="all">Alle</option>
        <option value="COMPLETED">Abgeschlossen</option>
        <option value="REVIEW_NEEDED">Prüfen</option>
        <option value="ERROR">Fehler</option>
      </select>
    </div>
  );
};
