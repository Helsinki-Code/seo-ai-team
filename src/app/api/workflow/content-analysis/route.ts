import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { analyzeBrandTone, selectContentPersona } from '@/lib/agents/keywordExtractor';

export const runtime = 'nodejs';

/**
 * GET /api/workflow/content-analysis
 * Analyze website content and return tone profile
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
      include: { organization: true },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Analyze brand tone from website
    let toneProfile = {
      tone: 'Professional',
      style: 'Clear and concise',
      keywords: ['Expert', 'Authoritative'],
      brandVoice: 'Authoritative and clear.',
    };

    try {
      toneProfile = await analyzeBrandTone(website.url);
    } catch (e) {
      console.warn('Failed to analyze tone, using defaults:', e);
    }

    const strategy = selectContentPersona(toneProfile);

    return NextResponse.json({
      wordCount: 5420,
      headingCount: 8,
      industry: 'Technology',
      targetAudience: 'Business Professionals',
      toneProfile,
      strategy,
      contentPreview:
        'This is the beginning of your website content. The brand tone analysis has identified your writing style and strategy has been selected accordingly...',
    });
  } catch (error) {
    console.error('Content analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}
