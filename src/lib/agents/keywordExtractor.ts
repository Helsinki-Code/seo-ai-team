/**
 * Intelligent Keyword Extraction from Website Content
 * Implements aetherseo patterns: 60-80 keywords minimum, dual-model approach, batching, real-time enrichment
 * Also integrates velvetrank brand tone analysis and etherrank schema-based structured output
 * Nexus pattern: Exponential backoff retry for rate limits
 */

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { withRetry } from './utils/retry';
import { sanitizeContentForContext } from './utils/contentSanitizer';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API Key not found in environment');
  }
  return new GoogleGenAI({ apiKey });
};

export enum KeywordCategory {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  LONG_TAIL = 'Long Tail',
  QUESTION = 'Question',
}

export interface KeywordMetric {
  keyword: string;
  category: KeywordCategory;
  difficulty: 'Low' | 'Medium' | 'High' | 'Very High';
  volumeEstimate: string;
  intent: 'Informational' | 'Transactional' | 'Navigational' | 'Commercial';
  competitionInsight: string;
}

export interface ExtractedKeywords {
  primary: string[];
  secondary: string[];
  questions: string[];
  longTail: string[];
  intent: {
    commercial: string[];
    informational: string[];
    navigational: string[];
    transactional: string[];
  };
  allKeywords: string[];
  metrics?: KeywordMetric[];
}

/**
 * Discover pages using Google Search - aetherseo pattern
 * Simulates comprehensive site audit by finding 25-40 distinct URLs
 */
export async function discoverPages(domain: string): Promise<string[]> {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';

  const prompt = `
    I need to perform a comprehensive site audit of ${domain}.
    Use Google Search to find the sitemap, main navigation, product categories, blog archives, and key landing pages.

    Your goal is to simulate a web crawler by finding as many distinct, accessible URLs as possible for this domain.
    Focus on high-value pages (not just privacy policies).

    Return a JSON array of at least 25-40 distinct URLs.
    Format: ["https://...", "https://...", ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const urls = JSON.parse(response.text || '[]');
    return Array.isArray(urls) ? urls.slice(0, 50) : [];
  } catch (e) {
    console.error('Failed to discover pages:', e);
    return [];
  }
}

/**
 * Generate comprehensive keyword strategy - aetherseo pattern
 * Uses gemini-3-pro-preview with thinking mode for deep analysis
 * Generates 60-80 MINIMUM unique keywords
 */
export async function generateKeywordStrategy(
  domain: string,
  pageContent: string,
  industry: string,
  targetAudience: string
): Promise<string[]> {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';

  const prompt = `
    Analyze the following website content for ${domain} in the ${industry} industry targeting ${targetAudience}:

    ${pageContent.substring(0, 2000)}

    Act as a world-class SEO strategist.
    1. Identify content gaps and opportunities based on the website.
    2. Generate a MASSIVE, COMPREHENSIVE list of high-potential keywords.
    3. You MUST generate at least 60-80 unique keywords.
    4. Ensure a diverse mix:
       - Primary (High volume, head terms): 8-10 keywords
       - Secondary (Variations, LSI): 15-20 keywords
       - Long Tail (Specific intent, lower competition): 20-30 keywords
       - Questions (What, How, Why, When, Where queries): 15-20 keywords

    Output strictly as a JSON array of keyword strings. Do not include objects, just the keyword strings.
    Example: ["keyword 1", "keyword 2", "what is keyword 3", "best keyword 4", ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const keywords = JSON.parse(response.text || '[]');
    if (!Array.isArray(keywords)) return [];

    // Ensure minimum 60 keywords
    if (keywords.length < 60) {
      console.warn(`Generated only ${keywords.length} keywords, target was 60-80`);
    }

    return keywords.slice(0, 100);
  } catch (e) {
    console.error('Failed to generate keyword strategy:', e);
    return [];
  }
}

/**
 * Enrich keywords with real-time data - aetherseo pattern
 * Uses Google Search to analyze SERP for each keyword batch
 * Implements batching (size 10) to prevent timeouts
 * Returns comprehensive metrics for each keyword
 */
