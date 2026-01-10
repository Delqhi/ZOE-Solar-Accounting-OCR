/**
 * Custom Hook: Document Editor State Management
 * Extracts editing logic from DetailModal
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DocumentRecord, ExtractedData, LineItem, Attachment, AppSettings } from '../../../types';
import { getSettings } from '../../../services/storageService';
import { isPresent, getErrorNextSteps } from '../../../services/validation';

export interface UseDocumentEditorProps {
  document: DocumentRecord;
  allDocuments: DocumentRecord[];
  onSave: (doc: DocumentRecord) => Promise<void> | void;
}

export interface UseDocumentEditorReturn {
  formData: Partial<ExtractedData>;
  settings: AppSettings | null;
  activeFileIndex: number;
  viewUrl: string | null;
  viewType: string;
  showMergeSearch: boolean;
  mergeQuery: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  belegDatumRef: React.RefObject<HTMLInputElement>;
  lieferantNameRef: React.RefObject<HTMLInputElement>;
  bruttoBetragRef: React.RefObject<HTMLInputElement>;

  // Handlers
  handleInputChange: (field: keyof ExtractedData, value: any) => void;
  handleCheckboxChange: (field: keyof ExtractedData, checked: boolean) => void;
  handleLineItemChange: (index: number, field: keyof LineItem, value: any) => void;
  handleAddLineItem: () => void;
  handleRemoveLineItem: (index: number) => void;
  handleBlur: () => void;
  handleSaveNow: () => Promise<void>;
  handleAddFileClick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // UI State
  setActiveFileIndex: (index: number) => void;
  setShowMergeSearch: (show: boolean) => void;
  setMergeQuery: (query: string) => void;

  // Computed
  accounts: any[];
  taxes: any[];
  selectedAccount: any;
  availableTaxes: any[];
  filteredMergeCandidates: DocumentRecord[];
  totalPages: number;
  isDuplicate: boolean;
  isError: boolean;
  isReview: boolean;
  errorMessage: string;
  originalDoc: DocumentRecord | undefined;
  errorNextSteps: string[];
  shortcutHint: string;
}

export function useDocumentEditor({
  document,
  allDocuments,
  onSave,
}: UseDocumentEditorProps): UseDocumentEditorReturn {
  const [formData, setFormData] = useState<Partial<ExtractedData>>(document.data || {});
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>('');
  const [showMergeSearch, setShowMergeSearch] = useState(false);
  const [mergeQuery, setMergeQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const belegDatumRef = useRef<HTMLInputElement>(null);
  const lieferantNameRef = useRef<HTMLInputElement>(null);
  const bruttoBetragRef = useRef<HTMLInputElement>(null);
  const latestFormDataRef = useRef<Partial<ExtractedData>>(formData);

  // Update ref on formData change
  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  // Load settings
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Reset state when document changes
  useEffect(() => {
    setFormData(document.data || {});
    setActiveFileIndex(0);
  }, [document.id]);

  // Handle PDF preview
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const atts = document.attachments || [];
    const currentUrl = activeFileIndex > 0 && atts[activeFileIndex - 1]
      ? atts[activeFileIndex - 1].url
      : document.previewUrl || '';
    const currentType = activeFileIndex > 0 && atts[activeFileIndex - 1]
      ? atts[activeFileIndex - 1].type
      : document.fileType;

    if (currentUrl.startsWith('data:')) {
      fetch(currentUrl)
        .then(res => res.blob())
        .then(blob => {
          if (active) {
            objectUrl = URL.createObjectURL(blob);
            setViewUrl(objectUrl);
            setViewType(currentType);
          }
        });
    } else {
      setViewUrl(currentUrl);
      setViewType(currentType);
    }

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document, activeFileIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        handleSaveNow();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [formData]);

  // Handlers
  const handleInputChange = useCallback((field: keyof ExtractedData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCheckboxChange = useCallback((field: keyof ExtractedData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  }, []);

  const handleLineItemChange = useCallback((index: number, field: keyof LineItem, value: any) => {
    const newItems = [...(formData.lineItems || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, lineItems: newItems }));
  }, [formData.lineItems]);

  const handleAddLineItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), { description: '', amount: 0 }]
    }));
  }, []);

  const handleRemoveLineItem = useCallback((index: number) => {
    const newItems = [...(formData.lineItems || [])];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, lineItems: newItems }));
  }, [formData.lineItems]);

  const handleBlur = useCallback(() => {
    onSave({ ...document, data: formData as ExtractedData });
  }, [document, formData, onSave]);

  const handleSaveNow = useCallback(async () => {
    await onSave({ ...document, data: latestFormDataRef.current as ExtractedData });
  }, [document, onSave]);

  const handleAddFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          url: res,
          type: file.type,
          name: file.name
        };
        const updatedDoc = {
          ...document,
          attachments: [...(document.attachments || []), newAttachment]
        };
        onSave(updatedDoc);
      };
      reader.readAsDataURL(file);
    }
  }, [document, onSave]);

  // Computed values
  const accounts = settings?.accountDefinitions || [];
  const taxes = settings?.taxDefinitions || [];
  const selectedAccount = accounts.find(a => a.id === formData.kontierungskonto);
  const availableTaxes = selectedAccount
    ? taxes.filter(t => selectedAccount.steuerkategorien.includes(t.value))
    : taxes;

  const filteredMergeCandidates = allDocuments
    .filter(d => d.id !== document.id)
    .filter(d => d.status !== 'DUPLICATE' && d.status !== 'ERROR' && d.status !== 'REVIEW_NEEDED')
    .filter(d => {
      const term = mergeQuery.toLowerCase();
      return d.fileName.toLowerCase().includes(term) ||
             d.data?.lieferantName?.toLowerCase().includes(term) ||
             d.data?.bruttoBetrag?.toString().includes(term) ||
             d.uploadDate.includes(term);
    })
    .slice(0, 5);

  const totalPages = 1 + (document.attachments?.length || 0);
  const isDuplicate = document.status === 'DUPLICATE';
  const isError = document.status === 'ERROR';
  const isReview = document.status === 'REVIEW_NEEDED';
  const errorMessage = (document.error || document.data?.ocr_rationale || '').trim();
  const originalDoc = document.duplicateOfId
    ? allDocuments.find(d => d.id === document.duplicateOfId)
    : undefined;

  const errorNextSteps = useMemo(() => {
    if (!isError) return [] as string[];
    return getErrorNextSteps(errorMessage);
  }, [isError, errorMessage]);

  const shortcutHint = useMemo(() => {
    if (!(isError || isReview)) return '';
    return 'Shortcuts: Esc schließen · Strg+S speichern';
  }, [isError, isReview]);

  return {
    // State
    formData,
    settings,
    activeFileIndex,
    viewUrl,
    viewType,
    showMergeSearch,
    mergeQuery,

    // Refs
    fileInputRef,
    belegDatumRef,
    lieferantNameRef,
    bruttoBetragRef,

    // Handlers
    handleInputChange,
    handleCheckboxChange,
    handleLineItemChange,
    handleAddLineItem,
    handleRemoveLineItem,
    handleBlur,
    handleSaveNow,
    handleAddFileClick,
    handleFileChange,

    // UI State setters
    setActiveFileIndex,
    setShowMergeSearch,
    setMergeQuery,

    // Computed
    accounts,
    taxes,
    selectedAccount,
    availableTaxes,
    filteredMergeCandidates,
    totalPages,
    isDuplicate,
    isError,
    isReview,
    errorMessage,
    originalDoc,
    errorNextSteps,
    shortcutHint,
  };
}
