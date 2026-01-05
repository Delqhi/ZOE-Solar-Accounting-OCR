/**
 * useOptimisticDocuments Hook - React 19 Best Practice
 *
 * Optimistic UI Updates für schnelle User Experience
 * Nutzt React 19 useOptimistic Hook für sofortige UI-Updates
 */

import { useState, useOptimistic, useTransition } from 'react';
import { DocumentRecord, DocumentStatus } from '../types';
import * as storageService from '../services/storageService';
import * as supabaseService from '../services/supabaseService';

interface OptimisticAction {
  type: 'ADD' | 'UPDATE' | 'DELETE' | 'MERGE';
  payload: any;
}

export function useOptimisticDocuments(initialDocuments: DocumentRecord[]) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [isPending, startTransition] = useTransition();

  // useOptimistic Hook - React 19 Feature
  const [optimisticDocuments, addOptimistic] = useOptimistic(
    documents,
    (state: DocumentRecord[], action: OptimisticAction) => {
      switch (action.type) {
        case 'ADD':
          return [action.payload, ...state];

        case 'UPDATE':
          return state.map(doc =>
            doc.id === action.payload.id ? { ...doc, ...action.payload } : doc
          );

        case 'DELETE':
          return state.filter(doc => doc.id !== action.payload.id);

        case 'MERGE':
          const { sourceId, targetDoc } = action.payload;
          return state
            .filter(doc => doc.id !== sourceId)
            .map(doc => doc.id === targetDoc.id ? targetDoc : doc);

        default:
          return state;
      }
    }
  );

  // Optimistic Add Document
  const addDocumentOptimistic = async (newDoc: DocumentRecord) => {
    // 1. Immediately update UI
    addOptimistic({ type: 'ADD', payload: newDoc });

    // 2. Async save to storage
    startTransition(async () => {
      try {
        await storageService.saveDocument(newDoc);
        if (supabaseService.isSupabaseConfigured()) {
          await supabaseService.saveDocument(newDoc);
        }
        // Commit the optimistic update
        setDocuments(prev => [newDoc, ...prev]);
      } catch (error) {
        console.error('Failed to save document:', error);
        // Rollback happens automatically if we don't call setDocuments
        // But we can force a refresh from storage
        const freshDocs = await storageService.getAllDocuments();
        setDocuments(freshDocs);
      }
    });
  };

  // Optimistic Update Document
  const updateDocumentOptimistic = async (updatedDoc: DocumentRecord) => {
    // 1. Immediately update UI
    addOptimistic({ type: 'UPDATE', payload: updatedDoc });

    // 2. Async save
    startTransition(async () => {
      try {
        await storageService.saveDocument(updatedDoc);
        if (supabaseService.isSupabaseConfigured()) {
          await supabaseService.saveDocument(updatedDoc);
        }
        // Commit
        setDocuments(prev =>
          prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
        );
      } catch (error) {
        console.error('Failed to update document:', error);
        const freshDocs = await storageService.getAllDocuments();
        setDocuments(freshDocs);
      }
    });
  };

  // Optimistic Delete Document
  const deleteDocumentOptimistic = async (id: string) => {
    // 1. Immediately remove from UI
    addOptimistic({ type: 'DELETE', payload: { id } });

    // 2. Async delete
    startTransition(async () => {
      try {
        await storageService.deleteDocument(id);
        if (supabaseService.isSupabaseConfigured()) {
          await supabaseService.deleteDocument(id);
        }
        // Commit
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (error) {
        console.error('Failed to delete document:', error);
        const freshDocs = await storageService.getAllDocuments();
        setDocuments(freshDocs);
      }
    });
  };

  // Optimistic Merge Documents
  const mergeDocumentsOptimistic = async (sourceId: string, targetDoc: DocumentRecord) => {
    // 1. Immediately update UI
    addOptimistic({
      type: 'MERGE',
      payload: { sourceId, targetDoc }
    });

    // 2. Async merge
    startTransition(async () => {
      try {
        await storageService.saveDocument(targetDoc);
        await storageService.deleteDocument(sourceId);

        if (supabaseService.isSupabaseConfigured()) {
          await supabaseService.saveDocument(targetDoc);
          await supabaseService.deleteDocument(sourceId);
        }

        // Commit
        setDocuments(prev =>
          prev
            .filter(doc => doc.id !== sourceId)
            .map(doc => doc.id === targetDoc.id ? targetDoc : doc)
        );
      } catch (error) {
        console.error('Failed to merge documents:', error);
        const freshDocs = await storageService.getAllDocuments();
        setDocuments(freshDocs);
      }
    });
  };

  return {
    documents: optimisticDocuments,
    isPending,
    addDocument: addDocumentOptimistic,
    updateDocument: updateDocumentOptimistic,
    deleteDocument: deleteDocumentOptimistic,
    mergeDocuments: mergeDocumentsOptimistic,
    setDocuments, // Direct setter for non-optimistic updates
  };
}
