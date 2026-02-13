import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasPrev: boolean;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasPrev,
  hasMore,
  onPrev,
  onNext,
  onGoToPage,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="bg-surface border-t border-border p-3 flex items-center justify-between flex-wrap gap-2">
      {/* Info */}
      <div className="text-sm text-text-muted">
        Zeige {startItem}-{endItem} von {totalItems} Dokumenten
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-3 py-1.5 text-sm bg-surface text-text border border-border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover"
        >
          ← Zurück
        </button>

        {getPageNumbers().map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => onGoToPage(page)}
              className={`px-3 py-1.5 text-sm rounded ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text border border-border hover:bg-surface-hover'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2 text-text-muted">
              {page}
            </span>
          )
        )}

        <button
          onClick={onNext}
          disabled={!hasMore}
          className="px-3 py-1.5 text-sm bg-surface text-text border border-border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover"
        >
          Weiter →
        </button>
      </div>
    </div>
  );
};
