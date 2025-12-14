import React, { useCallback } from 'react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
        className={`border-2 border-dashed rounded-md p-8 text-center transition-colors relative ${
            isProcessing 
            ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' 
            : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        >
        {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-sm text-slate-500 font-medium">Analysiere Belege...</span>
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
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Datei auswählen</span>
                        <span className="text-xs text-slate-500 mt-1">PNG, JPG, PDF oder Drag & Drop</span>
                    </label>
                </div>

                <div className="w-full flex items-center gap-4">
                     <div className="h-px bg-slate-200 flex-1"></div>
                     <span className="text-xs text-slate-400 uppercase font-medium">oder</span>
                     <div className="h-px bg-slate-200 flex-1"></div>
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
                         <div className="bg-slate-100 text-slate-600 p-2 rounded-full mb-2 group-hover:bg-slate-200 transition-colors">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                         </div>
                         <span className="text-xs font-semibold text-slate-600">Foto aufnehmen</span>
                    </label>
                </div>

            </div>
        )}
        </div>
    </div>
  );
};