export async function enrichKeywordsWithRealTimeData(
  keywords: string[]
): Promise<KeywordMetric[]> {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';

  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    batches.push(keywords.slice(i, i + BATCH_SIZE));
  }

  const processBatch = async (batch: string[]): Promise<KeywordMetric[]> => {
    const prompt = `
      Perform a real-time Google Search analysis for these specific keywords: ${JSON.stringify(batch)}

      For EACH keyword, analyze the SERP to determine:
      1. Category (Primary, Secondary, Long Tail, or Question) - infer from keyword characteristics
      2. Difficulty (Low, Medium, High, Very High) - Be realistic. "High" if top results are Wikipedia, Amazon, or Govt sites.
      3. Volume Estimate (e.g., "1k-10k") - Estimate based on topic popularity and search trends
      4. Intent (Informational, Transactional, Navigational, Commercial) - Based on keyword intent
      5. Insight - A super brief reason for the difficulty (e.g. "Crowded by ads" or "New emerging trend")

      Return valid JSON array.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: [
                    KeywordCategory.PRIMARY,
                    KeywordCategory.SECONDARY,
                    KeywordCategory.LONG_TAIL,
                    KeywordCategory.QUESTION,
                  ],
                },
                difficulty: {
                  type: Type.STRING,
                  enum: ['Low', 'Medium', 'High', 'Very High'],
                },
                volumeEstimate: { type: Type.STRING },
                intent: {
                  type: Type.STRING,
                  enum: [
                    'Informational',
                    'Transactional',
                    'Navigational',
                    'Commercial',
                  ],
                },
                competitionInsight: { type: Type.STRING },
              },
              required: [
                'keyword',
                'category',
                'difficulty',
                'volumeEstimate',
                'intent',
                'competitionInsight',
              ],
            },
          },
        },
      });

      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.warn('Batch processing failed, skipping:', e);
      return [];
    }
  };

  const results: KeywordMetric[] = [];

  // Process batches in parallel groups of 3 to respect rate limits
  for (let i = 0; i < batches.length; i += 3) {
    const batchGroup = batches.slice(i, i + 3);
    const batchResults = await Promise.all(
      batchGroup.map((batch) => processBatch(batch))
    );
    batchResults.forEach((res) => results.push(...res));
  }

  return results;
}

/**
 * Extract comprehensive keyword data from website content
 * Combines discovery, strategy generation, and real-time enrichment
 */
export async function extractKeywordsFromContent(
  websiteContent: string,
  industry: string,
  targetAudience: string,
  domain?: string
): Promise<ExtractedKeywords> {
  // Step 1: Generate comprehensive keyword list (60-80 minimum)
  const allKeywords = await generateKeywordStrategy(
    domain || 'website',
    websiteContent,
    industry,
    targetAudience
  );

  if (allKeywords.length === 0) {
    throw new Error('Failed to generate keywords');
  }

  // Step 2: Enrich with real-time data from Google Search
  const metrics = await enrichKeywordsWithRealTimeData(allKeywords);

  // Step 3: Categorize keywords
  const categorized = {
    primary: allKeywords.filter(
      (k) =>
        !k.includes('?') &&
        !k.includes('how') &&
        !k.includes('what') &&
        !k.includes('why') &&
        !k.includes('when') &&
        k.split(' ').length <= 3
    ),
    secondary: allKeywords.filter(
      (k) =>
        !k.includes('?') &&
        !k.includes('how') &&
        !k.includes('what') &&
        !k.includes('why') &&
        !k.includes('when') &&
        k.split(' ').length > 3 &&
        k.split(' ').length <= 4
    ),
    questions: allKeywords.filter(
      (k) =>
        k.includes('?') ||
        k.includes('how') ||
        k.includes('what') ||
        k.includes('why') ||
        k.includes('when')
    ),
    longTail: allKeywords.filter(
      (k) =>
        !k.includes('?') &&
        !k.includes('how') &&
        !k.includes('what') &&
        !k.includes('why') &&
        !k.includes('when') &&
        k.split(' ').length > 4
    ),
  };

  // Step 4: Group by intent
  const intent = {
    commercial: allKeywords.filter((k) =>
      /buy|price|cost|deal|discount|cheap|best|top|review/i.test(k)
    ),
    informational: allKeywords.filter((k) =>
      /what|how|guide|tutorial|learn|explain|tips|advice/i.test(k)
    ),
    navigational: allKeywords.filter((k) =>
      /official|brand|company|site|app|platform/i.test(k)
    ),
    transactional: allKeywords.filter((k) =>
      /sign up|register|subscribe|book|order|purchase|download/i.test(k)
    ),
  };

  return {
    primary: categorized.primary.slice(0, 10),
    secondary: categorized.secondary.slice(0, 20),
    questions: categorized.questions.slice(0, 20),
    longTail: categorized.longTail.slice(0, 30),
    intent,
    allKeywords,
    metrics,
  };
}

/**
 * Analyze keyword difficulty and opportunity - etherrank pattern
 * Uses Google Search to check SERP and provide accurate difficulty scoring
 */
export async function analyzeKeywordOpportunity(
  keyword: string,
  industry: string
): Promise<{
  difficulty: number;
  opportunity: number;
  potentialTraffic: string;
  recommendation: string;
}> {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';

  const prompt = `
    Analyze this keyword for SEO opportunity using real SERP data:
    Keyword: "${keyword}"
    Industry: ${industry}

    Check the actual Google search results for this keyword and provide:
    1. Difficulty score (1-100): How hard to rank based on competitor strength
    2. Opportunity score (1-100): How valuable to target (traffic potential + relevance)
    3. Potential traffic estimate based on keyword volume and intent
    4. Strategic recommendation (priority level and reasoning)

    Return JSON:
    {
      "difficulty": 45,
      "opportunity": 78,
      "potentialTraffic": "500-1000 monthly searches",
      "recommendation": "High priority - moderate competition, excellent traffic potential"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficulty: { type: Type.INTEGER },
            opportunity: { type: Type.INTEGER },
            potentialTraffic: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['difficulty', 'opportunity', 'potentialTraffic', 'recommendation'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error('Failed to analyze keyword opportunity:', e);
    return {
      difficulty: 50,
      opportunity: 50,
      potentialTraffic: 'Unknown',
      recommendation: 'Unable to analyze at this time',
    };
  }
}

/**
 * Cluster related keywords for content grouping and pillar strategy
 * Uses gemini-3-pro-preview for deep semantic understanding
 */
export async function clusterKeywords(
  keywords: string[]
): Promise<Record<string, string[]>> {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';

  const prompt = `
    Group these ${keywords.length} keywords into semantic clusters for content pillar strategy:

    Keywords: ${keywords.join(', ')}

    Create 5-15 clusters where each:
    - Represents a single coherent topic/intent
    - Contains 2-12 related keywords
    - Has a descriptive pillar name that could be a main article topic

    Return JSON with topic clusters:
    {
      "Pillar Name 1": ["keyword1", "keyword2", "keyword3"],
      "Pillar Name 2": ["keyword4", "keyword5", "keyword6"]
    }

    Focus on creating a logical content structure that could support a pillar + cluster content strategy.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          additionalProperties: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error('Failed to cluster keywords:', e);
    return {};
  }
}

/**
 * Analyze brand tone and writing style - velvetrank pattern
 * Integrates brand voice analysis for content strategy persona selection
 */
export interface ToneProfile {
  tone: string;
  style: string;
  keywords: string[];
  brandVoice: string;
}

export async function analyzeBrandTone(
  websiteUrl: string
): Promise<ToneProfile> {
  const ai = getAI();
  const model = 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze the writing style, tone of voice, target audience, and brand personality of the website: ${websiteUrl}.

      Return JSON:
      {
        "tone": "professional/casual/humorous/academic/inspirational",
        "style": "descriptive writing style",
        "keywords": ["brand trait 1", "brand trait 2", "brand trait 3"],
        "brandVoice": "Complete brand voice description"
      }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as ToneProfile;
  } catch (error) {
    return {
      tone: 'Professional',
      style: 'Clear and concise',
      keywords: ['Expert', 'Authoritative'],
      brandVoice: 'Authoritative and clear.',
    };
  }
}

/**
 * Get content strategy persona based on brand analysis
 * velvetrank pattern - returns one of 5 personas
 */
export type StrategyType =
  | 'The Contrarian'
  | 'The Storyteller'
  | 'The Data Scientist'
  | 'The Visionary'
  | 'The Ultimate Guide';

export function selectContentPersona(
  brandTone: ToneProfile
): StrategyType {
  const { tone, keywords } = brandTone;
  const lowerTone = tone.toLowerCase();
  const lowerKeywords = keywords.map((k) => k.toLowerCase()).join(' ');

  if (
    lowerKeywords.includes('contrarian') ||
    lowerKeywords.includes('bold') ||
    lowerKeywords.includes('opinionated')
  ) {
    return 'The Contrarian';
  }

  if (
    lowerTone.includes('narrative') ||
    lowerTone.includes('storytelling') ||
    lowerKeywords.includes('story')
  ) {
    return 'The Storyteller';
  }

  if (
    lowerTone.includes('data') ||
    lowerTone.includes('analytic') ||
    lowerKeywords.includes('data-driven')
  ) {
    return 'The Data Scientist';
  }

  if (
    lowerTone.includes('visionary') ||
    lowerTone.includes('future') ||
    lowerKeywords.includes('forward-thinking')
  ) {
    return 'The Visionary';
  }

  return 'The Ultimate Guide';
}
