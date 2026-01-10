/**
 * App Context - Centralized State Management
 * Replaces prop drilling with React Context + useReducer
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { DocumentRecord, AppSettings, AppContextType, AppState } from '../types';
import { getAllDocuments, saveDocument, deleteDocument, saveSettings, getSettings } from '../services/storageService';
import { toast } from 'react-hot-toast';

// Initial State
const initialSettings: AppSettings = {
  id: 'default',
  taxDefinitions: [
    { value: '19', label: '19% USt', ust_satz: 0.19, vorsteuer: true, reverse_charge: false },
    { value: '7', label: '7% USt (erm.', ust_satz: 0.07, vorsteuer: true, reverse_charge: false },
    { value: '0', label: '0% Steuer', ust_satz: 0, vorsteuer: true, reverse_charge: false },
  ],
  accountDefinitions: [
    { id: '3400', name: 'Wareneingang', skr03: '3400', steuerkategorien: ['19', '7', '0'] },
    { id: '4400', name: 'Energie', skr03: '4400', steuerkategorien: ['19'] },
    { id: '4930', name: 'Büromaterial', skr03: '4930', steuerkategorien: ['19', '0'] },
    { id: '4964', name: 'Software', skr03: '4964', steuerkategorien: ['19'] },
  ],
  // Legacy
  accountGroups: [],
  ocrConfig: {
    scores: {},
    required_fields: ['belegDatum', 'lieferantName', 'bruttoBetrag'],
    field_weights: {},
    regex_patterns: {},
    validation_rules: { sum_check: true, date_check: true, min_confidence: 0.7 },
  },
};

const initialState: AppState = {
  documents: [],
  settings: initialSettings,
  loading: false,
  error: null,
  selectedDocumentId: null,
  filters: { year: '', quarter: '', month: '', status: '', vendor: '' },
};

// Reducer
type AppAction =
  | { type: 'SET_DOCUMENTS'; payload: DocumentRecord[] }
  | { type: 'ADD_DOCUMENT'; payload: DocumentRecord }
  | { type: 'UPDATE_DOCUMENT'; payload: DocumentRecord }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_DOCUMENT'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<AppState['filters']> }
  | { type: 'CLEAR_FILTERS' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };

    case 'ADD_DOCUMENT':
      return {
        ...state,
        documents: [action.payload, ...state.documents],
      };

    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };

    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(d => d.id !== action.payload),
        selectedDocumentId: state.selectedDocumentId === action.payload ? null : state.selectedDocumentId,
      };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SELECT_DOCUMENT':
      return { ...state, selectedDocumentId: action.payload };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: { year: '', quarter: '', month: '', status: '', vendor: '' },
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<AppContextType | null>(null);

// Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Load from Supabase
      const docs = await getAllDocuments();
      dispatch({ type: 'SET_DOCUMENTS', payload: docs });

      // Load settings
      const settings = await getSettings();
      if (settings) {
        dispatch({ type: 'SET_SETTINGS', payload: settings });
      }

      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error: any) {
      console.error('Init error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
      toast.error('Daten konnten nicht geladen werden');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Actions
  const addDocument = useCallback(async (doc: DocumentRecord) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const saved = await saveDocument(doc);
      dispatch({ type: 'ADD_DOCUMENT', payload: saved as any });
      toast.success('Dokument gespeichert');
    } catch (error: any) {
      console.error('Add error:', error);
      toast.error('Speichern fehlgeschlagen');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateDocument = useCallback(async (doc: DocumentRecord) => {
    try {
      const saved = await saveDocument(doc);
      dispatch({ type: 'UPDATE_DOCUMENT', payload: saved as any });
      toast.success('Aktualisiert');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Aktualisierung fehlgeschlagen');
    }
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    try {
      await deleteDocument(id);
      dispatch({ type: 'DELETE_DOCUMENT', payload: id });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Löschen fehlgeschlagen');
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...state.settings, ...updates };
      await saveSettings(newSettings);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      toast.success('Einstellungen gespeichert');
    } catch (error: any) {
      console.error('Settings error:', error);
      toast.error('Einstellungen konnten nicht gespeichert werden');
    }
  }, [state.settings]);

  const selectDocument = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_DOCUMENT', payload: id });
  }, []);

  const updateFilters = useCallback((filters: Partial<AppState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Retry OCR
  const retryOCR = useCallback(async (doc: DocumentRecord) => {
    try {
      // Call OCR service (placeholder - would integrate actual service)
      toast.success('OCR wird erneut gestartet...');
      // Implementation would go here
    } catch (error: any) {
      toast.error('OCR erneut fehlgeschlagen');
    }
  }, []);

  // Merge documents
  const mergeDocuments = useCallback(async (sourceId: string, targetId: string) => {
    try {
      const source = state.documents.find(d => d.id === sourceId);
      const target = state.documents.find(d => d.id === targetId);

      if (!source || !target) return;

      // Merge data
      const mergedData = {
        ...target.data,
        ...source.data,
        lineItems: [...(target.data?.lineItems || []), ...(source.data?.lineItems || [])],
      };

      const updatedTarget = { ...target, data: mergedData };
      await updateDocument(updatedTarget);
      await removeDocument(sourceId);

      toast.success('Dokumente erfolgreich verbunden');
    } catch (error: any) {
      console.error('Merge error:', error);
      toast.error('Verbinden fehlgeschlagen');
    }
  }, [state.documents, updateDocument, removeDocument]);

  // Value
  const value: AppContextType = {
    state,
    addDocument,
    updateDocument,
    deleteDocument: removeDocument,
    updateSettings,
    selectDocument,
    updateFilters,
    clearFilters,
    retryOCR,
    mergeDocuments,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Selector hooks for specific data
export const useDocuments = () => {
  const { state } = useApp();
  const { documents, filters } = state;

  // Apply filters
  const filteredDocuments = React.useMemo(() => {
    let filtered = [...documents];

    if (filters.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }

    if (filters.year) {
      filtered = filtered.filter(d => d.uploadDate.startsWith(filters.year));
    }

    if (filters.month) {
      filtered = filtered.filter(d => {
        const month = d.uploadDate.substring(5, 7);
        return month === filters.month.padStart(2, '0');
      });
    }

    if (filters.vendor.trim()) {
      const term = filters.vendor.toLowerCase();
      filtered = filtered.filter(d =>
        d.data?.lieferantName?.toLowerCase().includes(term) ||
        d.fileName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [documents, filters]);

  return { documents: filteredDocuments, loading: state.loading };
};

export const useSettings = () => {
  const { state, updateSettings } = useApp();
  return { settings: state.settings, updateSettings };
};
