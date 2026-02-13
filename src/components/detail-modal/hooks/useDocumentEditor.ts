/**
 * useDocumentEditor - Stub for 2026 refactoring
 * Minimal implementation to fix TypeScript errors
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import type { DocumentRecord, ExtractedData, AppSettings } from '../../../types';
import { DocumentStatus } from '../../../types';

export interface UseDocumentEditorProps {
  document: DocumentRecord;
  allDocuments: DocumentRecord[];
  onSave: (doc: DocumentRecord) => Promise<void> | void;
}

export interface UseDocumentEditorReturn {
  formData: ExtractedData;
  settings: AppSettings | null;
  viewUrl: string;
  viewType: 'pdf' | 'image';
  activeFileIndex: number;
  showMergeSearch: boolean;
  mergeQuery: string;
  filteredMergeCandidates: DocumentRecord[];
  isDuplicate: boolean;
  isError: boolean;
  isReview: boolean;
  errorMessage: string;
  errorNextSteps: string[];
  shortcutHint: string;
  originalDoc: DocumentRecord | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  belegDatumRef: React.RefObject<HTMLInputElement | null>;
  lieferantNameRef: React.RefObject<HTMLInputElement | null>;
  bruttoBetragRef: React.RefObject<HTMLInputElement | null>;
  setShowMergeSearch: (show: boolean) => void;
  setMergeQuery: (query: string) => void;
  setActiveFileIndex: (index: number) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLineItemChange: (index: number, field: string, value: string | number) => void;
  handleAddLineItem: () => void;
  handleRemoveLineItem: (index: number) => void;
  handleBlur: (field: string) => void;
  handleSaveNow: () => Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddFileClick: () => void;
}

export function useDocumentEditor({
  document,
  allDocuments,
  onSave,
}: UseDocumentEditorProps): UseDocumentEditorReturn {
  const [formData, setFormData] = useState<ExtractedData>(document.data || {
    lineItems: [],
    belegDatum: '',
    belegNummerLieferant: '',
    lieferantName: '',
    lieferantAdresse: '',
    steuernummer: '',
    nettoBetrag: 0,
    mwstSatz0: 0,
    mwstBetrag0: 0,
    mwstSatz7: 0,
    mwstBetrag7: 0,
    mwstSatz19: 0,
    mwstBetrag19: 0,
    bruttoBetrag: 0,
    zahlungsmethode: '',
    kontogruppe: '',
    konto_skr03: '',
    ust_typ: '',
    sollKonto: '',
    habenKonto: '',
    steuerKategorie: '',
    eigeneBelegNummer: '',
    zahlungsDatum: '',
    zahlungsStatus: '',
    aufbewahrungsOrt: '',
    rechnungsEmpfaenger: '',
    kleinbetrag: false,
    vorsteuerabzug: false,
    reverseCharge: false,
    privatanteil: false,
    beschreibung: '',
    quantity: 0,
  });
  const [settings] = useState<AppSettings | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [showMergeSearch, setShowMergeSearch] = useState(false);
  const [mergeQuery, setMergeQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const belegDatumRef = useRef<HTMLInputElement>(null);
  const lieferantNameRef = useRef<HTMLInputElement>(null);
  const bruttoBetragRef = useRef<HTMLInputElement>(null);

  const viewUrl = useMemo(() => {
    return document.previewUrl || '';
  }, [document]);

  const viewType = useMemo(() => {
    if (document.fileType?.includes('pdf')) return 'pdf';
    return 'image';
  }, [document]);

  const filteredMergeCandidates = useMemo(() => {
    if (!mergeQuery) return [];
    return allDocuments.filter(d => 
      d.id !== document.id && 
      (d.fileName?.toLowerCase().includes(mergeQuery.toLowerCase()) ||
       d.data?.lieferantName?.toLowerCase().includes(mergeQuery.toLowerCase()))
    );
  }, [mergeQuery, allDocuments, document.id]);

  const isDuplicate = useMemo(() => {
    return document.status === DocumentStatus.DUPLICATE || !!document.duplicateOfId;
  }, [document]);

  const isError = useMemo(() => {
    return document.status === DocumentStatus.ERROR;
  }, [document]);

  const isReview = useMemo(() => {
    return document.status === DocumentStatus.REVIEW_NEEDED;
  }, [document]);

  const errorMessage = useMemo(() => {
    return document.error || '';
  }, [document]);

  const errorNextSteps = useMemo(() => {
    return [] as string[];
  }, []);

  const shortcutHint = useMemo(() => {
    return 'Alt+←/→ für Navigation';
  }, []);

  const originalDoc = useMemo(() => {
    return allDocuments.find(d => d.id === document.duplicateOfId) || null;
  }, [allDocuments, document.duplicateOfId]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }, []);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  const handleLineItemChange = useCallback((index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const lineItems = [...(prev.lineItems || [])];
      if (lineItems[index]) {
        lineItems[index] = { ...lineItems[index], [field]: value };
      }
      return { ...prev, lineItems };
    });
  }, []);

  const handleAddLineItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), { description: '', quantity: 1, amount: 0 }],
    }));
  }, []);

  const handleRemoveLineItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((_, i) => i !== index),
    }));
  }, []);

  const handleBlur = useCallback((field: string) => {
    // Validation on blur
  }, []);

  const handleSaveNow = useCallback(async () => {
    const updatedDoc = { ...document, data: formData };
    await onSave(updatedDoc);
  }, [document, formData, onSave]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file upload
    console.log('File selected:', e.target.files?.[0]?.name);
  }, []);

  const handleAddFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    formData,
    settings,
    viewUrl,
    viewType,
    activeFileIndex,
    showMergeSearch,
    mergeQuery,
    filteredMergeCandidates,
    isDuplicate,
    isError,
    isReview,
    errorMessage,
    errorNextSteps,
    shortcutHint,
    originalDoc,
    fileInputRef,
    belegDatumRef,
    lieferantNameRef,
    bruttoBetragRef,
    setShowMergeSearch,
    setMergeQuery,
    setActiveFileIndex,
    handleInputChange,
    handleCheckboxChange,
    handleLineItemChange,
    handleAddLineItem,
    handleRemoveLineItem,
    handleBlur,
    handleSaveNow,
    handleFileChange,
    handleAddFileClick,
  };
}

export default useDocumentEditor;
