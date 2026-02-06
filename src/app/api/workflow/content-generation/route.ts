import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { generateRankingContent } from '@/lib/agents/contentGenerator';

export const runtime = 'nodejs';

/**
 * GET /api/workflow/content-generation
 * Generate SEO-optimized content for a website using real SERP data
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
        serpResearch: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Get real SERP research from database
    const serpData = website.serpResearch[0];
    if (!serpData) {
      return NextResponse.json(
        { error: 'No SERP data available. Run SERP analysis first.' },
        { status: 400 }
      );
    }

    // Parse the actual SERP data from database
    const serpResearch = {
      keyword: serpData.keyword,
      searchIntent: serpData.intent || 'informational',
      opportunityScore: serpData.opportunityScore,
      difficulty: serpData.difficulty,
      estimatedTraffic: serpData.estimatedTraffic || '0',
      competitors: serpData.competitors || [],
      peopleAlsoAsk: serpData.peopleAlsoAsk || [],
      aiOverview: serpData.aiOverview || '',
      strategicInsights: serpData.strategicInsights || [],
      contentRecommendations: {
        format: ['blog post', 'guide'],
        length: '3000-4000 words',
        keyElementsToInclude: ['case studies', 'data'],
        uniqueAngle: serpData.strategicInsight || 'Data-driven approach',
      },
      rankingFactors: ['Keywords in H1', 'Backlinks', 'Content freshness'],
      gaps: serpData.contentGaps || [],
      quickWins: serpData.quickWins || [],
    };

    // Generate real content using actual SERP data
    const content = await generateRankingContent(
      serpData.keyword,
      serpResearch,
      'Website Content',
      website.url
    );

    return NextResponse.json({
      content: {
        title: content.title,
        metaDescription: content.metaDescription,
        slug: content.slug,
        content: content.content.substring(0, 2000) + '...',
        wordCount: content.wordCount,
        readingTime: content.readingTime,
        seoScore: content.seoScore,
        strategy: content.strategy,
        tone: content.tone,
      },
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
