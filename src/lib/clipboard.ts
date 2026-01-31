/**
 * Clipboard and sharing utilities
 * Supports Web Share API for mobile and clipboard fallback
 */

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: string;
}

export interface ShareData {
  title?: string;
  text?: string;
  url: string;
}

/**
 * Copy text to clipboard with fallback for older browsers
 * @param text - The text to copy to clipboard
 * @returns Promise resolving to success status
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  if (!text) {
    return { success: false, error: 'No text provided' };
  }

  try {
    // Modern clipboard API
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true };
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (success) {
      return { success: true };
    }
    return { success: false, error: 'execCommand failed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown clipboard error';
    return { success: false, error: message };
  }
}

/**
 * Copy a Spotify track URL to clipboard
 * @param trackUrl - The Spotify track URL
 * @returns Promise resolving to success status
 */
export async function copyTrackUrl(trackUrl: string | undefined): Promise<ClipboardResult> {
  if (!trackUrl) {
    return { success: false, error: 'No track URL available' };
  }
  return copyToClipboard(trackUrl);
}

/**
 * Check if Web Share API is available
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Share content using Web Share API or fall back to clipboard copy
 * Tries navigator.share() first (mobile native share), then clipboard
 * @param data - The share data (title, text, url)
 * @returns Promise resolving to share result with method used
 */
export async function shareOrCopy(data: ShareData): Promise<ShareResult> {
  if (!data.url) {
    return { success: false, method: 'clipboard', error: 'No URL provided' };
  }

  // Try Web Share API first (available on mobile and some desktop browsers)
  if (canShare()) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return { success: true, method: 'share' };
    } catch (error) {
      // User cancelled or share failed - fall through to clipboard
      // AbortError means user cancelled, which is not an error for our purposes
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, method: 'share', error: 'Share cancelled' };
      }
      // For other errors, fall through to clipboard
    }
  }

  // Fall back to clipboard copy
  const clipboardResult = await copyToClipboard(data.url);
  return {
    success: clipboardResult.success,
    method: 'clipboard',
    error: clipboardResult.error,
  };
}

/**
 * Share a Spotify track URL using Web Share API or clipboard
 * @param trackUrl - The Spotify track URL
 * @param trackName - Optional track name for share title
 * @returns Promise resolving to share result
 */
export async function shareTrackUrl(
  trackUrl: string | undefined,
  trackName?: string
): Promise<ShareResult> {
  if (!trackUrl) {
    return { success: false, method: 'clipboard', error: 'No track URL available' };
  }
  return shareOrCopy({
    title: trackName ? `${trackName} on Spotify` : 'Check out this track on Spotify',
    url: trackUrl,
  });
}
