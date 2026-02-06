/**
 * Advanced Content Generation Agent
 * Implements velvetrank-seo-architect patterns:
 * - 5 Content Strategy Personas (Contrarian, Storyteller, Data Scientist, Visionary, Ultimate Guide)
 * - Brand tone analysis integration
 * - Comprehensive outline generation (8-10+ sections minimum)
 * - Section-by-section writing with context preservation
 * - PAA (People Also Ask) section integration
 * - Internal linking strategy
 */

import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { SERPResearchReport } from './serpAnalysis';
import { analyzeBrandTone, selectContentPersona, type StrategyType, type ToneProfile } from './keywordExtractor';
import { withRetry } from './utils/retry';
import { sanitizeContentForContext, truncateForTokenLimit } from './utils/contentSanitizer';
import { applyLinkSuggestions, type LinkSuggestion } from './utils/linkBuilder';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API Key not found in environment');
  }
  return new GoogleGenAI({ apiKey });
};

export interface GeneratedImage {
  prompt: string;
  altText: string;
  caption?: string;
  seoOptimized: boolean;
}

export interface GeneratedContent {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  images: GeneratedImage[];
  wordCount: number;
  readingTime: number;
  seoScore: number;
  keywordDensity: Record<string, number>;
  strategy: StrategyType;
  tone: ToneProfile;
}

/**
 * Generate system instruction for content strategy persona
 * velvetrank pattern: 5 distinct content personas
 */
function getSystemInstructionForStrategy(
  strategy: StrategyType,
  brandVoice: string
): string {
  const base = `You are an elite human content creator, not an AI. Your brand voice is: ${brandVoice}.`;

  switch (strategy) {
    case 'The Contrarian':
      return `${base} You are skeptical, bold, and opinionated. You challenge common industry myths. You use strong language and hate generic advice. You feel frustration when people do things wrong. Write with grit.`;
    case 'The Storyteller':
      return `${base} You are a master narrator. You weave every fact into a compelling narrative arc. Use metaphors, analogies, and emotional hooks. Make the reader feel the journey. Start with a personal anecdote.`;
    case 'The Data Scientist':
      return `${base} You are obsessed with facts, logic, and proven metrics. You despise fluff. Every claim must be backed by data. You write with clinical precision but deep authority.`;
    case 'The Visionary':
      return `${base} You look at the big picture. You are inspiring, forward-thinking, and motivational. You talk about the future implications and 'what if' scenarios.`;
    case 'The Ultimate Guide':
    default:
      return `${base} You are the definitive source. You are comprehensive, exhaustive, and extremely structured. You leave no stone unturned. You are helpful, patient, and incredibly detailed.`;
  }
}

/**
 * Step 1: Generate comprehensive article outline
 * velvetrank pattern: 8-10+ distinct sections
 */
