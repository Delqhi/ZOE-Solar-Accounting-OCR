/**
 * 2026 GLASSMORPHISM 2.0 - VIRTUALIZED DATABASE GRID
 * High-performance virtualized grid for large document lists
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useState, useMemo, useCallback } from 'react';
import { VirtualizedGrid, VirtualizedList, VirtualizationMonitor } from './designOS/virtualization';
import { DepthCard, FloatingElement } from './designOS/depth3D';
import { TypographyBody, TypographyHeading } from './designOS/typography';
import { AccessibleButton } from './designOS/Accessibility';
import { useResizeObserver } from '../hooks/useResizeObserver';

interface VirtualizedDocument {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  extractedData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  previewUrl?: string;
  estimatedHeight?: number;
}

interface VirtualizedDatabaseGridProps {
  documents: VirtualizedDocument[];
  onOpen: (doc: VirtualizedDocument) => void;
  onDelete: (doc: VirtualizedDocument) => void;
  onMerge: (primary: VirtualizedDocument, secondary: VirtualizedDocument) => void;
  onDuplicateCompare: (doc: VirtualizedDocument) => void;
  columns?: number;
  showMonitor?: boolean;
  enableInfiniteScroll?: boolean;
  onScrollEnd?: () => void;
}

export const VirtualizedDatabaseGrid: React.FC<VirtualizedDatabaseGridProps> = ({
  documents,
  onOpen,
  onDelete,
  onMerge,
  onDuplicateCompare,
  columns = 3,
  showMonitor = false,
  enableInfiniteScroll = false,
  onScrollEnd
}) => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Transform documents to virtualization format
  const virtualizedItems = useMemo(() => {
    return documents.map((doc, index) => ({
      id: doc.id,
      data: doc,
      estimatedHeight: 280, // Estimated height for grid items
      height: 280 // Fixed height for consistent grid layout
    }));
  }, [documents]);

  // Handle scroll events
  const handleScrollStart = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
    if (onScrollEnd) {
      onScrollEnd();
    }
  }, [onScrollEnd]);

  // Handle item rendering
  const renderItem = useCallback((item: any, index: number) => {
    const doc = item.data;
    const isSelected = selectedDoc === doc.id;

    return (
      <FloatingElement
        key={doc.id}
        height={8}
        duration={4000}
        delay={index * 100}
        zIndex={isSelected ? 20 : 10}
      >
        <DepthCard
          depth={isSelected ? 5 : 2}
          hoverEffect={true}
          tilt={true}
          floating={true}
          style={{
            height: '280px',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            border: isSelected ? '2px solid #00D4FF' : '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onClick={() => onOpen(doc)}
        >
          {/* Document Preview */}
          <div
            style={{
              height: '40%',
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 212, 255, 0.1))',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {doc.previewUrl ? (
              <img
                src={doc.previewUrl}
                alt="Document Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(0.2) brightness(0.9)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0) brightness(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0.2) brightness(0.9)';
                }}
              />
            ) : (
              <div style={{
                fontSize: '48px',
                opacity: 0.3,
                filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.3))'
              }}>
                📄
              </div>
            )}

            {/* Status Badge */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: getStatusColor(doc.status),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              {doc.status}
            </div>
          </div>

          {/* Document Info */}
          <div style={{ padding: '1rem' }}>
            <TypographyHeading level="h4" style={{ fontSize: '16px', marginBottom: '0.5rem', lineHeight: '1.2' }}>
              {doc.filename}
            </TypographyHeading>

            <div style={{ marginBottom: '1rem' }}>
              <TypographyBody style={{ fontSize: '12px', color: '#A7B0BD', marginBottom: '4px' }}>
                {formatFileSize(doc.size)}
              </TypographyBody>

              {doc.extractedData?.supplier && (
                <TypographyBody style={{ fontSize: '14px', color: '#C7D6E8', marginBottom: '2px' }}>
                  {doc.extractedData.supplier}
                </TypographyBody>
              )}

              {doc.extractedData?.invoiceNumber && (
                <TypographyBody style={{ fontSize: '12px', color: '#00D4FF' }}>
                  Invoice: {doc.extractedData.invoiceNumber}
                </TypographyBody>
              )}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <AccessibleButton
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(doc);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}
                >
                  📖 View
                </AccessibleButton>

                <AccessibleButton
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', color: '#FF4757' }}
                >
                  🗑️ Delete
                </AccessibleButton>
              </div>

              {doc.extractedData?.duplicateOfId && (
                <AccessibleButton
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateCompare(doc);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', color: '#FFB020' }}
                >
                  🔄 Compare
                </AccessibleButton>
              )}
            </div>
          </div>
        </DepthCard>
      </FloatingElement>
    );
  }, [selectedDoc, onOpen, onDelete, onDuplicateCompare]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return '#00CC66';
      case 'processing':
      case 'pending':
        return '#0066FF';
      case 'error':
      case 'failed':
        return '#FF4757';
      case 'private':
        return '#FFB020';
      default:
        return '#A7B0BD';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Virtualization configuration
  const virtualizationConfig = useMemo(() => ({
    itemHeight: 280,
    estimatedItemHeight: 280,
    overscan: 3,
    threshold: 0.8,
    bufferSize: 50,
    enableDynamicHeight: false,
    enableInfiniteScroll
  }), [enableInfiniteScroll]);

  return (
    <div
      ref={containerRef}
      className="virtualized-database-grid"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%'
      }}
    >
      {/* Virtualized Grid */}
      <VirtualizedGrid
        items={virtualizedItems}
        columns={columns}
        renderItem={renderItem}
        config={virtualizationConfig}
        onScrollStart={handleScrollStart}
        onScrollEnd={handleScrollEnd}
        columnGap={24}
        rowGap={24}
        style={{
          minHeight: '100%',
          width: '100%'
        }}
      />

      {/* Performance Monitor */}
      {showMonitor && (
        <VirtualizationMonitor
          itemsLength={documents.length}
          visibleItemsLength={Math.min(documents.length, 50)}
          totalHeight={documents.length * 280}
          isScrolling={isScrolling}
          renderTime={0}
        />
      )}

      {/* Loading Overlay */}
      {isScrolling && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}
        >
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <TypographyBody>Loading...</TypographyBody>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Virtualized List for detailed view
export const VirtualizedDocumentList: React.FC<VirtualizedDatabaseGridProps> = ({
  documents,
  onOpen,
  onDelete,
  onMerge,
  onDuplicateCompare,
  showMonitor = false,
  enableInfiniteScroll = false,
  onScrollEnd
}) => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  // Transform documents for list view
  const virtualizedItems = useMemo(() => {
    return documents.map((doc, index) => ({
      id: doc.id,
      data: doc,
      estimatedHeight: 120 // Estimated height for list items
    }));
  }, [documents]);

  // Render list item
  const renderItem = useCallback((item: any, index: number) => {
    const doc = item.data;
    const isSelected = selectedDoc === doc.id;

    return (
      <FloatingElement
        key={doc.id}
        height={4}
        duration={3000}
        delay={index * 50}
        zIndex={isSelected ? 20 : 10}
      >
        <DepthCard
          depth={isSelected ? 4 : 1}
          hoverEffect={true}
          style={{
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            cursor: 'pointer',
            transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
            borderLeft: isSelected ? '4px solid #00D4FF' : '4px solid transparent'
          }}
          onClick={() => onOpen(doc)}
        >
          {/* Preview Thumbnail */}
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 212, 255, 0.1))',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '24px' }}>📄</span>
          </div>

          {/* Document Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <TypographyHeading level="h4" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                {doc.filename}
              </TypographyHeading>
              <span style={{
                background: getStatusColor(doc.status),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                {doc.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
              <TypographyBody style={{ fontSize: '12px', color: '#A7B0BD' }}>
                {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
              </TypographyBody>
              <TypographyBody style={{ fontSize: '12px', color: '#C7D6E8' }}>
                {doc.extractedData?.supplier || 'Unknown Supplier'}
              </TypographyBody>
            </div>

            {doc.extractedData?.invoiceNumber && (
              <TypographyBody style={{ fontSize: '12px', color: '#00D4FF' }}>
                Invoice: {doc.extractedData.invoiceNumber}
              </TypographyBody>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <AccessibleButton
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(doc);
              }}
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}
            >
              📖 View
            </AccessibleButton>

            <AccessibleButton
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc);
              }}
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', color: '#FF4757' }}
            >
              🗑️ Delete
            </AccessibleButton>
          </div>
        </DepthCard>
      </FloatingElement>
    );
  }, [selectedDoc, onOpen, onDelete]);

  // Virtualization configuration for list
  const virtualizationConfig = useMemo(() => ({
    itemHeight: 120,
    estimatedItemHeight: 120,
    overscan: 5,
    threshold: 0.8,
    bufferSize: 30,
    enableDynamicHeight: false,
    enableInfiniteScroll
  }), [enableInfiniteScroll]);

  return (
    <div className="virtualized-document-list" style={{ position: 'relative', height: '100%' }}>
      <VirtualizedList
        items={virtualizedItems}
        renderItem={renderItem}
        config={virtualizationConfig}
        onScrollStart={() => {}}
        onScrollEnd={onScrollEnd}
        style={{ height: '100%' }}
      />

      {showMonitor && (
        <VirtualizationMonitor
          itemsLength={documents.length}
          visibleItemsLength={Math.min(documents.length, 20)}
          totalHeight={documents.length * 120}
          isScrolling={false}
          renderTime={0}
        />
      )}
    </div>
  );
};

export default VirtualizedDatabaseGrid;