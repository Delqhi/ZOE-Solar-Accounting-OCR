import React from 'react';

interface ValidationViewProps {
  isDuplicate: boolean;
  isError: boolean;
  isReview: boolean;
  errorMessage: string;
  errorNextSteps: string[];
  shortcutHint: string;
  originalDoc?: any;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  isDuplicate,
  isError,
  isReview,
  errorMessage,
  errorNextSteps,
  shortcutHint,
  originalDoc,
}) => {
  if (!isDuplicate && !isError && !isReview) {
    return null;
  }

  return (
    <div className="p-4 space-y-3">
      {/* Duplicate Warning */}
      {isDuplicate && originalDoc && (
        <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
          <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
            <span>⚠️</span> Duplikat erkannt
          </h3>
          <p className="text-sm text-purple-800 mb-2">
            Dieser Beleg ist möglicherweise ein Duplikat von:
          </p>
          <div className="text-xs bg-white p-2 rounded border border-purple-200">
            <div className="font-semibold">{originalDoc.fileName}</div>
            <div className="text-purple-600">{originalDoc.zoeId}</div>
            <div>Brutto: {originalDoc.data?.bruttoBetrag} €</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {isError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3">
          <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
            <span>❌</span> OCR-Fehler
          </h3>

          <div className="bg-white rounded p-2 mb-2 border border-red-200 text-sm font-mono">
            {errorMessage || 'Unbekannter Fehler bei der Texterkennung.'}
          </div>

          {errorNextSteps.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold text-red-900 mb-1">Nächste Schritte:</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                {errorNextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Review Required */}
      {isReview && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
            <span>🔍</span> Manuelle Prüfung erforderlich
          </h3>
          <p className="text-sm text-yellow-800">
            Einige Felder wurden als unsicher markiert oder fehlen.
            Bitte überprüfen Sie die Daten manuell.
          </p>
        </div>
      )}

      {/* Shortcut Hint */}
      {shortcutHint && (
        <div className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-600 text-center">
          {shortcutHint}
        </div>
      )}
    </div>
  );
};
