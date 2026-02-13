import { useState, useMemo } from 'react';
import { DocumentRecord, AppSettings } from '../../types';

export type ViewMode = 'document' | 'settings' | 'database' | 'auth' | 'backup' | 'interactions';

interface UseAppStateReturn {
  documents: DocumentRecord[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRecord[]>>;
  settings: AppSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings | null>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDocId: string | null;
  setSelectedDocId: React.Dispatch<React.SetStateAction<string | null>>;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filterYear: string;
  setFilterYear: React.Dispatch<React.SetStateAction<string>>;
  filterQuarter: string;
  setFilterQuarter: React.Dispatch<React.SetStateAction<string>>;
  filterMonth: string;
  setFilterMonth: React.Dispatch<React.SetStateAction<string>>;
  filterStatus: string;
  setFilterStatus: React.Dispatch<React.SetStateAction<string>>;
  filterVendor: string;
  setFilterVendor: React.Dispatch<React.SetStateAction<string>>;
  compareDoc: DocumentRecord | null;
  setCompareDoc: React.Dispatch<React.SetStateAction<DocumentRecord | null>>;
  originalDoc: DocumentRecord | null;
  setOriginalDoc: React.Dispatch<React.SetStateAction<DocumentRecord | null>>;
  sidebarWidth: number;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  filteredDocuments: DocumentRecord[];
  availableYears: string[];
}

export function useAppState(): UseAppStateReturn {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('document');
  const [searchQuery, setSearchQuery] = useState('');

  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');

  const [compareDoc, setCompareDoc] = useState<DocumentRecord | null>(null);
  const [originalDoc, setOriginalDoc] = useState<DocumentRecord | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
      if (filterVendor !== 'all' && doc.data?.lieferantName !== filterVendor) return false;
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const d = doc.data;
        if (
          !doc.fileName.toLowerCase().includes(term) &&
          !d?.lieferantName?.toLowerCase().includes(term) &&
          !d?.eigeneBelegNummer?.toLowerCase().includes(term) &&
          !d?.bruttoBetrag?.toString().includes(term)
        ) {
          return false;
        }
      }
      const dateStr = doc.data?.belegDatum || doc.uploadDate;
      const year = dateStr?.substring(0, 4);
      const month = parseInt(dateStr?.substring(5, 7) || '0', 10);
      if (filterYear !== 'all' && year !== filterYear) return false;
      if (filterMonth !== 'all' && month !== parseInt(filterMonth, 10)) return false;
      if (filterQuarter !== 'all') {
        const q = Math.ceil(month / 3);
        if (`Q${q}` !== filterQuarter) return false;
      }
      return true;
    });
  }, [documents, searchQuery, filterYear, filterQuarter, filterMonth, filterStatus, filterVendor]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    documents.forEach((d) => {
      const date = d.data?.belegDatum || d.uploadDate;
      if (date) years.add(date.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [documents]);

  return {
    documents,
    setDocuments,
    settings,
    setSettings,
    isProcessing,
    setIsProcessing,
    selectedDocId,
    setSelectedDocId,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterYear,
    setFilterYear,
    filterQuarter,
    setFilterQuarter,
    filterMonth,
    setFilterMonth,
    filterStatus,
    setFilterStatus,
    filterVendor,
    setFilterVendor,
    compareDoc,
    setCompareDoc,
    originalDoc,
    setOriginalDoc,
    sidebarWidth,
    setSidebarWidth,
    filteredDocuments,
    availableYears,
  };
}
