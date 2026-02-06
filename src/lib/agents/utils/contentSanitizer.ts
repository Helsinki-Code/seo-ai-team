/**
 * Content Sanitizer Utility
 * Removes base64 images and large data URIs to save tokens
 * Nexus pattern: Token optimization
 */

export const sanitizeContentForContext = (content: string): string => {
  // Replace markdown images containing data:image with a placeholder
  return content
    .replace(
      /!\[.*?\]\(data:image\/.*?\)/g,
      '![image]([IMAGE_PLACEHOLDER_REMOVED_TO_SAVE_TOKENS])'
    )
    .replace(
      /!\[.*?\]\(data:video\/.*?\)/g,
      '![video]([VIDEO_PLACEHOLDER_REMOVED_TO_SAVE_TOKENS])'
    );
};

/**
 * Truncate content to avoid token limits
 * Preserves markdown structure
 */
export const truncateForTokenLimit = (
  content: string,
  maxChars: number = 10000
): string => {
  if (content.length <= maxChars) {
    return content;
  }

  const truncated = content.substring(0, maxChars);
  // Try to truncate at a paragraph boundary
  const lastNewline = truncated.lastIndexOf('\n\n');
  return lastNewline > maxChars * 0.8
    ? truncated.substring(0, lastNewline)
    : truncated + '...';
};

/**
 * Remove base64 encoded data and URLs
 * Keeps markdown structure intact
 */
export const stripBase64Data = (content: string): string => {
  return content.replace(/data:[^,]+,(?:[A-Za-z0-9+/]+=*)/g, '[DATA_REMOVED]');
};
