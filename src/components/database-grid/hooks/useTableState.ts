/**
 * Custom Hook: Table State Management
 * Handles pagination, filtering, sorting, selection
 */
import { useState, useMemo, useCallback } from 'react';
import { DocumentRecord } from '../../../types';

interface FilterState {
  year: string;
  quarter: string;
  month: string;
  status: string;
  vendor: string;
  dateRange: { start: string; end: string };
}

interface TableState {
  currentPage: number;
  itemsPerPage: number;
  selectedIds: Set<string>;
  sortField: keyof DocumentRecord;
  sortDirection: 'asc' | 'desc';
  filters: FilterState;
}

export function useTableState(documents: DocumentRecord[]) {
  const [state, setState] = useState<TableState>({
    currentPage: 1,
    itemsPerPage: 50,
    selectedIds: new Set(),
    sortField: 'uploadDate',
    sortDirection: 'desc',
    filters: {
      year: '',
      quarter: '',
      month: '',
      status: '',
      vendor: '',
      dateRange: { start: '', end: '' },
    },
  });

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Status filter
    if (state.filters.status) {
      filtered = filtered.filter(d => d.status === state.filters.status);
    }

    // Year filter
    if (state.filters.year) {
      filtered = filtered.filter(d => d.uploadDate.startsWith(state.filters.year));
    }

    // Month filter
    if (state.filters.month) {
      filtered = filtered.filter(d => {
        const month = d.uploadDate.substring(5, 7);
        return month === state.filters.month.padStart(2, '0');
      });
    }

    // Quarter filter
    if (state.filters.quarter) {
      const quarterMap: Record<string, string[]> = {
        Q1: ['01', '02', '03'],
        Q2: ['04', '05', '06'],
        Q3: ['07', '08', '09'],
        Q4: ['10', '11', '12'],
      };
      filtered = filtered.filter(d => {
        const month = d.uploadDate.substring(5, 7);
        return quarterMap[state.filters.quarter]?.includes(month);
      });
    }

    // Vendor filter
    if (state.filters.vendor.trim()) {
      const term = state.filters.vendor.toLowerCase();
      filtered = filtered.filter(d =>
        d.data?.lieferantName?.toLowerCase().includes(term) ||
        d.fileName.toLowerCase().includes(term)
      );
    }

    // Date range
    if (state.filters.dateRange.start) {
      filtered = filtered.filter(d => d.uploadDate >= state.filters.dateRange.start);
    }
    if (state.filters.dateRange.end) {
      filtered = filtered.filter(d => d.uploadDate <= state.filters.dateRange.end);
    }

    return filtered;
  }, [documents, state.filters]);

  // Sort documents
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments];
    const { sortField, sortDirection } = state;

    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle nested fields
      if (sortField === 'lieferantName' && a.data && b.data) {
        aVal = a.data.lieferantName || '';
        bVal = b.data.lieferantName || '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredDocuments, state.sortField, state.sortDirection]);

  // Pagination
  const paginatedDocuments = useMemo(() => {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    return sortedDocuments.slice(start, end);
  }, [sortedDocuments, state.currentPage, state.itemsPerPage]);

  const totalPages = Math.ceil(sortedDocuments.length / state.itemsPerPage);
  const hasMore = state.currentPage < totalPages;
  const hasPrev = state.currentPage > 1;

  // Selection
  const toggleSelection = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { ...prev, selectedIds: newSelected };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => {
      const allIds = paginatedDocuments.map(d => d.id);
      const allSelected = allIds.every(id => prev.selectedIds.has(id));
      const newSelected = new Set(prev.selectedIds);

      if (allSelected) {
        allIds.forEach(id => newSelected.delete(id));
      } else {
        allIds.forEach(id => newSelected.add(id));
      }

      return { ...prev, selectedIds: newSelected };
    });
  }, [paginatedDocuments]);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: new Set() }));
  }, []);

  // Actions
  const nextPage = useCallback(() => {
    setState(prev => ({ ...prev, currentPage: Math.min(prev.currentPage + 1, totalPages) }));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setState(prev => ({ ...prev, currentPage: Math.max(prev.currentPage - 1, 1) }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: Math.max(1, Math.min(page, totalPages)) }));
  }, [totalPages]);

  const updateFilters = useCallback((filters: Partial<FilterState>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      currentPage: 1, // Reset to first page on filter change
    }));
  }, []);

  const sortBy = useCallback((field: keyof DocumentRecord) => {
    setState(prev => {
      if (prev.sortField === field) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        ...prev,
        sortField: field,
        sortDirection: 'desc', // Default to desc for new fields
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        year: '',
        quarter: '',
        month: '',
        status: '',
        vendor: '',
        dateRange: { start: '', end: '' },
      },
      currentPage: 1,
    }));
  }, []);

  return {
    // State
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    selectedIds: state.selectedIds,
    sortField: state.sortField,
    sortDirection: state.sortDirection,
    filters: state.filters,

    // Computed
    filteredDocuments,
    sortedDocuments,
    paginatedDocuments,
    totalPages,
    totalItems: sortedDocuments.length,
    hasMore,
    hasPrev,
    hasSelection: state.selectedIds.size > 0,
    selectionCount: state.selectedIds.size,

    // Actions
    nextPage,
    prevPage,
    goToPage,
    updateFilters,
    resetFilters,
    sortBy,
    toggleSelection,
    selectAll,
    clearSelection,
  };
}
