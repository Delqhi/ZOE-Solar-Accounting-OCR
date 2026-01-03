
import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Robustly resolve PDF.js library instance from ESM import
const getPdfLib = () => {
    const lib = pdfjsLib as any;
    if (lib.default && lib.default.GlobalWorkerOptions) {
        return lib.default;
    }
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
  const [pdfDoc, setPdfDoc] = useState<any>(null);
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
      setCurrentPage(1);

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
          pdfDoc.getPage(currentPage).then((page: any) => {
              const canvas = canvasRef.current!;
              const context = canvas.getContext('2d');
              if (!context) return;

              const viewport = page.getViewport({ scale: 2.0 });

              canvas.width = viewport.width;
              canvas.height = viewport.height;

              context.clearRect(0, 0, canvas.width, canvas.height);

              const renderContext = {
                  canvasContext: context,
                  viewport: viewport
              };
              page.render(renderContext);
          });
      }
  }, [pdfDoc, isImage, currentPage]);

  // Wheel Support
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

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomTo = (newScale: number) => setScale(Math.min(Math.max(newScale, 0.5), 5));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handlePrevPage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentPage(prev => Math.min(numPages, prev + 1));
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const page = parseInt(e.target.value, 10);
      if (page >= 1 && page <= numPages) {
          setCurrentPage(page);
      }
  };

  // Unified Pan Logic
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

        {/* Top Toolbar - Always Visible */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
            {/* Zoom Controls */}
            <div className="bg-black/70 backdrop-blur-md rounded-lg p-1.5 flex items-center gap-1 shadow-lg border border-white/10 pointer-events-auto">
                <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded transition-colors" title="Zoom Out">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </button>

                <div className="px-2 py-1 text-white text-xs font-mono font-bold min-w-[60px] text-center bg-white/10 rounded">
                    {Math.round(scale * 100)}%
                </div>

                <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded transition-colors" title="Zoom In">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </button>

                <div className="w-px h-6 bg-white/20 mx-1"></div>

                <button onClick={() => handleZoomTo(0.5)} className="p-1.5 text-white hover:bg-white/20 rounded text-xs transition-colors" title="50%">50%</button>
                <button onClick={() => handleZoomTo(1)} className="p-1.5 text-white hover:bg-white/20 rounded text-xs transition-colors" title="100%">100%</button>
                <button onClick={() => handleZoomTo(2)} className="p-1.5 text-white hover:bg-white/20 rounded text-xs transition-colors" title="200%">200%</button>

                <div className="w-px h-6 bg-white/20 mx-1"></div>

                <button onClick={handleReset} className="p-2 text-white hover:bg-white/20 rounded transition-colors" title="Reset">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                    </svg>
                </button>
            </div>

            {/* Add Page Button */}
            {onAddPage && (
                <button
                    onClick={onAddPage}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg shadow-lg flex items-center justify-center transition-colors pointer-events-auto"
                    title="Seite/Datei hinzufügen"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
            )}
        </div>

        {/* Pagination - Always Visible for Multi-page */}
        {!isImage && numPages > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 text-white shadow-xl border border-white/10">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                        className="p-1 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-white transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>

                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={currentPage}
                            onChange={handlePageInput}
                            className="w-10 bg-transparent text-center text-sm font-mono font-bold outline-none border-b border-white/30 focus:border-blue-400"
                            min={1}
                            max={numPages}
                        />
                        <span className="text-xs text-white/60">/ {numPages}</span>
                    </div>

                    <button
                        onClick={handleNextPage}
                        disabled={currentPage >= numPages}
                        className="p-1 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-white transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
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
                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-white">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Lade PDF...</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center gap-2 text-red-400 px-4 text-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
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

        {/* Open External Link */}
        <div className="absolute bottom-4 right-4 z-20">
             <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-colors flex items-center gap-2"
             >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Öffnen
            </a>
        </div>
    </div>
  );
};
