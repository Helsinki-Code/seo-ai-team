/**
 * Ranking Tracker Agent
 * Implements etherrank patterns: Real SERP checking via Google Search tool
 * Schema-based structured output, grounding metadata extraction
 * Nexus pattern: Exponential backoff retry for rate limits
 * Monitors keyword rankings continuously and triggers optimization
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

export interface RankingData {
  keyword: string;
  domain: string;
  currentPosition: number;
  previousPosition: number;
  positionChange: number;
  visibility: number; // 1-100
  estimatedTraffic: number;
  url: string;
  title: string;
  snippet: string;
  lastTracked: Date;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number; // 0-100, how certain is this ranking
}

export interface OptimizationRecommendation {
  area: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  estimatedImpact: string;
  implementation: string[];
}

export interface RankingInsight {
  keyword: string;
  domain: string;
  currentRank: number;
  insight: string;
  recommendations: OptimizationRecommendation[];
  nextCheckIn: number; // hours
}

/**
 * Track keyword ranking using real Google Search
 * etherrank pattern: Use Google Search tool to find actual ranking
 */
export async function trackKeywordRanking(
  domain: string,
  keyword: string,
  previousRank: number | null = null
): Promise<RankingData> {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';

  const prompt = `
    Perform a real-time Google Search for the keyword: "${keyword}"
    Find the ranking position of the domain "${domain}" in the organic search results.

    TASK:
    1. Search Google for "${keyword}"
    2. Scan the organic search results (excluding ads)
    3. Find the first occurrence of domain "${domain}"
    4. Determine the exact rank position (1-100+)
    5. If found, extract the URL, title, and snippet
    6. If not found in top 100, set rank to 0

    Return JSON with complete ranking data.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      found: { type: Type.BOOLEAN },
      rank: {
        type: Type.INTEGER,
        description:
          'The numerical rank position. 0 if domain not found in top 100.',
      },
      url: { type: Type.STRING, description: 'The full URL of the ranking page.' },
      title: { type: Type.STRING, description: 'The title of the page.' },
      snippet: {
        type: Type.STRING,
        description: 'The snippet shown in search results.',
      },
      confidence: {
        type: Type.INTEGER,
        description: 'Confidence score 0-100 for this ranking data.',
      },
    },
    required: ['found', 'rank', 'confidence'],
  };

  try {
    // Wrap in retry logic to handle rate limits
    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: prompt,
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

    // Calculate trend
    const positionChange =
      previousRank !== null ? previousRank - parsed.rank : 0;
    const trend =
      positionChange > 2
        ? ('improving' as const)
        : positionChange < -2
        ? ('declining' as const)
        : ('stable' as const);

    // Calculate visibility based on position
    const visibility = calculateVisibilityScore(parsed.rank);

    return {
      keyword,
      domain,
      currentPosition: parsed.rank || 0,
      previousPosition: previousRank || parsed.rank || 0,
      positionChange,
      visibility,
      estimatedTraffic: 0, // Will be calculated if we have search volume
      url: parsed.url || '',
      title: parsed.title || '',
      snippet: parsed.snippet || '',
      lastTracked: new Date(),
      trend,
      confidence: parsed.confidence || 75,
    };
  } catch (error) {
    console.error('Failed to track ranking:', error);
    // Return a confidence score of 0 to indicate data is unreliable
    return {
      keyword,
      domain,
      currentPosition: 0,
      previousPosition: previousRank || 0,
      positionChange: 0,
      visibility: 0,
      estimatedTraffic: 0,
      url: '',
      title: '',
      snippet: '',
      lastTracked: new Date(),
      trend: 'stable',
      confidence: 0,
    };
  }
}

/**
 * Generate AI-powered ranking insights
 * Based on real SERP data from trackKeywordRanking
 */
export async function generateRankingInsights(
  domain: string,
  keyword: string,
  rankingData: RankingData,
  contentMetadata: {
    wordCount: number;
    lastUpdated: Date;
    backlinksCount: number;
    trafficTrend: string;
  }
): Promise<RankingInsight> {
  const ai = getAI();

  const prompt = `
    Analyze this keyword ranking data and provide optimization recommendations.

    DOMAIN: ${domain}
    KEYWORD: "${keyword}"
    CURRENT POSITION: ${rankingData.currentPosition}
    PREVIOUS POSITION: ${rankingData.previousPosition}
    POSITION CHANGE: ${rankingData.positionChange > 0 ? '+' : ''}${rankingData.positionChange}
    VISIBILITY SCORE: ${rankingData.visibility}
    CONFIDENCE: ${rankingData.confidence}%
    TREND: ${rankingData.trend}

    CURRENT RANKING:
    - URL: ${rankingData.url}
    - Title: ${rankingData.title}
    - Snippet: ${rankingData.snippet}

    CONTENT METRICS:
    - Word Count: ${contentMetadata.wordCount}
    - Last Updated: ${contentMetadata.lastUpdated.toDateString()}
    - Backlinks: ${contentMetadata.backlinksCount}
    - Traffic Trend: ${contentMetadata.trafficTrend}

    RANK GOAL: Position 1-3 (top 3 results)

    Generate actionable recommendations to improve ranking.
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
            insight: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    enum: ['critical', 'high', 'medium', 'low'],
                  },
                  action: { type: Type.STRING },
                  estimatedImpact: { type: Type.STRING },
                  implementation: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['area', 'priority', 'action'],
              },
            },
            nextCheckIn: { type: Type.INTEGER },
          },
          required: ['insight', 'recommendations', 'nextCheckIn'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      keyword,
      domain,
      currentRank: rankingData.currentPosition,
      insight:
        parsed.insight ||
        `Keyword "${keyword}" ranking at position ${rankingData.currentPosition}. Confidence: ${rankingData.confidence}%`,
      recommendations: parsed.recommendations || [],
      nextCheckIn: parsed.nextCheckIn || 24,
    };
  } catch (error) {
    console.error('Failed to generate insights:', error);
    return {
      keyword,
      domain,
      currentRank: rankingData.currentPosition,
      insight: `Unable to generate insights at this time.`,
      recommendations: [],
      nextCheckIn: 24,
    };
  }
}

