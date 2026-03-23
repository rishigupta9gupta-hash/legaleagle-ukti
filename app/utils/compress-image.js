/**
 * Client-side image compression utility.
 * Resizes and compresses images before sending to AI APIs
 * to reduce token usage and avoid rate limits.
 */

/**
 * Compress a base64 image (data URL) to reduce size.
 * @param {string} dataUrl - The base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @param {object} options
 * @param {number} options.maxWidth - Max width in pixels (default: 800)
 * @param {number} options.maxHeight - Max height in pixels (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.6)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export function compressImage(dataUrl, options = {}) {
    const { maxWidth = 800, maxHeight = 800, quality = 0.6 } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                let { width, height } = img;

                // Calculate new dimensions maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', quality);
                
                // Log compression stats
                const originalSize = Math.round(dataUrl.length * 0.75 / 1024);
                const compressedSize = Math.round(compressed.length * 0.75 / 1024);
                console.log(`Image compressed: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`);
                
                resolve(compressed);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUrl;
    });
}

/**
 * Compress a raw base64 string (without data URL prefix).
 * @param {string} base64 - Raw base64 string
 * @param {string} mimeType - Original mime type
 * @param {object} options - Compression options
 * @returns {Promise<{base64: string, mimeType: string}>} Compressed data
 */
export function compressBase64(base64, mimeType, options = {}) {
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return compressImage(dataUrl, options).then(compressed => {
        const newBase64 = compressed.split(',')[1];
        return { base64: newBase64, mimeType: 'image/jpeg' };
    });
}
