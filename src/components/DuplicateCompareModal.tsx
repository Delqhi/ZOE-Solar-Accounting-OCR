/** DuplicateCompareModal Component - Placeholder */

import React from 'react';
import { DocumentRecord } from '../types';

interface DuplicateCompareModalProps {
  original: DocumentRecord;
  duplicate: DocumentRecord;
  allDocuments: DocumentRecord[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (doc: DocumentRecord) => Promise<void>;
  onMerge: (sourceId: string, targetId: string) => Promise<void>;
  onSelectDocument: (doc: DocumentRecord) => void;
  onIgnoreDuplicate: (id: string) => Promise<void>;
}

export const DuplicateCompareModal: React.FC<DuplicateCompareModalProps> = ({
  original,
  duplicate,
  onClose,
  onIgnoreDuplicate
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Duplikat Vergleich</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold mb-2">Original</h3>
            <p>{original.fileName}</p>
            <p>{original.data?.lieferantName}</p>
            <p>{original.data?.bruttoBetrag} EUR</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-bold mb-2">Duplikat</h3>
            <p>{duplicate.fileName}</p>
            <p>{duplicate.data?.lieferantName}</p>
            <p>{duplicate.data?.bruttoBetrag} EUR</p>
            <p className="text-sm text-red-600 mt-2">{duplicate.duplicateReason}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Schließen</button>
          <button onClick={() => onIgnoreDuplicate(duplicate.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Als nicht Duplikat markieren
          </button>
        </div>
      </div>
    </div>
  );
};
