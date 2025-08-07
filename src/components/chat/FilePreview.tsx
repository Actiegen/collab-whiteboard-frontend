'use client';

import Image from 'next/image';
import { useState } from 'react';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export function FilePreview({ fileUrl, fileName, fileType }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  console.log('FilePreview component called with:', { fileUrl, fileName, fileType });
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('word') || type.includes('document')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📎';
  };

  const isImage = fileType.startsWith('image/');
  const isPdf = fileType.includes('pdf');
  const isText = fileType.includes('text');

  const handleImageError = () => {
    console.error('Image failed to load:', fileUrl);
    setImageError(true);
  };

  const handlePdfError = () => {
    console.error('PDF failed to load:', fileUrl);
    setPdfError(true);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="text-2xl flex-shrink-0">
          {getFileIcon(fileType)}
        </div>
        
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">
                {fileType}
              </p>
            </div>
            
            {/* Download Button */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </a>
          </div>
          
          {/* Preview */}
          {isImage && !imageError && (
            <div className="mt-2">
              <div className="relative">
                <Image 
                  src={fileUrl} 
                  alt={fileName}
                  width={200}
                  height={128}
                  className="max-w-full max-h-32 rounded border object-cover"
                  onError={handleImageError}
                  onLoad={() => {
                    console.log('Image loaded successfully:', fileUrl);
                  }}
                />
                <div className="absolute inset-0 bg-gray-200 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-600">Click to view full size</span>
                </div>
              </div>
            </div>
          )}
          
          {isImage && imageError && (
            <div className="mt-2">
              <div className="bg-gray-100 rounded border p-2 text-center">
                <p className="text-xs text-gray-500">Image preview failed to load</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View image in new tab
                </a>
              </div>
            </div>
          )}
          
          {isPdf && !pdfError && (
            <div className="mt-2">
              <div className="border rounded overflow-hidden">
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-32"
                  title={fileName}
                  onError={handlePdfError}
                />
              </div>
            </div>
          )}
          
          {isPdf && pdfError && (
            <div className="mt-2">
              <div className="bg-gray-100 rounded border p-2 text-center">
                <p className="text-xs text-gray-500">PDF preview failed to load</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View PDF in new tab
                </a>
              </div>
            </div>
          )}
          
          {isText && (
            <div className="mt-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View text content
              </a>
            </div>
          )}
          
          {/* Fallback for unsupported file types */}
          {!isImage && !isPdf && !isText && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Preview not available for this file type
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
