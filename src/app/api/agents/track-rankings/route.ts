/**
 * Ranking Tracking API
 * Monitors keyword rankings and triggers optimization recommendations
 * Continuous tracking until #1 ranking achieved
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  trackKeywordRanking,
  generateRankingInsights,
  monitorKeywordBatch,
  needsOptimization,
  generateOptimizationStrategy,
  estimateOrganicTraffic,
} from '@/lib/agents/rankingTracker';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface TrackingRequest {
  domain: string;
  keywords: Array<{
    keyword: string;
    previousRank?: number;
    contentMetadata: {
      wordCount: number;
      lastUpdated: string;
      backlinksCount: number;
      trafficTrend: string;
      monthlySearchVolume?: number;
    };
  }>;
}

/**
 * POST /api/agents/track-rankings
 * Track keywords and generate optimization recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const trackingRequest: TrackingRequest = await request.json();

    // Monitor all keywords in batch
    const insights = await monitorKeywordBatch(
      trackingRequest.domain,
      trackingRequest.keywords
    );

    // Analyze which need immediate optimization
    const needsOptimizationList = [];
    const trackingResults = [];

    for (let i = 0; i < insights.length; i++) {
      const insight = insights[i];
      const keywordData = trackingRequest.keywords[i];

      // Get ranking data
      const rankingData = await trackKeywordRanking(
        trackingRequest.domain,
        insight.keyword,
        keywordData.previousRank || null
      );

      // Calculate estimated traffic
      const estimatedTraffic = estimateOrganicTraffic(
        keywordData.contentMetadata.monthlySearchVolume || 100,
        rankingData.currentPosition
      );

      trackingResults.push({
        keyword: insight.keyword,
        currentRank: rankingData.currentPosition,
        previousRank: rankingData.previousPosition,
        positionChange: rankingData.positionChange,
        visibility: rankingData.visibility,
        estimatedTraffic,
        trend: rankingData.trend,
        needsOptimization: needsOptimization(rankingData),
        insight: insight.insight,
        recommendations: insight.recommendations,
        nextCheckIn: insight.nextCheckIn,
      });

      if (needsOptimization(rankingData)) {
        needsOptimizationList.push({
          keyword: insight.keyword,
          rank: rankingData.currentPosition,
          priority:
            rankingData.currentPosition > 50
              ? 'critical'
              : rankingData.currentPosition > 20
              ? 'high'
              : 'medium',
          recommendations: insight.recommendations,
        });
      }
    }

    return NextResponse.json({
      domain: trackingRequest.domain,
      trackedKeywords: trackingResults.length,
      trackingResults,
      needsOptimization: needsOptimizationList,
      summary: {
        totalTracked: trackingResults.length,
        ranking1To3: trackingResults.filter((r) => r.currentRank <= 3).length,
        ranking4To10: trackingResults.filter(
          (r) => r.currentRank > 3 && r.currentRank <= 10
        ).length,
        ranking11Plus: trackingResults.filter(
          (r) => r.currentRank > 10
        ).length,
        needsOptimizationCount: needsOptimizationList.length,
        estimatedTotalTraffic: trackingResults.reduce(
          (sum, r) => sum + r.estimatedTraffic,
          0
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ranking tracking error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Ranking tracking failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/track-rankings
 * Get optimization strategy for a specific keyword
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const domain = searchParams.get('domain') || '';
    const currentRank = parseInt(searchParams.get('rank') || '0');

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: 'Missing keyword or domain parameter' },
        { status: 400 }
      );
    }

    // Get current ranking
    const rankingData = await trackKeywordRanking(domain, keyword, null);

    // Get insights
    const insights = await generateRankingInsights(
      domain,
      keyword,
      rankingData,
      {
        wordCount: 3000,
        lastUpdated: new Date(),
        backlinksCount: 10,
        trafficTrend: 'stable',
      }
    );

    // Generate optimization strategy
    const strategy = await generateOptimizationStrategy(
      keyword,
      insights,
      `Content about ${keyword}, currently ranking at position ${rankingData.currentPosition}`
    );

    return NextResponse.json({
      keyword,
      domain,
      currentRank: rankingData.currentPosition,
      visibility: rankingData.visibility,
      insights,
      optimizationStrategy: strategy,
      actionPlan: insights.recommendations.map((r) => ({
        ...r,
        timelineWeeks: r.priority === 'critical' ? 1 : r.priority === 'high' ? 2 : 3,
      })),
    });
  } catch (error) {
    console.error('Strategy generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate strategy',
      },
      { status: 500 }
    );
  }
}
