import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { generateResearchReports } from '@/lib/agents/serpAnalysis';

export const runtime = 'nodejs';

/**
 * GET /api/workflow/serp-analysis
 * Perform SERP analysis for extracted keywords
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

    // Get keywords to analyze (for demo, use sample keywords)
    const sampleKeywords = [
      'best seo tools',
      'how to improve ranking',
      'seo optimization guide',
      'keyword research',
      'content marketing strategy',
    ];

    // Perform SERP analysis on keywords
    const serpData = await generateResearchReports(
      sampleKeywords,
      'Technology',
      'SaaS'
    );

    return NextResponse.json({
      serpData: serpData.map((data) => ({
        keyword: data.keyword,
        opportunityScore: data.opportunityScore,
        difficulty: data.difficulty,
        competitors: data.competitors.slice(0, 5),
        peopleAlsoAsk: data.peopleAlsoAsk.slice(0, 5),
        strategicInsights: data.strategicInsights,
        gaps: data.gaps,
        quickWins: data.quickWins,
      })),
    });
  } catch (error) {
    console.error('SERP analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SERP' },
      { status: 500 }
    );
  }
}
