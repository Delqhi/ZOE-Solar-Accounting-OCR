/** useDocuments Hook - Placeholder */

import { useState, useEffect } from 'react';
import { DocumentRecord } from '../types';
import { getAllDocuments } from '../services/supabaseService';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const docs = await getAllDocuments();
      setDocuments(docs);
      setLoading(false);
    };
    load();
  }, []);

  return { documents, loading, setDocuments };
}
