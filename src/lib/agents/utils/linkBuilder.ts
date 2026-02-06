/**
 * Smart Link Builder Utility
 * Applies link suggestions with intelligent regex to avoid double-linking
 * Nexus pattern: Safe internal linking
 */

export interface LinkSuggestion {
  id: string;
  anchorText: string;
  targetUrl: string;
  context: string;
  type: 'internal' | 'external';
  confidence: number;
}

/**
 * Apply link suggestions to content using smart regex
 * Prevents double-linking and respects existing markdown links
 */
export const applyLinkSuggestions = async (
  content: string,
  suggestions: LinkSuggestion[]
): Promise<string> => {
  let newContent = content;

  // Sort by length descending to avoid replacing substrings of other anchors
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.anchorText.length - a.anchorText.length
  );

  for (const suggestion of sortedSuggestions) {
    if (!suggestion.anchorText || !suggestion.targetUrl) continue;

    try {
      // Escape special regex characters in anchor text
      const escapedAnchor = suggestion.anchorText.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      // Regex to match anchor text ONLY if NOT already part of a markdown link
      // Negative lookbehind: not preceded by [
      // Negative lookahead: not followed by ]
      const regex = new RegExp(
        `(?<!\\[)${escapedAnchor}(?!\\](?:\\([^)]*\\))?)`,
        'gi'
      );

      const replacement = `[${suggestion.anchorText}](${suggestion.targetUrl})`;
      newContent = newContent.replace(regex, replacement);
    } catch (error) {
      console.warn(
        `Failed to apply link suggestion for "${suggestion.anchorText}":`,
        error
      );
      // Continue with next suggestion if this one fails
    }
  }

  return newContent;
};

/**
 * Validate internal links are within allowed domains
 */
export const validateInternalLinks = (
  content: string,
  allowedDomains: string[]
): string => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let validatedContent = content;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [fullLink, anchorText, url] = match;

    // Check if URL is internal and valid
    const isValid = allowedDomains.some((domain) => url.includes(domain));

    if (!isValid && url.startsWith('http')) {
      // Remove link but keep text
      validatedContent = validatedContent.replace(fullLink, anchorText);
    }
  }

  return validatedContent;
};

/**
 * Extract all links from content
 */
export const extractLinks = (
  content: string
): { anchor: string; url: string }[] => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: { anchor: string; url: string }[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      anchor: match[1],
      url: match[2],
    });
  }

  return links;
};

/**
 * Check if a URL is already linked in content
 */
export const isUrlAlreadyLinked = (content: string, url: string): boolean => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match[2] === url) {
      return true;
    }
  }

  return false;
};
