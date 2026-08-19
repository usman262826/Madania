/**
 * Utility functions for reading, compressing, and managing image/document files 
 * for database storage in Base64 format.
 */

export interface MediaAsset {
  id: string;
  title: string;
  category: 'logo' | 'header' | 'stamp' | 'signature' | 'teacher' | 'student' | 'document' | 'other';
  url: string;
  fileSize?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Converts a File object to a compressed Base64 Data URL
 */
export const processAndCompressImage = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<{ dataUrl: string; sizeFormatted: string }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      // Non-image file (e.g. PDF/Doc): Read directly as Data URL
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const sizeKB = (file.size / 1024).toFixed(1) + ' KB';
        resolve({ dataUrl: result, sizeFormatted: sizeKB });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP or JPEG Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeBytes = Math.round((dataUrl.length * 3) / 4);
        const sizeKB = (approxSizeBytes / 1024).toFixed(1) + ' KB';

        resolve({ dataUrl, sizeFormatted: sizeKB });
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Helper to download a Base64 data URL as a file
 */
export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