async function generateOutline(
  keyword: string,
  strategy: StrategyType,
  report: SERPResearchReport,
  toneProfile: ToneProfile
): Promise<{ title: string; sections: string[]; paa: string[] }> {
  const ai = getAI();

  const prompt = `
    Strategy Persona: ${strategy}
    Keyword: ${keyword}
    Brand Voice: ${toneProfile.brandVoice}
    Unique Angle: ${report.contentRecommendations.uniqueAngle}
    People Also Ask: ${report.peopleAlsoAsk.join(', ')}
    Content Gaps: ${report.gaps.join(', ')}

    TASK:
    1. Analyze the keyword, SERP context, and business angle
    2. Create a MASSIVE, book-length article outline
    3. Generate AT LEAST 8-10 distinct sections (excluding intro/conclusion) to ensure 3000+ word article
    4. Structure must reflect the "${strategy}" persona:
       - The Contrarian: Bold, myth-busting, opinionated headings
       - The Storyteller: Narrative arc, emotional journey headings
       - The Data Scientist: Data-driven, logical, metrics-focused headings
       - The Visionary: Future-focused, transformative, implications headings
       - The Ultimate Guide: Comprehensive, exhaustive, structured headings
    5. Include subsections (H3) for depth
    6. Ensure all PAA questions are addressed
    7. Include strategic gaps in current content

    Return JSON:
    {
      "title": "Catchy, persona-appropriate title with keyword",
      "sections": ["Section 1 Title", "Section 2 Title", "Section 3 Title", ...],
      "paa": ["Question 1?", "Question 2?", "Question 3?"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            paa: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'sections', 'paa'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      title: parsed.title || keyword,
      sections: parsed.sections || [],
      paa: parsed.paa || [],
    };
  } catch (e) {
    console.error('Failed to generate outline:', e);
    return {
      title: keyword,
      sections: [
        'Introduction',
        'Fundamentals',
        'Strategy',
        'Implementation',
        'Advanced Techniques',
        'Common Mistakes',
        'Tools & Resources',
        'Case Studies',
        'FAQ',
      ],
      paa: report.peopleAlsoAsk,
    };
  }
}

/**
 * Step 2: Write individual section
 * velvetrank pattern: Context-aware section writing with internal linking
 */
async function writeSection(
  sectionTitle: string,
  keyword: string,
  strategy: StrategyType,
  toneProfile: ToneProfile,
  previousContext: string,
  internalLinks: string[] = [],
  isPaaSection: boolean = false
): Promise<string> {
  const ai = getAI();
  const systemInstruction = getSystemInstructionForStrategy(
    strategy,
    toneProfile.brandVoice
  );

  const linksContext =
    internalLinks.length > 0
      ? `\nAVAILABLE INTERNAL LINKS (SITEMAP): \n${internalLinks.join('\n')}\n\nIf any links are contextually relevant to this section, you MUST hyperlink the relevant anchor text to the exact URL provided. Prioritize interlinking but don't force it.`
      : '';

  const paaInstruction = isPaaSection
    ? `This section is dedicated to answering "People Also Ask" questions. Provide direct, comprehensive, and authoritative answers using schema-friendly formatting.`
    : '';

  // Sanitize previous context to save tokens and avoid base64 issues
  const sanitizedContext = sanitizeContentForContext(previousContext);
  const truncatedContext = truncateForTokenLimit(sanitizedContext, 2000);

  const prompt = `
    TASK: Write a detailed, deep-dive section for an article about "${keyword}".
    SECTION TITLE: "${sectionTitle}"
    PREVIOUS CONTEXT: ${truncatedContext}...
    ${linksContext}
    ${paaInstruction}

    RULES:
    1. Length: MUST be at least 400-500 words for this section alone
    2. Format: Use Markdown. Use H3/H4 for subsections
    3. Voice: Apply the "${strategy}" persona. Be human. Be unique. Avoid AI-sounding content
    4. Visualization: If mentioning data, suggest [CHART: description]. For complex concepts, suggest [IMAGE: description]
    5. Flow: Connect naturally from previous context
    6. Authority: Include specific examples, data points, or case studies when appropriate
    7. Engagement: Use conversational tone, rhetorical questions, and compelling language
    8. MANDATORY: Extensive external linking. Identify and naturally integrate high-quality, high-DA external citations/links.
  `;

  try {
    // Wrap in retry logic to handle rate limits (Nexus pattern)
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction,
        },
      })
    );

    return response.text || '';
  } catch (e) {
    console.error('Failed to write section:', e);
    return `## ${sectionTitle}\n\nContent generation failed. Please try again.`;
  }
}

/**
 * Main content generation orchestrator
 * Implements full velvetrank pattern: Outline → Strategy Selection → Section Writing
 */
