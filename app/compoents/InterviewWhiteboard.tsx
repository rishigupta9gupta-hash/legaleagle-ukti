
import React, { useRef, useState, useEffect } from 'react';
import { 
  Pencil, Eraser, Square, Circle, 
  ArrowRight, Trash2, Download, 
  Database, Cloud, Type, Undo, 
  MousePointer2, Minus
} from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'database' | 'cloud';
type Color = '#000000' | '#ef4444' | '#3b82f6' | '#22c55e' | '#a855f7' | '#f97316';

export const InterviewWhiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<Color>('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  
  // Initialize Canvas
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
    if (containerRef.current && canvasRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Safety check: Don't attempt to resize or draw if dimensions are invalid
      if (width === 0 || height === 0) return;

      const ctx = canvasRef.current.getContext('2d');
      // Create temp canvas only if the current canvas has valid dimensions
      if (ctx && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
              tempCanvas.width = canvasRef.current.width;
              tempCanvas.height = canvasRef.current.height;
              
              // Only draw if the source has content/dimensions
              tempCtx.drawImage(canvasRef.current, 0, 0);
              
              canvasRef.current.width = width;
              canvasRef.current.height = height;
              
              // Restore content
              ctx.drawImage(tempCanvas, 0, 0);
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
          }
      } else {
          // First time initialization
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          if (ctx) {
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
          }
      }
    }
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && canvas.width > 0 && canvas.height > 0) {
      setHistory(prev => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && history.length > 0) {
      const previous = history[history.length - 1];
      ctx.putImageData(previous, 0, 0);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Kept for touch support references if needed later
  };
  
  // Re-implementing draw with explicit start coordinates tracking
  const startPos = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveToHistory();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startPos.current = { x, y };
    setIsDrawing(true);
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !snapshot) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      drawShape(ctx, startPos.current.x, startPos.current.y, x, y);
      ctx.stroke();
    }
  };

  const onMouseUp = () => {
    setIsDrawing(false);
  };

  const drawShape = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const w = x2 - x1;
    const h = y2 - y1;

    switch (tool) {
      case 'rect':
        ctx.rect(x1, y1, w, h);
        break;
      case 'circle':
        ctx.ellipse(x1 + w/2, y1 + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
        break;
      case 'line':
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        break;
      case 'arrow':
        drawArrow(ctx, x1, y1, x2, y2);
        break;
      case 'database':
        drawDatabase(ctx, x1, y1, w, h);
        break;
      case 'cloud':
        drawCloud(ctx, x1, y1, w, h);
        break;
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  };

  const drawDatabase = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
     // Cylinder shape
     const ellipseHeight = h * 0.2;
     ctx.ellipse(x + w/2, y + ellipseHeight/2, Math.abs(w/2), Math.abs(ellipseHeight/2), 0, 0, 2 * Math.PI);
     ctx.moveTo(x, y + ellipseHeight/2);
     ctx.lineTo(x, y + h - ellipseHeight/2);
     ctx.ellipse(x + w/2, y + h - ellipseHeight/2, Math.abs(w/2), Math.abs(ellipseHeight/2), 0, 0, Math.PI);
     ctx.lineTo(x + w, y + ellipseHeight/2);
  };

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      // Simple cloud approximation
      ctx.moveTo(x, y + h/2);
      ctx.bezierCurveTo(x, y, x + w/2, y, x + w/2, y + h/2);
      ctx.bezierCurveTo(x + w, y, x + w, y + h, x + w/2, y + h);
      ctx.bezierCurveTo(x, y + h, x, y + h/2, x, y + h/2);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { offsetX: number, offsetY: number } => {
    // Helper not strictly needed if we use onMouseDown/Move with clientX calculation
    return { offsetX: 0, offsetY: 0 };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      saveToHistory();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'whiteboard-diagram.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'database', icon: Database, label: 'DB' },
    { id: 'cloud', icon: Cloud, label: 'Cloud' },
  ];

  const colors = [
    { id: '#000000', label: 'Black' },
    { id: '#ef4444', label: 'Red' },
    { id: '#3b82f6', label: 'Blue' },
    { id: '#22c55e', label: 'Green' },
    { id: '#a855f7', label: 'Purple' },
    { id: '#f97316', label: 'Orange' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden" ref={containerRef}>
      {/* Toolbar */}
      <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2 bg-zinc-50 dark:bg-zinc-950/50">
        
        {/* Tools */}
        <div className="flex bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as Tool)}
              className={`p-2 rounded-md transition-all ${
                tool === t.id 
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title={t.label}
            >
              <t.icon size={18} />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

        {/* Colors */}
        <div className="flex bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1.5 gap-1.5">
          {colors.map(c => (
            <button
              key={c.id}
              onClick={() => setColor(c.id as Color)}
              className={`w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 transition-transform hover:scale-110 ${
                color === c.id ? 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-zinc-900' : ''
              }`}
              style={{ backgroundColor: c.id }}
              title={c.label}
            />
          ))}
        </div>

        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
        
        {/* Actions */}
        <div className="flex gap-1">
            <button onClick={handleUndo} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" title="Undo">
                <Undo size={18} />
            </button>
            <button onClick={clearCanvas} className="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="Clear Board">
                <Trash2 size={18} />
            </button>
            <button onClick={downloadCanvas} className="p-2 text-zinc-500 hover:text-blue-500 transition-colors" title="Download Image">
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-white cursor-crosshair overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-50" 
             style={{ 
                 backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
             }} 
        />
        
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="touch-none"
        />
      </div>
    </div>
  );
};
