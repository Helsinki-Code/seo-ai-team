/**
 * Comprehensive SERP Analysis Agent
 * Implements velvet-serp patterns: Deep SERP analysis, opportunity scoring (0-100),
 * competitor extraction, people also ask questions, AI overview detection
 * Nexus pattern: Exponential backoff retry for rate limits
 */

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { withRetry } from './utils/retry';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API Key not found in environment');
  }
  return new GoogleGenAI({ apiKey });
};

export interface CompetitorData {
  name: string;
  url: string;
  title: string;
  excerpt: string;
  domainAuthority?: number;
  backlinks?: number;
  avgEngagement?: string;
}

export interface SERPResearchReport {
  keyword: string;
  searchIntent: 'informational' | 'commercial' | 'navigational' | 'transactional';
  opportunityScore: number;
  difficulty: number;
  estimatedTraffic: string;
  competitors: CompetitorData[];
  peopleAlsoAsk: string[];
  aiOverview: string;
  strategicInsights: string[];
  contentRecommendations: {
    format: string[];
    length: string;
    keyElementsToInclude: string[];
    uniqueAngle: string;
  };
  rankingFactors: string[];
  gaps: string[];
  quickWins: string[];
}

/**
 * Perform comprehensive SERP analysis for a keyword
 * Implements velvet-serp pattern: Deep SERP analysis with Google Search tool
 * Returns opportunity score (0-100), competitors, PAA questions, and strategic insights
 */
export async function analyzeSERPForKeyword(
  keyword: string,
  industry: string,
  businessType: string
): Promise<SERPResearchReport> {
  const ai = getAI();
  const model = 'gemini-2.5-flash'; // velvet-serp uses 2.5-flash

  const analysisPrompt = `
    Perform a deep SERP analysis for the keyword: "${keyword}"
    Industry: ${industry}
    Business Type: ${businessType}

    TASK:
    1. Search Google for this exact keyword
    2. Analyze the top 10 organic results
    3. Identify search intent based on SERP characteristics
    4. Score the opportunity (0-100) based on traffic potential vs. difficulty
    5. Extract top 5 competing domains with metrics
    6. Find people also ask (PAA) questions from the SERP
    7. Determine estimated monthly search volume
    8. Provide strategic insights for ranking
    9. Identify content gaps in current top results
    10. Suggest content format and unique angle

    Return JSON with comprehensive SERP analysis.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      searchIntent: {
        type: Type.STRING,
        enum: ['informational', 'commercial', 'navigational', 'transactional'],
      },
      opportunityScore: {
        type: Type.INTEGER,
        description:
          'Score 0-100 based on traffic potential vs. ranking difficulty',
      },
      difficulty: {
        type: Type.INTEGER,
        description: 'Ranking difficulty 1-100',
      },
      estimatedTraffic: { type: Type.STRING },
      competitors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            url: { type: Type.STRING },
            title: { type: Type.STRING },
            excerpt: { type: Type.STRING },
            domainAuthority: { type: Type.INTEGER },
            backlinks: { type: Type.INTEGER },
          },
          required: ['name', 'url', 'title'],
        },
      },
      peopleAlsoAsk: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      aiOverview: { type: Type.STRING },
      strategicInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      contentRecommendations: {
        type: Type.OBJECT,
        properties: {
          format: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          length: { type: Type.STRING },
          keyElementsToInclude: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          uniqueAngle: { type: Type.STRING },
        },
      },
      rankingFactors: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      gaps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      quickWins: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      'searchIntent',
      'opportunityScore',
      'difficulty',
      'estimatedTraffic',
      'competitors',
      'peopleAlsoAsk',
      'strategicInsights',
    ],
  };

  try {
    // Wrap in retry logic to handle rate limits (Nexus pattern)
    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: analysisPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');

    // Extract grounding URLs from search results (etherrank pattern)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata
      ?.groundingChunks as any[];
    const groundingUrls =
      groundingChunks
        ?.map((chunk: any) => chunk.web?.uri)
        .filter((uri: any) => !!uri) || [];

    return {
      keyword,
      searchIntent: parsed.searchIntent || 'informational',
      opportunityScore: parsed.opportunityScore || 50,
      difficulty: parsed.difficulty || 50,
      estimatedTraffic: parsed.estimatedTraffic || 'Unknown',
      competitors: parsed.competitors || [],
      peopleAlsoAsk: parsed.peopleAlsoAsk || [],
      aiOverview: parsed.aiOverview || '',
      strategicInsights: parsed.strategicInsights || [],
      contentRecommendations: parsed.contentRecommendations || {
        format: ['blog post'],
        length: '2000-3000 words',
        keyElementsToInclude: ['examples', 'data'],
        uniqueAngle: 'Data-driven analysis',
      },
      rankingFactors: parsed.rankingFactors || [],
      gaps: parsed.gaps || [],
      quickWins: parsed.quickWins || [],
    };
  } catch (error) {
    console.error('Failed to analyze SERP:', error);
    throw new Error(`Failed to analyze SERP for keyword: ${keyword}`);
  }
}

/**
 * Batch analyze multiple keywords and generate research report
 * Implements aetherseo pattern: Sequential processing with delays to avoid rate limiting
 */
export async function generateResearchReports(
  keywords: string[],
  industry: string,
  businessType: string
): Promise<SERPResearchReport[]> {
  const reports: SERPResearchReport[] = [];

  for (const keyword of keywords) {
    try {
      console.log(`Analyzing keyword: ${keyword}`);
      const report = await analyzeSERPForKeyword(keyword, industry, businessType);
      reports.push(report);

      // Add delay to avoid rate limiting (1 second between requests)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to analyze ${keyword}:`, error);
      // Continue with next keyword instead of failing entire batch
    }
  }

  return reports;
}

