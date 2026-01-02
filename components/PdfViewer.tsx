
import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Robustly resolve PDF.js library instance from ESM import
const getPdfLib = () => {
    const lib = pdfjsLib as any;
    // Check if default export exists and has GlobalWorkerOptions
    if (lib.default && lib.default.GlobalWorkerOptions) {
        return lib.default;
    }
    // Otherwise return the lib itself (if named exports are used)
    return lib;
};

const pdf = getPdfLib();

// Initialize PDF Worker safely
if (pdf && pdf.GlobalWorkerOptions) {
    try {
        pdf.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    } catch (e) {
        console.warn("PDF Worker setup warning:", e);
    }
}

interface PdfViewerProps {
  url: string;
  type?: string;
  onAddPage?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, type, onAddPage }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null); // Type 'any' used for flexibility with PDF.js proxy
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isImage = type?.startsWith('image/') || url.match(/^data:image/) || url.match(/\.(jpeg|jpg|png|webp|heic)$/i);

  // Reset and Load
  useEffect(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setError(null);
      setCurrentPage(1); // Reset page on new URL

      if (!isImage && url) {
          setLoading(true);
          
          if (!pdf || !pdf.getDocument) {
              setError("PDF Library Error");
              return;
          }

          const loadingTask = pdf.getDocument(url);
          loadingTask.promise.then((doc: any) => {
              setPdfDoc(doc);
              setNumPages(doc.numPages);
              setLoading(false);
          }).catch((err: any) => {
              console.error("PDF Load Error", err);
              setError("PDF konnte nicht geladen werden.");
              setLoading(false);
          });
      }
  }, [url, isImage]);

  // Render PDF Page onto Canvas
  useEffect(() => {
      if (!isImage && pdfDoc && canvasRef.current) {
          // Fetch the SPECIFIC current page, not just page 1
          pdfDoc.getPage(currentPage).then((page: any) => {
              const canvas = canvasRef.current!;
              const context = canvas.getContext('2d');
              if (!context) return;

              // Render at high resolution (scale 2) for sharp zoom
              const viewport = page.getViewport({ scale: 2.0 });

              canvas.width = viewport.width;
              canvas.height = viewport.height;

              // Clear previous render
              context.clearRect(0, 0, canvas.width, canvas.height);

              const renderContext = {
                  canvasContext: context,
                  viewport: viewport
              };
              page.render(renderContext).catch((err: any) => {
                console.error('PDF render error:', err);
              });
          }).catch((err: any) => {
            console.error('Failed to load PDF page:', err);
            setError('Seite konnte nicht geladen werden.');
          });
      }
  }, [pdfDoc, isImage, currentPage]); // Re-render when currentPage changes

  // Trackpad / Wheel Support Logic
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        if (e.ctrlKey) {
            const zoomSensitivity = 0.01;
            const delta = -e.deltaY * zoomSensitivity;
            
            setScale(prevScale => {
                const newScale = prevScale + delta;
                return Math.min(Math.max(newScale, 0.5), 5);
            });
        } 
        else {
            setPosition(prevPos => ({
                x: prevPos.x - e.deltaX,
                y: prevPos.y - e.deltaY
            }));
        }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
        el.removeEventListener('wheel', handleWheel);
    };
  }, []);
  
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handlePrevPage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPage(prev => Math.min(numPages, prev + 1));
  };

  // Unified Pan Logic (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="w-full h-full relative group bg-slate-900 overflow-hidden flex flex-col rounded-lg border border-slate-700">
        
        {/* Top Right: Zoom & Add Toolbar */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="bg-black/60 backdrop-blur-md rounded-lg p-1 flex flex-col gap-1 shadow-lg border border-white/10">
                <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded" title="Zoom In">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded" title="Zoom Out">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <button onClick={handleReset} className="p-2 text-white hover:bg-white/20 rounded" title="Reset">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
             </div>

             {onAddPage && (
                 <button 
                    onClick={onAddPage}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg shadow-lg flex items-center justify-center transition-colors"
                    title="Seite/Datei hinzufügen"
                 >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                 </button>
             )}
        </div>

        {/* Bottom Center: Pagination Control (Only for PDFs with > 1 page) */}
        {!isImage && numPages > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 text-white shadow-xl border border-white/10">
                    <button 
                        onClick={handlePrevPage} 
                        disabled={currentPage <= 1}
                        className="p-1 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-white transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    
                    <span className="text-xs font-mono font-bold whitespace-nowrap">
                        {currentPage} / {numPages}
                    </span>

                    <button 
                        onClick={handleNextPage} 
                        disabled={currentPage >= numPages}
                        className="p-1 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-white transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
            </div>
        )}

        {/* Content Area */}
        <div 
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center overflow-hidden bg-slate-800 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {isImage ? (
                <img 
                    src={url} 
                    alt="Beleg Vorschau" 
                    className="max-w-full max-h-full object-contain transition-transform duration-75 origin-center will-change-transform"
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` 
                    }}
                    draggable={false}
                />
            ) : (
                <>
                    {loading && <div className="text-white">Lade PDF...</div>}
                    {error && <div className="text-red-400 text-xs px-4 text-center">{error}</div>}
                    <canvas 
                        ref={canvasRef}
                        className={`max-w-full max-h-full object-contain transition-transform duration-75 origin-center will-change-transform ${loading || error ? 'hidden' : ''}`}
                        style={{ 
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` 
                        }}
                    />
                </>
            )}
        </div>
        
        {/* Open External Link (Bottom Right) */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <a 
                href={url} 
                target="_blank" 
                rel="noreferrer" 
                className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-colors flex items-center gap-2"
             >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                In neuem Tab
            </a>
        </div>
    </div>
  );
};
