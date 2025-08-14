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
  const [refreshedDownloadUrl, setRefreshedDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

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
      // Fall back to refreshed download URL for legacy files, or initial URL
      else if (refreshedDownloadUrl) {
        console.log('Using refreshed download URL for legacy file:', refreshedDownloadUrl);
        window.open(refreshedDownloadUrl, '_blank');
      }
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
      if (refreshedDownloadUrl) {
        console.log('Secure download failed, using refreshed download URL');
        window.open(refreshedDownloadUrl, '_blank');
      } else if (initialUrl) {
        console.log('Secure download failed, falling back to initial URL');
        window.open(initialUrl, '_blank');
      } else {
        setError('Failed to generate download link');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);
      
      if (fileId && fileId !== 'unknown') {
        // Regular refresh for files with proper fileId
        console.log(`Manually refreshing URLs for file ${fileId}`);
        const refreshed = await fileService.refreshFileUrls(fileId, user.email);
        setPreviewUrl(refreshed.preview);
        setLastRefresh(Date.now());
        setImageLoadError(false);
      } else if (initialUrl) {
        // Legacy file refresh - extract filename from URL and generate new signed URL
        console.log(`Attempting to refresh legacy file URL: ${initialUrl}`);
        const refreshResult = await refreshLegacyFile(initialUrl, user.email);
        if (refreshResult) {
          setPreviewUrl(refreshResult.preview_url);
          setRefreshedDownloadUrl(refreshResult.download_url);
          setLastRefresh(Date.now());
          setImageLoadError(false);
        } else {
          setError('Failed to refresh legacy file URL');
        }
      }
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setError('Failed to refresh file URLs');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh legacy files by extracting the filename and generating new signed URL
  const refreshLegacyFile = async (url: string, userEmail: string): Promise<{preview_url: string, download_url: string} | null> => {
    try {
      // Extract filename from the URL path
      // Format: https://storage.googleapis.com/bucket-name/filename.ext
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filename = pathParts[pathParts.length - 1]; // Get the last part as filename
      
      if (!filename) {
        console.error('Could not extract filename from URL:', url);
        return null;
      }

      console.log(`Extracted filename: ${filename} from legacy URL`);
      
      // Call backend to generate new signed URL for the legacy file
      const response = await fetch(`/api/files/legacy/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          user_email: userEmail,
          file_type: fileType
        }),
      });

      if (!response.ok) {
        console.error('Failed to refresh legacy file URL, status:', response.status);
        return null;
      }

      const data = await response.json();
      console.log(`Successfully refreshed legacy file URL for ${filename}`);
      return {
        preview_url: data.preview_url,
        download_url: data.download_url
      };
    } catch (error) {
      console.error('Error refreshing legacy file:', error);
      return null;
    }
  };

  // Handle image load errors by automatically refreshing the URL
  const handleImageError = async () => {
    console.log(`Image failed to load for file ${fileId}, attempting to refresh URL...`);
    setImageLoadError(true);
    
    // Try to refresh if we have a valid fileId
    if (fileId && fileId !== 'unknown' && user?.email) {
      try {
        console.log(`Attempting to refresh URL for failed image: ${fileId}`);
        const refreshed = await fileService.refreshFileUrls(fileId, user.email);
        setPreviewUrl(refreshed.preview);
        setLastRefresh(Date.now());
        setImageLoadError(false);
        console.log(`Successfully refreshed URL for ${fileId}`);
      } catch (error) {
        console.error('Auto-refresh after image error failed:', error);
        setError('Image expired and refresh failed');
      }
    } else if (initialUrl && user?.email) {
      // Try to refresh legacy file
      try {
        console.log(`Attempting to auto-refresh legacy file URL: ${initialUrl}`);
        const refreshResult = await refreshLegacyFile(initialUrl, user.email);
        if (refreshResult) {
          setPreviewUrl(refreshResult.preview_url);
          setRefreshedDownloadUrl(refreshResult.download_url);
          setLastRefresh(Date.now());
          setImageLoadError(false);
          console.log(`Successfully auto-refreshed legacy file URL`);
        } else {
          console.warn(`Failed to auto-refresh legacy file URL`);
        }
      } catch (error) {
        console.error('Auto-refresh of legacy file failed:', error);
      }
    } else {
      console.warn(`Cannot refresh URL - fileId: ${fileId}, initialUrl: ${initialUrl}, user.email: ${user?.email}`);
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
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Refresh Button - available for files with fileId or legacy files with initialUrl */}
              {((fileId && fileId !== 'unknown') || initialUrl) && (
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={fileId === 'unknown' ? 'Refresh legacy file URL' : 'Refresh expired URLs'}
                >
                  🔄
                </button>
              )}
              
              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={loading}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={fileId === 'unknown' ? 'Legacy file - using direct URL' : 'Secure download'}
              >
                {loading ? 'Loading...' : 'Download'}
              </button>
            </div>
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
                  handleImageError();
                  e.currentTarget.style.display = 'none';
                }}
                unoptimized={true}
                key={`${fileId}-${lastRefresh}`} // Force re-render when URL refreshes
              />
              {imageLoadError && (
                <div className="text-xs text-orange-500 mt-1 flex items-center gap-2">
                  <span>Image expired</span>
                  {((fileId && fileId !== 'unknown') || initialUrl) ? (
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      click to refresh
                    </button>
                  ) : (
                    <span>- refresh not available</span>
                  )}
                </div>
              )}
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
