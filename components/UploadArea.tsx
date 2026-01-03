import React, { useCallback, useState } from 'react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragging(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray: File[] = Array.from(e.dataTransfer.files);
      const validFiles = filesArray.filter(f =>
        ['image/png', 'image/jpeg', 'application/pdf', 'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'image/gif'].includes(f.type)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [onFilesSelected, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
        <div
        className={`
          border border-dashed rounded-lg p-8 text-center transition-all duration-200 relative
          ${isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        >
        {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-5 h-5 border border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Analysiere Belege...</span>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-2">

                {/* File Upload Section */}
                <div className="w-full">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="image/png,image/jpeg,application/pdf,image/webp,image/heic,image/heif,image/bmp,image/gif"
                        multiple
                        onChange={handleChange}
                        disabled={isProcessing}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full group">
                        <div className={`
                            text-gray-900 p-3 rounded-full mb-3 transition-all
                            ${isDragging ? 'bg-gray-200' : 'bg-gray-50 group-hover:bg-gray-100'}
                        `}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Datei auswaehlen</span>
                        <span className="text-xs text-gray-500 mt-1">PNG, JPG, PDF oder Drag & Drop</span>
                    </label>
                </div>

                <div className="w-full flex items-center gap-4">
                     <div className="h-px bg-gray-200 flex-1"></div>
                     <span className="text-xs text-gray-400 uppercase font-medium">oder</span>
                     <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {/* Camera Capture Section */}
                <div className="w-full">
                    <input
                        type="file"
                        id="camera-upload"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleChange}
                        disabled={isProcessing}
                    />
                    <label htmlFor="camera-upload" className="cursor-pointer flex flex-col items-center justify-center w-full group">
                         <div className={`
                            text-gray-900 p-2.5 rounded-full mb-2 transition-all
                            ${isDragging ? 'bg-gray-200' : 'bg-gray-50 group-hover:bg-gray-100'}
                         `}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                         </div>
                         <span className="text-xs font-medium text-gray-700">Foto aufnehmen</span>
                    </label>
                </div>

            </div>
        )}
        </div>
    </div>
  );
};
