/** UploadArea Component - Placeholder for file upload UI */

import React from 'react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => Promise<void>;
  isProcessing: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, isProcessing }) => {
  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onFilesSelected(Array.from(files));
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Klicken zum Hochladen</span> oder Dateien hierher ziehen
          </p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG (Max. 50MB)</p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
      </label>
      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          Dokumente werden verarbeitet...
        </div>
      )}
    </div>
  );
};
