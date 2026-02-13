
import { DocumentRecord, Attachment } from '../../types';
import { PdfViewer } from './PdfViewer';

interface DocumentViewProps {
  viewUrl: string | null;
  viewType: string;
  document: DocumentRecord;
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  onAddFileClick: () => void;
}

export const DocumentView: React.FC<DocumentViewProps> = ({
  viewUrl,
  viewType,
  document,
  activeFileIndex,
  setActiveFileIndex,
  onAddFileClick,
}) => {
  const totalPages = 1 + (document.attachments?.length || 0);

  return (
    <div className="flex flex-col h-full">
      {/* File Navigation */}
      {totalPages > 1 && (
        <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
          <button
            onClick={() => setActiveFileIndex(0)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeFileIndex === 0
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Hauptseite
          </button>

          {document.attachments?.map((att: Attachment, idx: number) => (
            <button
              key={att.id}
              onClick={() => setActiveFileIndex(idx + 1)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                activeFileIndex === idx + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {att.name || `Anhang ${idx + 1}`}
            </button>
          ))}

          <button
            onClick={onAddFileClick}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            + Datei hinzufügen
          </button>
        </div>
      )}

      {/* Viewer */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto">
        {viewUrl ? (
          viewType === 'application/pdf' ? (
            <PdfViewer url={viewUrl} />
          ) : (
            <img
              src={viewUrl}
              alt="Document preview"
              className="max-w-full max-h-full object-contain shadow-lg"
            />
          )
        ) : (
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Keine Vorschau verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
};