/**
 * Generate SEO-optimized title and meta description based on research
 */
export async function generateOptimizedTitle(
  keyword: string,
  report: SERPResearchReport
): Promise<{ title: string; metaDescription: string }> {
  const ai = getAI();

  const prompt = `
Generate an SEO-optimized title and meta description for ranking on this keyword.

KEYWORD: "${keyword}"
SEARCH INTENT: ${report.searchIntent}
UNIQUE ANGLE: ${report.contentRecommendations.uniqueAngle}
INSIGHTS: ${report.strategicInsights.join(', ')}

Return JSON:
{
  "title": "Keyword | Unique Angle - 50-60 chars",
  "metaDescription": "2-3 sentences with keyword, benefit, and CTA - 150-160 chars"
}

Requirements:
- Title must include the exact keyword
- Meta description must include keyword and be compelling
- Both must be optimized for CTR
- Meta should include a benefit or unique angle
`;

  try {
    // Wrap in retry logic (Nexus pattern)
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
            },
            required: ['title', 'metaDescription'],
          },
        },
      })
    );

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error('Failed to generate optimized title:', e);
    return {
      title: `${keyword} | Premium Guide`,
      metaDescription: `Discover everything about ${keyword}. Expert insights, practical tips, and complete guide to ${keyword}.`,
    };
  }
}

/**
 * Generate article outline based on research report
 */
export async function generateArticleOutline(
  keyword: string,
  report: SERPResearchReport
): Promise<string[]> {
  const ai = getAI();

  const prompt = `
Generate a detailed article outline for ranking on this keyword.

KEYWORD: "${keyword}"
CONTENT FORMAT: ${report.contentRecommendations.format.join(', ')}
KEY ELEMENTS: ${report.contentRecommendations.keyElementsToInclude.join(', ')}
UNIQUE ANGLE: ${report.contentRecommendations.uniqueAngle}
PEOPLE ALSO ASK: ${report.peopleAlsoAsk.slice(0, 5).join(', ')}
GAPS: ${report.gaps.join(', ')}

Generate a hierarchical outline (as array of outline items with indentation):

Return JSON array:
[
  "1. Introduction - Hook about [insight]",
  "   1.1 Why this matters",
  "2. Section Title",
  "   2.1 Subsection",
  "   2.2 Subsection"
]

Requirements:
- Include H1 (article title)
- Include 4-8 main sections (H2)
- Include 2-4 subsections per section (H3)
- Address at least 5 People Also Ask questions
- Fill the identified content gaps
- Follow the recommended content format
- Include CTA section at the end
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error('Failed to generate article outline:', e);
    return [
      `# ${keyword}`,
      '## Introduction',
      '## Main Section 1',
      '## Main Section 2',
      '## FAQ',
      '## Conclusion',
    ];
  }
}
