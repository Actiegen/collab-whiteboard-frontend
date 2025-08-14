import { config } from './config';

export interface SecureFileUrl {
  download_url?: string;
  preview_url?: string;
  filename: string;
  content_type: string;
  size?: number;
  expires_in_hours?: number;
  expires_in_minutes?: number;
}

export class FileService {
  private static instance: FileService;
  private urlCache = new Map<string, { url: string; expiresAt: number; isValid: boolean }>();

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Check if a URL is still valid by testing it
   */
  private async isUrlValid(url: string): Promise<boolean> {
    try {
      // For signed URLs, we can also check if they're expired by parsing the URL
      if (url.includes('X-Goog-Expires') && url.includes('X-Goog-Date')) {
        const urlObj = new URL(url);
        const googDate = urlObj.searchParams.get('X-Goog-Date');
        const googExpires = urlObj.searchParams.get('X-Goog-Expires');
        
        if (googDate && googExpires) {
          const signedDate = new Date(googDate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
          const expiresInSeconds = parseInt(googExpires);
          const expirationDate = new Date(signedDate.getTime() + expiresInSeconds * 1000);
          
          if (expirationDate <= new Date()) {
            console.log(`URL expired at ${expirationDate}, current time: ${new Date()}`);
            return false;
          }
        }
      }
      
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get a secure download URL for a file with automatic refresh
   */
  async getDownloadUrl(fileId: string, userId: string, forceRefresh: boolean = false): Promise<string> {
    const cacheKey = `download_${fileId}`;
    const cached = this.urlCache.get(cacheKey);
    
    // Check if we have a valid cached URL (with 5 minute buffer)
    if (!forceRefresh && cached && cached.expiresAt > Date.now() + 5 * 60 * 1000 && cached.isValid) {
      // Validate the URL is still working
      const isStillValid = await this.isUrlValid(cached.url);
      if (isStillValid) {
        return cached.url;
      } else {
        // Mark as invalid and continue to refresh
        cached.isValid = false;
      }
    }

    try {
      console.log(`Fetching fresh download URL for file ${fileId}`);
      const response = await fetch(
        `${config.apiUrl}/files/${fileId}/download?user_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.status}`);
      }

      const data: SecureFileUrl = await response.json();
      
      if (data.download_url) {
        // Cache URL with expiration (subtract 1 hour for safety)
        const expiresAt = Date.now() + ((data.expires_in_hours || 24) - 1) * 60 * 60 * 1000;
        this.urlCache.set(cacheKey, {
          url: data.download_url,
          expiresAt,
          isValid: true,
        });
        
        console.log(`Cached download URL for file ${fileId}, expires at:`, new Date(expiresAt));
        return data.download_url;
      }

      throw new Error('No download URL received');
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Get a secure preview URL for a file with automatic refresh
   */
  async getPreviewUrl(fileId: string, userId: string, forceRefresh: boolean = false): Promise<string> {
    const cacheKey = `preview_${fileId}`;
    const cached = this.urlCache.get(cacheKey);
    
    // Check if we have a valid cached URL (with 2 minute buffer)
    if (!forceRefresh && cached && cached.expiresAt > Date.now() + 2 * 60 * 1000 && cached.isValid) {
      // Always validate the URL for preview URLs since they're used directly by browsers
      const isStillValid = await this.isUrlValid(cached.url);
      if (isStillValid) {
        console.log(`Using cached preview URL for file ${fileId}`);
        return cached.url;
      } else {
        console.log(`Cached preview URL for file ${fileId} is no longer valid, refreshing...`);
        // Mark as invalid and continue to refresh
        cached.isValid = false;
      }
    }

    try {
      console.log(`Fetching fresh preview URL for file ${fileId}`);
      const response = await fetch(
        `${config.apiUrl}/files/${fileId}/preview?user_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get preview URL: ${response.status}`);
      }

      const data: SecureFileUrl = await response.json();
      
      if (data.preview_url) {
        // Cache URL with expiration (subtract 10 minutes for safety)
        const expiresAt = Date.now() + ((data.expires_in_minutes || 60) - 10) * 60 * 1000;
        this.urlCache.set(cacheKey, {
          url: data.preview_url,
          expiresAt,
          isValid: true,
        });
        
        console.log(`Cached preview URL for file ${fileId}, expires at:`, new Date(expiresAt));
        return data.preview_url;
      }

      throw new Error('No preview URL received');
    } catch (error) {
      console.error('Error getting preview URL:', error);
      throw error;
    }
  }

  /**
   * Refresh a specific file's URLs
   */
  async refreshFileUrls(fileId: string, userId: string): Promise<{ preview: string; download: string }> {
    console.log(`Refreshing URLs for file ${fileId}`);
    const [preview, download] = await Promise.all([
      this.getPreviewUrl(fileId, userId, true),
      this.getDownloadUrl(fileId, userId, true)
    ]);
    return { preview, download };
  }

  /**
   * Refresh all cached URLs that are expired or invalid
   */
  async refreshExpiredUrls(userId: string): Promise<void> {
    const now = Date.now();
    const refreshPromises: Promise<void>[] = [];

    for (const [key, cached] of this.urlCache.entries()) {
      // Check if URL is expired or marked as invalid
      if (!cached.isValid || cached.expiresAt <= now) {
        const fileId = key.replace(/^(preview_|download_)/, '');
        const isPreview = key.startsWith('preview_');
        
        const refreshPromise = (async () => {
          try {
            if (isPreview) {
              await this.getPreviewUrl(fileId, userId, true);
            } else {
              await this.getDownloadUrl(fileId, userId, true);
            }
          } catch (error) {
            console.warn(`Failed to refresh ${isPreview ? 'preview' : 'download'} URL for file ${fileId}:`, error);
          }
        })();
        
        refreshPromises.push(refreshPromise);
      }
    }

    if (refreshPromises.length > 0) {
      console.log(`Refreshing ${refreshPromises.length} expired URLs`);
      await Promise.all(refreshPromises);
    }
  }

  /**
   * Check if any URLs need refreshing soon (within 10 minutes)
   */
  getUrlsNeedingRefresh(): string[] {
    const now = Date.now();
    const soonToExpire = now + 10 * 60 * 1000; // 10 minutes from now
    const needRefresh: string[] = [];

    for (const [key, cached] of this.urlCache.entries()) {
      if (!cached.isValid || cached.expiresAt <= soonToExpire) {
        const fileId = key.replace(/^(preview_|download_)/, '');
        if (!needRefresh.includes(fileId)) {
          needRefresh.push(fileId);
        }
      }
    }

    return needRefresh;
  }

  /**
   * Clear expired URLs from cache
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.urlCache.entries()) {
      if (value.expiresAt <= now) {
        this.urlCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached URLs
   */
  clearCache(): void {
    this.urlCache.clear();
  }
}

export const fileService = FileService.getInstance();
