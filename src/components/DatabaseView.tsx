/** DatabaseView Component - Enhanced with 2026 Glassmorphism 2.0 */

import { useState, useMemo, useCallback } from 'react';
import { EnhancedCard } from './designOS';
import { DocumentRecord, DocumentStatus } from '../types';

interface DatabaseViewProps {
  documents: DocumentRecord[];
  settings?: unknown;
  onViewModeChange?: (mode: string) => void;
  viewMode?: string;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  documents,
  settings,
  onViewModeChange,
  viewMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mark intentionally unused variables
  void settings;
  void onViewModeChange;
  void viewMode;

  // Filter documents
  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const matchesSearch =
        searchQuery === '' ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.data?.lieferantName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === null || doc.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.fileName.toLowerCase();
          bValue = b.fileName.toLowerCase();
          break;
        case 'size':
          aValue = 0; // Size not in DocumentRecord
          bValue = 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, searchQuery, selectedStatus, sortBy, sortOrder]);

  // Event handlers
  const handleDocumentOpen = useCallback((_doc: DocumentRecord) => {
    // Open detail modal with document
    console.warn('[DatabaseView] handleDocumentOpen not implemented');
  }, []);

  const handleDocumentDelete = useCallback((_doc: DocumentRecord) => {
    // Confirm and delete from Supabase
    console.warn('[DatabaseView] handleDocumentDelete not implemented');
  }, []);

  return (
    <EnhancedCard>
      <div className="database-view">
        <div className="database-header">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            {Object.values(DocumentStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
            className="sort-by"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="sort-order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="document-list">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="document-item">
              <span className="doc-name">{doc.fileName}</span>
              <span className="doc-status">{doc.status}</span>
              <span className="doc-date">{new Date(doc.uploadDate).toLocaleDateString()}</span>
              <div className="doc-actions">
                <button type="button" onClick={() => handleDocumentOpen(doc)}>
                  Open
                </button>
                <button type="button" onClick={() => handleDocumentDelete(doc)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="document-count">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      </div>
    </EnhancedCard>
  );
};

export default DatabaseView;
