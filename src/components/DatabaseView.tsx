/** DatabaseView Component - Placeholder */

import React from 'react';

interface DatabaseViewProps {
  documents: any[];
  _settings: any;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ documents, _settings }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Datenbank Ansicht</h2>
      <p>{documents.length} Dokumente geladen</p>
    </div>
  );
};
