

interface ActionsProps {
  onMergeClick: (targetDoc: any) => void;
  onExportPDF: () => void;
  showMergeSearch: boolean;
  setShowMergeSearch: (show: boolean) => void;
  mergeQuery: string;
  setMergeQuery: (query: string) => void;
  filteredMergeCandidates: any[];
}

export const DetailModalActions: React.FC<ActionsProps> = ({
  onMergeClick,
  onExportPDF,
  showMergeSearch,
  setShowMergeSearch,
  mergeQuery,
  setMergeQuery,
  filteredMergeCandidates,
}) => {
  return (
    <div className="p-3 border-t bg-white flex gap-2 flex-wrap">
      {/* Export PDF */}
      <button
        onClick={onExportPDF}
        className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
      >
        📄 PDF Export
      </button>

      {/* Merge */}
      <div className="relative">
        <button
          onClick={() => setShowMergeSearch(!showMergeSearch)}
          className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          🔗 Dokument verbinden
        </button>

        {showMergeSearch && (
          <div className="absolute bottom-full left-0 mb-2 w-96 bg-white shadow-xl rounded-lg border z-50">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Dokument suchen..."
                value={mergeQuery}
                onChange={(e) => setMergeQuery(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                autoFocus
              />
            </div>

            {filteredMergeCandidates.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {filteredMergeCandidates.map((doc: any) => (
                  <div
                    key={doc.id}
                    onClick={() => onMergeClick(doc)}
                    className="p-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 text-sm"
                  >
                    <div className="font-medium">{doc.fileName}</div>
                    <div className="text-xs text-gray-500">
                      {doc.data?.lieferantName} · {doc.data?.bruttoBetrag} €
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-500 text-center">
                {mergeQuery ? 'Keine Treffer' : 'Tippen zum Suchen'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto text-xs text-gray-400 self-center">
        Auto-Speichern aktiviert
      </div>
    </div>
  );
};
