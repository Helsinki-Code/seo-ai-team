import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { trackKeywordRanking, monitorKeywordBatch } from '@/lib/agents/rankingTracker';

export const runtime = 'nodejs';

/**
 * GET /api/workflow/rank-tracking
 * Track real rankings for website keywords from database
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const websiteId = request.nextUrl.searchParams.get('websiteId');
    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID required' }, { status: 400 });
    }

    const website = await prisma.website.findUnique({
      where: { id: parseInt(websiteId) },
      include: {
        keywords: {
          include: {
            rankings: {
              orderBy: { trackedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Get real keyword rankings from database
    const rankings = await Promise.all(
      website.keywords.map(async (kw) => {
        // Get latest ranking from database
        const latestRanking = kw.rankings[0];
        const previousRanking = kw.rankings[1];

        // If no recent ranking, check current position via Google Search
        let currentRanking = latestRanking;
        if (!latestRanking || new Date().getTime() - new Date(latestRanking.trackedAt).getTime() > 86400000) {
          currentRanking = await trackKeywordRanking(website.url, kw.keyword, latestRanking?.position || null);
        }

        return {
          keyword: kw.keyword,
          currentPosition: currentRanking.currentPosition,
          visibility: currentRanking.visibility,
          estimatedTraffic: currentRanking.estimatedTraffic,
          trend: currentRanking.trend,
          confidence: currentRanking.confidence,
          recommendations: [
            {
              area: 'Content',
              action: 'Expand content to 3000+ words',
              priority: 'high',
            },
            {
              area: 'Backlinks',
              action: 'Build 5+ high-quality backlinks',
              priority: 'high',
            },
          ],
        };
      })
    );

    return NextResponse.json({
      rankings: rankings.slice(0, 20),
      total: rankings.length,
      topThree: rankings.filter((r) => r.currentPosition > 0 && r.currentPosition <= 3).length,
      topTen: rankings.filter((r) => r.currentPosition > 0 && r.currentPosition <= 10).length,
      averageVisibility: Math.round(rankings.reduce((a, r) => a + r.visibility, 0) / rankings.length),
    });
  } catch (error) {
    console.error('Rank tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track rankings' },
      { status: 500 }
    );
  }
}
