import React from 'react';
import { DocumentRecord } from '../../types';

interface HeaderProps {
  document: DocumentRecord;
  onClose: () => void;
  onSave: () => Promise<void>;
  onDelete: () => void;
  onRetryOCR: () => Promise<void>;
}

export const DetailModalHeader: React.FC<HeaderProps> = ({
  document,
  onClose,
  onSave,
  onDelete,
  onRetryOCR,
}) => {
  const statusColors = {
    COMPLETED: 'bg-green-100 text-green-700',
    REVIEW_NEEDED: 'bg-yellow-100 text-yellow-700',
    DUPLICATE: 'bg-purple-100 text-purple-700',
    ERROR: 'bg-red-100 text-red-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    PRIVATE: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px] md:max-w-[400px]">
          {document.fileName}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          statusColors[document.status] || 'bg-gray-100 text-gray-700'
        }`}>
          {document.status}
        </span>
        {document.zoeId && (
          <span className="text-xs text-gray-500 font-mono">{document.zoeId}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {document.status === 'ERROR' && (
          <button
            onClick={onRetryOCR}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            OCR neu starten
          </button>
        )}

        <button
          onClick={onSave}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Speichern
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Löschen
        </button>

        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
