/**
 * AI Overview Optimizer Agent
 * Optimizes content for Google's AI Overview (SGE)
 * Nexus pattern: Creating optimized "Key Takeaways" block
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeContentForContext } from './utils/contentSanitizer';
import { withRetry } from './utils/retry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIOverviewBlock {
  title: string;
  summary: string;
  keyPoints: string[];
  markdown: string;
}

/**
 * Optimize content for AI Overview with Key Takeaways block
 * Creates a direct-answer section that Google's SGE can pick up
 */
export const optimizeForAIOverview = async (
  fullContent: string,
  keyword: string
): Promise<AIOverviewBlock> => {
  // Sanitize content to save tokens and avoid base64 issues
  const safeContent = sanitizeContentForContext(fullContent);
  const contentPreview = safeContent.substring(0, 5000);

  const prompt = `You are an SEO expert optimizing content for Google's AI Overview (Search Generative Experience).

Analyze this article content for the keyword: "${keyword}"

Content Context: ${contentPreview}...

Your task:
1. Create a concise "Key Takeaways" or "Quick Answer" section that directly answers the search query
2. Format it as bullet points (3-5 points max)
3. Keep each point to 15-20 words
4. Make it factual, directly answerable, and comprehensive
5. This will be placed at the top of the article to be picked up by Google's AI Overview

Output as JSON with:
{
  "title": "Key Takeaways",
  "summary": "One sentence summarizing the main answer (50 words max)",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const response = await withRetry(() =>
      model.generateContent({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      })
    );

    const text = response.response.text();
    const data = JSON.parse(text);

    // Build markdown version
    const markdown = buildAIOverviewMarkdown(
      data.title || 'Key Takeaways',
      data.summary || '',
      data.keyPoints || []
    );

    return {
      title: data.title || 'Key Takeaways',
      summary: data.summary || '',
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
      markdown,
    };
  } catch (error) {
    console.error('AI Overview optimization failed:', error);
    return {
      title: 'Key Takeaways',
      summary: '',
      keyPoints: [],
      markdown: '',
    };
  }
};

/**
 * Build markdown version of AI Overview block
 */
const buildAIOverviewMarkdown = (
  title: string,
  summary: string,
  keyPoints: string[]
): string => {
  let markdown = `## ${title}\n\n`;

  if (summary) {
    markdown += `${summary}\n\n`;
  }

  if (keyPoints.length > 0) {
    markdown += '### Key Points:\n\n';
    keyPoints.forEach((point) => {
      markdown += `- ${point}\n`;
    });
  }

  return markdown;
};

/**
 * Create schema-optimized block for better indexing
 */
export const createSchemaOptimizedBlock = (
  title: string,
  keyPoints: string[]
): string => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: keyPoints.join(' '),
        },
      },
    ],
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
};

/**
 * Validate if content is optimized for AI Overview
 */
export const isOptimizedForAIOverview = (content: string): boolean => {
  // Check for key indicators of AI Overview optimization
  const hasKeyTakeaways =
    content.includes('Key Takeaway') || content.includes('Quick Answer');
  const hasBulletPoints = (content.match(/^[-*]/gm) || []).length >= 3;
  const hasSchema = content.includes('schema.org') || content.includes('FAQPage');

  return hasKeyTakeaways || (hasBulletPoints && hasSchema);
};

/**
 * Inject AI Overview block at the beginning of content
 */
export const injectAIOverviewBlock = (
  content: string,
  block: AIOverviewBlock
): string => {
  // Remove any existing similar blocks
  const cleanContent = content
    .replace(/## Key Takeaways[\s\S]*?(?=##|$)/i, '')
    .replace(/## Quick Answer[\s\S]*?(?=##|$)/i, '');

  // Inject at the beginning after the H1 title
  const lines = cleanContent.split('\n');
  const h1Index = lines.findIndex((line) => line.startsWith('# '));

  if (h1Index !== -1) {
    lines.splice(h1Index + 1, 0, '', block.markdown, '');
    return lines.join('\n');
  }

  return block.markdown + '\n\n' + cleanContent;
};
