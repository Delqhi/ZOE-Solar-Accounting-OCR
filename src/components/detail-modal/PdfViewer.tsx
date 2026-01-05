/**
 * PDF Viewer Component
 * Displays PDF documents in the detail modal
 */

import React from 'react';

interface PdfViewerProps {
  url?: string;
  base64?: string;
  fileName?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, base64, fileName }) => {
  if (!url && !base64) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
        <p className="text-gray-500">No PDF available</p>
      </div>
    );
  }

  if (base64) {
    return (
      <div className="w-full">
        <iframe
          src={`data:application/pdf;base64,${base64}`}
          className="w-full h-96 border-0"
          title={fileName || 'PDF Viewer'}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        src={url}
        className="w-full h-96 border-0"
        title={fileName || 'PDF Viewer'}
      />
    </div>
  );
};

export default PdfViewer;
