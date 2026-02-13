/** DatabaseView Component - Enhanced with 2026 Glassmorphism 2.0 */

import { useState, useMemo, useCallback } from 'react';
import { VirtualizedDatabaseGrid } from './VirtualizedDatabaseGrid';
import { VirtualizedDocumentList } from './VirtualizedDatabaseGrid';
import { DepthCard, FloatingElement } from './designOS/depth3D';
import { TypographyHeading, TypographyBody } from './designOS/typography';
import { AccessibleButton, AccessibleInput } from './designOS/Accessibility';
import { FilterBar } from './FilterBar';
import { DocumentRecord, DocumentStatus, ViewMode } from '../types';
import { use3DDepth } from '../hooks/use3D';

interface DatabaseViewProps {
  documents: DocumentRecord[];
  settings: any;
  onViewModeChange: (mode: ViewMode) => void;
  viewMode: ViewMode;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  documents,
  settings,
  onViewModeChange,
  viewMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { depthLayer } = use3DDepth({ layers: 5, baseZ: 10 });

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = searchQuery === '' ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.extractedData?.supplier || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === null || doc.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, searchQuery, selectedStatus, sortBy, sortOrder]);

  // Virtualization event handlers
  const handleDocumentOpen = useCallback((doc: any) => {
    // Handle document opening
    console.log('Opening document:', doc.id);
  }, []);

  const handleDocumentDelete = useCallback((doc: any) => {
    // Handle document deletion
    console.log('Deleting document:', doc.id);
  }, []);

  const handleDocumentMerge = useCallback((primary: any, secondary: any) => {
    // Handle document merging
    console.log('Merging documents:', primary.id, secondary.id);
  }, []);

  const handleDuplicateCompare = useCallback((doc: any) => {
    // Handle duplicate comparison
    console.log('Comparing duplicate:', doc.id);
  }, []);

  const handleScrollEnd = useCallback(() => {
    // Handle infinite scroll end
    console.log('Reached end of documents');
  }, []);

  return (
    <FloatingElement depth={1} height={6} duration={6000} delay={100}>
      <DepthCard depth={depthLayer} hoverEffect={true} floating={true}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.05), rgba(0, 212, 255, 0.05))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <TypographyHeading level="h3">
              Dokumenten Datenbank
            </TypographyHeading>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <AccessibleButton
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                onClick={() => onViewModeChange('grid')}
                style={{ padding: '8px 16px', borderRadius: '8px' }}
              >
                📋 Grid
              </AccessibleButton>
              <AccessibleButton
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                onClick={() => onViewModeChange('list')}
                style={{ padding: '8px 16px', borderRadius: '8px' }}
              >
                📄 Liste
              </AccessibleButton>
            </div>
          </div>

          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <TypographyBody style={{ fontSize: '12px', color: '#A7B0BD', marginBottom: '4px' }}>
                Gesamt
              </TypographyBody>
              <TypographyHeading level="h4" style={{ fontSize: '20px', margin: 0 }}>
                {filteredDocuments.length}
              </TypographyHeading>
            </div>

            <div style={{
              background: 'rgba(0, 204, 102, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(0, 204, 102, 0.3)'
            }}>
              <TypographyBody style={{ fontSize: '12px', color: '#00CC66', marginBottom: '4px' }}>
                Erfolgreich
              </TypographyBody>
              <TypographyHeading level="h4" style={{ fontSize: '20px', margin: 0, color: '#00CC66' }}>
                {filteredDocuments.filter(d => d.status === 'completed').length}
              </TypographyHeading>
            </div>

            <div style={{
              background: 'rgba(255, 176, 32, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 176, 32, 0.3)'
            }}>
              <TypographyBody style={{ fontSize: '12px', color: '#FFB020', marginBottom: '4px' }}>
                In Bearbeitung
              </TypographyBody>
              <TypographyHeading level="h4" style={{ fontSize: '20px', margin: 0, color: '#FFB020' }}>
                {filteredDocuments.filter(d => d.status === 'processing').length}
              </TypographyHeading>
            </div>

            <div style={{
              background: 'rgba(255, 71, 87, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 71, 87, 0.3)'
            }}>
              <TypographyBody style={{ fontSize: '12px', color: '#FF4757', marginBottom: '4px' }}>
                Fehler
              </TypographyBody>
              <TypographyHeading level="h4" style={{ fontSize: '20px', margin: 0, color: '#FF4757' }}>
                {filteredDocuments.filter(d => d.status === 'error').length}
              </TypographyHeading>
            </div>
          </div>

          {/* Filter Bar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            documents={documents}
          />
        </div>

        {/* Virtualized Content */}
        <div style={{ padding: '1.5rem' }}>
          {filteredDocuments.length === 0 ? (
            <FloatingElement depth={2} height={4} duration={3000}>
              <DepthCard depth={2} style={{
                textAlign: 'center',
                padding: '3rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.05), rgba(0, 212, 255, 0.05))'
              }}>
                <TypographyHeading level="h4" style={{ marginBottom: '1rem' }}>
                  📁 Keine Dokumente gefunden
                </TypographyHeading>
                <TypographyBody>
                  {searchQuery || selectedStatus
                    ? 'Keine Dokumente entsprechen Ihren Filterkriterien.'
                    : 'Laden Sie Dokumente hoch oder synchronisieren Sie mit der Cloud, um sie hier anzuzeigen.'}
                </TypographyBody>
              </DepthCard>
            </FloatingElement>
          ) : (
            viewMode === 'grid' ? (
              <VirtualizedDatabaseGrid
                documents={filteredDocuments}
                onOpen={handleDocumentOpen}
                onDelete={handleDocumentDelete}
                onMerge={handleDocumentMerge}
                onDuplicateCompare={handleDuplicateCompare}
                columns={3}
                showMonitor={true}
                enableInfiniteScroll={true}
                onScrollEnd={handleScrollEnd}
              />
            ) : (
              <VirtualizedDocumentList
                documents={filteredDocuments}
                onOpen={handleDocumentOpen}
                onDelete={handleDocumentDelete}
                onMerge={handleDocumentMerge}
                onDuplicateCompare={handleDuplicateCompare}
                showMonitor={true}
                enableInfiniteScroll={true}
                onScrollEnd={handleScrollEnd}
              />
            )
          )}
        </div>
      </DepthCard>
    </FloatingElement>
  );
};
