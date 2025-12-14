import React, { useCallback } from 'react';

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelected, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  }, [onFileSelected, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all duration-200 group ${
        isProcessing 
          ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed' 
          : 'border-blue-200 bg-white hover:bg-blue-50/50 hover:border-blue-400 shadow-sm hover:shadow-md cursor-pointer'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleChange}
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-5">
        <div className={`p-5 rounded-full transition-transform duration-300 group-hover:scale-110 ${isProcessing ? 'bg-slate-200' : 'bg-blue-100 text-blue-600'}`}>
          {isProcessing ? (
             <svg className="animate-spin h-8 w-8 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          )}
        </div>
        <div>
          <p className="text-xl font-semibold text-slate-700 mb-1">
             {isProcessing ? 'Beleg wird analysiert...' : 'Beleg hier ablegen'}
          </p>
          <p className="text-sm text-slate-400">
             {isProcessing ? 'KI extrahiert Daten & Konten' : 'oder klicken zum Auswählen (PDF, JPG, PNG)'}
          </p>
        </div>
      </label>
    </div>
  );
};