/**
 * Monitor multiple keywords and batch recommendations
 * Sequential processing with delays to avoid rate limiting
 */
export async function monitorKeywordBatch(
  domain: string,
  keywords: Array<{
    keyword: string;
    previousRank?: number;
    contentMetadata: any;
  }>
): Promise<RankingInsight[]> {
  const insights: RankingInsight[] = [];

  for (const item of keywords) {
    try {
      console.log(`Tracking ranking for: ${item.keyword}`);
      const rankingData = await trackKeywordRanking(
        domain,
        item.keyword,
        item.previousRank || null
      );

      console.log(
        `  Position: ${rankingData.currentPosition} (Confidence: ${rankingData.confidence}%)`
      );

      const insight = await generateRankingInsights(
        domain,
        item.keyword,
        rankingData,
        item.contentMetadata
      );

      insights.push(insight);

      // Delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to track ${item.keyword}:`, error);
    }
  }

  return insights;
}

/**
 * Determine if content needs optimization
 */
export function needsOptimization(rankingData: RankingData): boolean {
  // Optimize if:
  // 1. Rank is beyond position 10
  // 2. Position declined significantly
  // 3. Visibility below 30%
  // 4. Low confidence in ranking data
  return (
    rankingData.currentPosition > 10 ||
    rankingData.positionChange < -3 ||
    rankingData.visibility < 30 ||
    rankingData.confidence < 50
  );
}

/**
 * Generate optimization strategy
 */
export async function generateOptimizationStrategy(
  keyword: string,
  insight: RankingInsight,
  contentSummary: string
): Promise<string> {
  const ai = getAI();

  const prompt = `
    Generate a detailed optimization strategy for this content.

    KEYWORD: "${keyword}"
    CURRENT RANK: ${insight.currentRank}

    CURRENT INSIGHT:
    ${insight.insight}

    RECOMMENDATIONS:
    ${insight.recommendations.map((r) => `- [${r.priority.toUpperCase()}] ${r.action}`).join('\n')}

    CONTENT SUMMARY:
    ${contentSummary}

    Provide a prioritized action plan to move this content to position 1-3.
    Format as numbered action items with timeline estimates.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || 'Unable to generate strategy at this time.';
  } catch (e) {
    console.error('Failed to generate optimization strategy:', e);
    return 'Unable to generate strategy at this time.';
  }
}

/**
 * Calculate ranking visibility score based on CTR
 * etherrank pattern: Position-based CTR estimation
 */
export function calculateVisibilityScore(position: number): number {
  if (position === 0) return 0; // Not ranked

  // Typical CTR by position in Google SERPs
  const ctrByPosition: Record<number, number> = {
    1: 28,
    2: 15,
    3: 10,
    4: 8,
    5: 7,
    6: 6,
    7: 5,
    8: 4,
    9: 3,
    10: 2.5,
  };

  const ctr =
    ctrByPosition[position] || Math.max(0, 30 - position * 2.5);
  return Math.min(Math.max(ctr * 3.33, 0), 100); // Scale to 0-100
}

/**
 * Estimate organic traffic from ranking
 */
export function estimateOrganicTraffic(
  monthlySearchVolume: number,
  position: number
): number {
  if (position === 0) return 0;

  // Typical CTR by position
  const ctrByPosition: Record<number, number> = {
    1: 0.28,
    2: 0.15,
    3: 0.1,
    4: 0.08,
    5: 0.07,
    6: 0.06,
    7: 0.05,
    8: 0.04,
    9: 0.03,
    10: 0.025,
  };

  const ctr =
    ctrByPosition[position] || Math.max(0, 0.30 - position * 0.025);
  return Math.round(monthlySearchVolume * ctr);
}
