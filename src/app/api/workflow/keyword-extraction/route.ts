import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { generateKeywordStrategy, enrichKeywordsWithRealTimeData } from '@/lib/agents/keywordExtractor';

export const runtime = 'nodejs';

/**
 * GET /api/workflow/keyword-extraction
 * Extract and enrich keywords for a website
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
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Generate comprehensive keyword list (60-80 minimum)
    const keywords = await generateKeywordStrategy(
      website.url,
      'Website content here',
      'Technology',
      'Businesses'
    );

    // Enrich with real-time data from Google Search
    const metrics = await enrichKeywordsWithRealTimeData(keywords);

    return NextResponse.json({
      keywords: metrics.slice(0, 80),
      total: metrics.length,
      categories: {
        primary: metrics.filter((k) => k.category === 'Primary').length,
        secondary: metrics.filter((k) => k.category === 'Secondary').length,
        longTail: metrics.filter((k) => k.category === 'Long Tail').length,
        question: metrics.filter((k) => k.category === 'Question').length,
      },
    });
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract keywords' },
      { status: 500 }
    );
  }
}
