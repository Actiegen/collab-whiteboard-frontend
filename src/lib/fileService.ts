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
  private urlCache = new Map<string, { url: string; expiresAt: number }>();

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Get a secure download URL for a file
   */
  async getDownloadUrl(fileId: string, userId: string): Promise<string> {
    const cacheKey = `download_${fileId}`;
    const cached = this.urlCache.get(cacheKey);
    
    // Check if we have a valid cached URL (with 5 minute buffer)
    if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cached.url;
    }

    try {
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
        });
        
        return data.download_url;
      }

      throw new Error('No download URL received');
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Get a secure preview URL for a file (shorter expiration)
   */
  async getPreviewUrl(fileId: string, userId: string): Promise<string> {
    const cacheKey = `preview_${fileId}`;
    const cached = this.urlCache.get(cacheKey);
    
    // Check if we have a valid cached URL (with 2 minute buffer)
    if (cached && cached.expiresAt > Date.now() + 2 * 60 * 1000) {
      return cached.url;
    }

    try {
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
        });
        
        return data.preview_url;
      }

      throw new Error('No preview URL received');
    } catch (error) {
      console.error('Error getting preview URL:', error);
      throw error;
    }
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
