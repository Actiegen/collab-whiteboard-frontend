'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { fileService } from '@/lib/fileService';

interface SecureFilePreviewProps {
  fileId: string;
  fileName: string;
  fileType: string;
  initialUrl?: string; // Fallback URL for backward compatibility
}

export const SecureFilePreview = ({ 
  fileId, 
  fileName, 
  fileType, 
  initialUrl 
}: SecureFilePreviewProps) => {
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load preview URL when component mounts
  useEffect(() => {
    const loadPreviewUrl = async () => {
      if (!user?.email || !fileId || fileId === 'unknown') return;

      setLoading(true);
      setError(null);

      try {
        const url = await fileService.getPreviewUrl(fileId, user.email);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Error loading preview URL:', err);
        setError('Failed to load preview');
        // Keep initial URL as fallback
      } finally {
        setLoading(false);
      }
    };

    // Only load secure URL if we have a valid fileId
    if (fileId && fileId !== 'unknown') {
      loadPreviewUrl();
    } else if (initialUrl) {
      // Use initial URL for legacy messages
      setPreviewUrl(initialUrl);
    }
  }, [fileId, user?.email, initialUrl]);

  const handleDownload = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      
      // If we have a valid file ID, use the secure API endpoint
      if (fileId && fileId !== 'unknown') {
        const url = await fileService.getDownloadUrl(fileId, user.email);
        setDownloadUrl(url);
        window.open(url, '_blank');
      } 
      // Fall back to initial URL for legacy messages without file IDs
      else if (initialUrl) {
        console.log('Using fallback URL for download:', initialUrl);
        window.open(initialUrl, '_blank');
      } 
      else {
        setError('No download method available');
      }
    } catch (err) {
      console.error('Error getting download URL:', err);
      // If secure download fails and we have a fallback URL, use it
      if (initialUrl) {
        console.log('Secure download failed, falling back to initial URL');
        window.open(initialUrl, '_blank');
      } else {
        setError('Failed to generate download link');
      }
    } finally {
      setLoading(false);
    }
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
              {error && (
                <p className="text-xs text-red-500 mt-1">
                  {error}
                </p>
              )}
            </div>
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={loading}
              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={fileId === 'unknown' ? 'Legacy file - using direct URL' : 'Secure download'}
            >
              {loading ? 'Loading...' : 'Download'}
            </button>
          </div>
          
          {/* Preview */}
          {isImage && previewUrl && !loading && (
            <div className="mt-2">
              <Image 
                src={previewUrl} 
                alt={fileName}
                width={200}
                height={128}
                className="max-w-full max-h-32 rounded border object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', previewUrl);
                  setError('Preview unavailable');
                  e.currentTarget.style.display = 'none';
                }}
                unoptimized={true}
              />
            </div>
          )}
          
          {isPdf && previewUrl && !loading && (
            <div className="mt-2">
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-32 border rounded"
                title={fileName}
                onError={() => {
                  setError('PDF preview unavailable');
                }}
              />
            </div>
          )}
          
          {isText && previewUrl && !loading && (
            <div className="mt-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View text content
              </a>
            </div>
          )}

          {loading && !previewUrl && (
            <div className="mt-2 text-xs text-gray-500">
              Loading preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