export async function generateRankingContent(
  keyword: string,
  report: SERPResearchReport,
  businessContext: string,
  websiteUrl?: string
): Promise<GeneratedContent> {
  // Step 1: Analyze brand tone and select content strategy persona
  let toneProfile: ToneProfile = {
    tone: 'Professional',
    style: 'Clear and concise',
    keywords: ['Expert', 'Authoritative'],
    brandVoice: 'Authoritative and clear.',
  };

  if (websiteUrl) {
    try {
      toneProfile = await analyzeBrandTone(websiteUrl);
    } catch (e) {
      console.warn('Failed to analyze brand tone, using default:', e);
    }
  }

  const strategy = selectContentPersona(toneProfile);
  console.log(`Selected content strategy: ${strategy}`);

  // Step 2: Generate comprehensive outline (8-10+ sections)
  console.log('Generating article outline...');
  const outline = await generateOutline(keyword, strategy, report, toneProfile);

  // Step 3: Build article content section by section
  const ai = getAI();
  let fullContent = `# ${outline.title}\n\n`;

  const internalLinks: string[] = [
    // Parse from report if available - for now use empty array
  ];

  // Write Introduction
  console.log('Writing introduction...');
  const intro = await writeSection(
    'Introduction & Hook',
    keyword,
    strategy,
    toneProfile,
    '',
    internalLinks
  );
  fullContent += `## Introduction\n\n${intro}\n\n`;

  // Write Body Sections
  const totalSections = outline.sections.length;
  for (let i = 0; i < totalSections; i++) {
    const section = outline.sections[i];
    const isPaa = section.includes('FAQ') || section.includes('Question');

    console.log(`Writing section ${i + 1}/${totalSections}: ${section}`);

    const sectionContent = await writeSection(
      section,
      keyword,
      strategy,
      toneProfile,
      fullContent,
      internalLinks,
      isPaa
    );

    fullContent += `## ${section}\n\n${sectionContent}\n\n`;

    // Add small delay to avoid rate limiting
    if (i < totalSections - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Write Conclusion
  console.log('Writing conclusion...');
  const conclusion = await writeSection(
    'Conclusion & Next Steps',
    keyword,
    strategy,
    toneProfile,
    fullContent,
    internalLinks
  );
  fullContent += `## Conclusion\n\n${conclusion}`;

  // Step 4: Generate SEO metadata
  console.log('Generating SEO metadata...');
  const metaPrompt = `
    Write a seductive meta description for this article: "${outline.title}"
    Keep it under 160 characters.
    Include the keyword naturally.
    Make it compelling for CTR.
  `;

  const metaResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: metaPrompt,
  });

  const metaDescription = metaResponse.text?.trim() || '';

  // Step 5: Extract images and calculate metrics
  const imageMatches = fullContent.match(/\[IMAGE[^\]]*\]/g) || [];
  const images: GeneratedImage[] = imageMatches.slice(0, 3).map((img) => ({
    prompt: img,
    altText: `Illustration for ${outline.title}`,
    caption: img,
    seoOptimized: true,
  }));

  const wordCount = fullContent.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Calculate keyword density
  const keywordDensity: Record<string, number> = {};
  const allKeywords = [keyword, ...report.contentRecommendations.keyElementsToInclude];

  for (const kw of allKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = fullContent.match(regex) || [];
    keywordDensity[kw] = Number(((matches.length / wordCount) * 100).toFixed(2));
  }

  // Apply smart internal link suggestions if available (Nexus pattern)
  let optimizedContent = fullContent;
  if (internalLinks.length > 0) {
    try {
      // Convert internal links to LinkSuggestion format and apply them
      const linkSuggestions: LinkSuggestion[] = internalLinks
        .slice(0, 5) // Limit to 5 links
        .map((link, i) => ({
          id: `internal-${i}`,
          anchorText: link.split('/').pop() || link,
          targetUrl: link,
          context: link,
          type: 'internal' as const,
          confidence: 0.85,
        }));

      optimizedContent = await applyLinkSuggestions(
        fullContent,
        linkSuggestions
      );
    } catch (e) {
      console.warn('Failed to apply internal links:', e);
      // Continue without link application
    }
  }

  return {
    title: outline.title,
    metaDescription,
    slug: outline.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-'),
    content: optimizedContent,
    images,
    wordCount,
    readingTime,
    seoScore: calculateSEOScore(optimizedContent, keyword),
    keywordDensity,
    strategy,
    tone: toneProfile,
  };
}

/**
 * Calculate SEO score for generated content
 */
function calculateSEOScore(content: string, keyword: string): number {
  let score = 0;

  // Check keyword presence
  const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
  const keywordMatches = content.match(keywordRegex) || [];
  if (keywordMatches.length > 0) score += 15;

  // Check for H2 tags (structure)
  const h2Matches = content.match(/##\s/g) || [];
  if (h2Matches.length >= 6) score += 20;
  if (h2Matches.length >= 10) score += 5;

  // Check word count (should be 3000+)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 2000) score += 15;
  if (wordCount >= 3000) score += 10;
  if (wordCount >= 5000) score += 5;

  // Check for lists
  if (content.includes('- ') || content.includes('* ')) score += 10;

  // Check for emphasis/formatting
  if (content.includes('**') || content.includes('__')) score += 10;

  // Check for internal links
  if (content.includes('[') && content.includes(']')) score += 10;

  // Check keyword density (1-2% is optimal)
  const density = (keywordMatches.length / wordCount) * 100;
  if (density >= 0.5 && density <= 2.5) score += 15;

  return Math.min(score, 100);
}

/**
 * Generate multiple variations of content using different personas
 */
export async function generateContentVariations(
  keyword: string,
  report: SERPResearchReport,
  businessContext: string,
  websiteUrl?: string,
  count: number = 2
): Promise<GeneratedContent[]> {
  const variations: GeneratedContent[] = [];

  for (let i = 0; i < count; i++) {
    console.log(`Generating variation ${i + 1}/${count}`);
    const variation = await generateRankingContent(
      keyword,
      report,
      businessContext,
      websiteUrl
    );
    variations.push(variation);

    if (i < count - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return variations;
}
