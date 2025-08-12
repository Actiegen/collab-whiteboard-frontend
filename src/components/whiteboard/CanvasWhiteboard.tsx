'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CanvasWhiteboardProps {
  roomId: string;
  currentUser: { email?: string; name?: string } | null;
  isConnected: boolean;
}

interface Stroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  brush_size: number;
  user_id: string;
  username: string;
  timestamp: string;
}

interface DrawingTool {
  type: 'pen' | 'eraser';
  color: string;
  size: number;
}

export function CanvasWhiteboard({ roomId, currentUser, isConnected }: CanvasWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    size: 2
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // WebSocket setup
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Ensure component only runs on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isMounted || !isConnected || !roomId) return;

    // WebSocket URL for collaboration
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace('wss://', 'ws://').replace('https://', 'ws://');
    const websocket = new WebSocket(`${wsUrl}/yjs/${roomId}`);

    websocket.onopen = () => {
      console.log('Whiteboard collaboration WebSocket connected');
      setWs(websocket);
      
      // Request current state
      websocket.send(JSON.stringify({ type: 'request_state' }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'document_state') {
          // Received current document state
          const state = data.state;
          setStrokes(state.strokes || []);
        } else if (data.type === 'stroke_added') {
          // Received new stroke from another user
          const stroke = data.stroke;
          setStrokes(prev => [...prev, stroke]);
        } else if (data.type === 'canvas_cleared') {
          // Canvas was cleared by another user
          setStrokes([]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('Whiteboard collaboration WebSocket disconnected');
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error('Whiteboard collaboration WebSocket error:', error);
    };

    return () => {
      websocket.close();
    };
  }, [roomId, isConnected, isMounted]);

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        // Calculate available space more accurately
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Account for sidebar, padding, and chat panel
        // Sidebar: ~64px, Padding: ~32px, Chat panel: ~350px on xl screens
        const availableWidth = viewportWidth >= 1280 
          ? Math.max(600, viewportWidth - 500) // xl screens: account for chat panel
          : Math.max(400, viewportWidth - 100); // smaller screens: just padding
        
        // Account for header, toolbar, and padding
        const availableHeight = Math.max(400, viewportHeight - 250);
        
        setCanvasSize({
          width: availableWidth,
          height: availableHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Redraw canvas when strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brush_size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.color === '#ffffff') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current stroke
    if (isDrawing && currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = tool.type === 'eraser' ? '#ffffff' : tool.color;
      ctx.lineWidth = tool.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, isDrawing, tool]);

  // Drawing handlers
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isConnected) return;

    e.preventDefault();
    setIsDrawing(true);
    const pos = getMousePos(e);
    setCurrentStroke([pos]);
  }, [isConnected, getMousePos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    e.preventDefault();
    const pos = getMousePos(e);
    setCurrentStroke(prev => [...prev, pos]);
  }, [isDrawing, getMousePos]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !ws || !currentUser) return;

    setIsDrawing(false);

    if (currentStroke.length > 0) {
      const strokeId = `${Date.now()}-${Math.random()}`;
      const newStroke: Stroke = {
        id: strokeId,
        points: currentStroke,
        color: tool.type === 'eraser' ? '#ffffff' : tool.color,
        brush_size: tool.size,
        user_id: currentUser.email || 'anonymous',
        username: currentUser.name || 'Anonymous',
        timestamp: new Date().toISOString()
      };

      // Add stroke locally
      setStrokes(prev => [...prev, newStroke]);

      // Send to other clients via WebSocket
      ws.send(JSON.stringify({
        type: 'stroke_added',
        stroke: newStroke
      }));
    }

    setCurrentStroke([]);
  }, [isDrawing, currentStroke, tool, ws, currentUser]);

  // Compatibility handlers for mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isConnected) return;

    e.preventDefault();
    setIsDrawing(true);
    const pos = getMousePos(e);
    setCurrentStroke([pos]);
  }, [isConnected, getMousePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    e.preventDefault();
    const pos = getMousePos(e);
    setCurrentStroke(prev => [...prev, pos]);
  }, [isDrawing, getMousePos]);

  const handleMouseUp = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Clear canvas function
  const clearCanvas = useCallback(() => {
    if (!ws || !currentUser) return;

    // Clear strokes locally
    setStrokes([]);

    // Send clear message to other clients
    ws.send(JSON.stringify({
      type: 'canvas_cleared',
      user: {
        id: currentUser.email || 'anonymous',
        name: currentUser.name || 'Anonymous'
      }
    }));
  }, [ws, currentUser]);

  // Color options
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#008000', '#800000', '#000080'
  ];

  // Brush sizes
  const sizes = [1, 2, 4, 8, 12, 16];

  if (!isMounted) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg text-center">
          <p className="text-gray-600">Connect to start drawing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-4 flex-wrap gap-2">
        {/* Drawing Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool(prev => ({ ...prev, type: 'pen' }))}
            className={`px-3 py-2 rounded ${
              tool.type === 'pen' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setTool(prev => ({ ...prev, type: 'eraser' }))}
            className={`px-3 py-2 rounded ${
              tool.type === 'eraser' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🗑️ Eraser
          </button>
        </div>

        {/* Color Picker */}
        {tool.type === 'pen' && (
          <div className="flex items-center space-x-1 flex-wrap">
            <span className="text-sm text-gray-600 whitespace-nowrap">Color:</span>
            <div className="flex flex-wrap gap-1">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setTool(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 rounded border-2 flex-shrink-0 ${
                    tool.color === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Brush Size */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Size:</span>
          <select
            value={tool.size}
            onChange={(e) => setTool(prev => ({ ...prev, size: parseInt(e.target.value) }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
          >
            {sizes.map(size => (
              <option key={size} value={size} className="text-gray-900">{size}px</option>
            ))}
          </select>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm whitespace-nowrap"
        >
          Clear Canvas
        </button>

        {/* Active Users Counter */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>👥 Drawing together</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white overflow-hidden flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            touchAction: 'none' // Prevent scrolling on touch devices
          }}
          className="border border-gray-200 cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
