'use client';

import { Tldraw } from '@tldraw/tldraw';
import { useSyncDemo } from '@tldraw/sync';
import '@tldraw/tldraw/tldraw.css';

interface TldrawCanvasProps {
  roomId: string;
  currentUser: { email?: string; name?: string } | null;
  isConnected: boolean;
}

export function TldrawCanvas({ roomId, isConnected }: TldrawCanvasProps) {
  // Use tldraw's built-in sync with our room ID
  const store = useSyncDemo({ 
    roomId: `collab-whiteboard-${roomId}`
  });

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
    <div className="h-full">
      <Tldraw 
        store={store}
      />
    </div>
  );
}
