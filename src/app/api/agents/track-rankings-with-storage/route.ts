/**
 * Ranking Tracking with Database Storage
 * Tracks keywords and stores ALL ranking data in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  trackKeywordRanking,
  generateRankingInsights,
  needsOptimization,
} from '@/lib/agents/rankingTracker';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface TrackingRequest {
  websiteId: number;
  domain: string;
  keywords: Array<{
    keyword: string;
    contentMetadata?: {
      wordCount: number;
      lastUpdated: string;
      backlinksCount: number;
      trafficTrend: string;
      monthlySearchVolume?: number;
    };
  }>;
}

/**
 * POST /api/agents/track-rankings-with-storage
 * Track keywords and store ranking data in database
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const req: TrackingRequest = await request.json();
    const { websiteId, keywords } = req;

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const trackingResults = [];
    const needsOptimizationList = [];

    // Track each keyword
    for (const keywordData of keywords) {
      try {
        // Get keyword from database
        let keyword = await prisma.keyword.findUnique({
          where: { websiteId_keyword: { websiteId, keyword: keywordData.keyword } },
        });

        // Create if doesn't exist
        if (!keyword) {
          keyword = await prisma.keyword.create({
            data: {
              websiteId,
              keyword: keywordData.keyword,
              type: 'primary',
              monthlySearchVolume:
                keywordData.contentMetadata?.monthlySearchVolume || 100,
            },
          });
        }

        // Get previous ranking if exists
        const previousRanking = await prisma.ranking.findFirst({
          where: { keywordId: keyword.id },
          orderBy: { trackedAt: 'desc' },
        });

        // Track current ranking
        const rankingData = await trackKeywordRanking(
          website.url,
          keywordData.keyword,
          previousRanking?.currentPosition || null
        );

        // Store ranking in database
        const ranking = await prisma.ranking.create({
          data: {
            websiteId,
            keywordId: keyword.id,
            currentPosition: rankingData.currentPosition,
            previousPosition: rankingData.previousPosition,
            positionChange: rankingData.positionChange,
            visibility: rankingData.visibility,
            estimatedTraffic: rankingData.estimatedTraffic,
            trend: rankingData.trend,
            needsOptimization: needsOptimization(rankingData),
          },
        });

        // Generate insights
        const insights = await generateRankingInsights(
          website.url,
          keywordData.keyword,
          rankingData,
          keywordData.contentMetadata || {
            wordCount: 2000,
            lastUpdated: new Date().toISOString(),
            backlinksCount: 0,
            trafficTrend: 'stable',
          }
        );

        trackingResults.push({
          ranking: {
            id: ranking.id,
            keyword: keywordData.keyword,
            currentRank: ranking.currentPosition,
            previousRank: ranking.previousPosition,
            positionChange: ranking.positionChange,
            visibility: ranking.visibility,
            estimatedTraffic: ranking.estimatedTraffic,
            trend: ranking.trend,
            needsOptimization: ranking.needsOptimization,
          },
          insights: insights.insight,
          recommendations: insights.recommendations,
          storedAt: ranking.trackedAt,
        });

        if (ranking.needsOptimization) {
          needsOptimizationList.push({
            keywordId: keyword.id,
            keyword: keywordData.keyword,
            rank: ranking.currentPosition,
            priority:
              ranking.currentPosition > 50
                ? 'critical'
                : ranking.currentPosition > 20
                ? 'high'
                : 'medium',
            recommendations: insights.recommendations,
          });
        }
      } catch (error) {
        console.error(`Failed to track ${keywordData.keyword}:`, error);
      }
    }

    return NextResponse.json({
      websiteId,
      trackedKeywords: trackingResults.length,
      trackingResults,
      needsOptimization: needsOptimizationList,
      summary: {
        totalTracked: trackingResults.length,
        ranking1To3: trackingResults.filter((r) => r.ranking.currentRank <= 3)
          .length,
        ranking4To10: trackingResults.filter(
          (r) => r.ranking.currentRank > 3 && r.ranking.currentRank <= 10
        ).length,
        ranking11Plus: trackingResults.filter(
          (r) => r.ranking.currentRank > 10
        ).length,
        needsOptimizationCount: needsOptimizationList.length,
        estimatedTotalTraffic: trackingResults.reduce(
          (sum, r) => sum + (r.ranking.estimatedTraffic || 0),
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
          error instanceof Error ? error.message : 'Ranking tracking failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/track-rankings-with-storage?websiteId=X
 * Get ranking history from database
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const websiteId = parseInt(searchParams.get('websiteId') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId required' },
        { status: 400 }
      );
    }

    // Get all rankings for website
    const rankings = await prisma.ranking.findMany({
      where: { websiteId },
      include: {
        keyword: true,
      },
      orderBy: { trackedAt: 'desc' },
      take: limit,
    });

    // Group by keyword to show history
    const rankingsByKeyword: Record<string, any[]> = {};
    for (const ranking of rankings) {
      if (!rankingsByKeyword[ranking.keyword.keyword]) {
        rankingsByKeyword[ranking.keyword.keyword] = [];
      }
      rankingsByKeyword[ranking.keyword.keyword].push({
        position: ranking.currentPosition,
        visibility: ranking.visibility,
        traffic: ranking.estimatedTraffic,
        trend: ranking.trend,
        trackedAt: ranking.trackedAt,
      });
    }

    return NextResponse.json({
      websiteId,
      totalRankings: rankings.length,
      keywords: Object.keys(rankingsByKeyword).length,
      rankingsByKeyword,
      recentRankings: rankings.slice(0, 20).map((r) => ({
        keyword: r.keyword.keyword,
        position: r.currentPosition,
        change: r.positionChange,
        visibility: r.visibility,
        traffic: r.estimatedTraffic,
        trackedAt: r.trackedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ranking retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rankings' },
      { status: 500 }
    );
  }
}
