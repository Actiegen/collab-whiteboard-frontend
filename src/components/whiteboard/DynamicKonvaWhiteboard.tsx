'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import CanvasWhiteboard to prevent SSR issues
const CanvasWhiteboard = dynamic(
  () => import('./CanvasWhiteboard').then(mod => ({ default: mod.CanvasWhiteboard })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    ),
  }
);

export type CanvasWhiteboardProps = ComponentProps<typeof CanvasWhiteboard>;

export { CanvasWhiteboard as DynamicCanvasWhiteboard };
export default CanvasWhiteboard;
