/**
 * Guest Posting Data API
 * Fetches REAL guest posting campaign and target data from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/data/guest-posting?websiteId=X&campaignId=X
 * Get guest posting campaign data with real stats
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const websiteId = parseInt(searchParams.get('websiteId') || '0');
    const campaignId = searchParams.get('campaignId');

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId required' },
        { status: 400 }
      );
    }

    if (campaignId) {
      // Get specific campaign with targets
      const campaign = await prisma.guestPostingCampaign.findUnique({
        where: { id: parseInt(campaignId) },
        include: {
          targets: {
            include: {
              outreachEmails: true,
            },
          },
        },
      });

      if (!campaign || campaign.websiteId !== websiteId) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      // Calculate stats
      const targets = campaign.targets;
      const totalEmails = targets.reduce(
        (sum, t) => sum + t.outreachEmails.length,
        0
      );
      const openedEmails = targets.reduce((sum, t) => sum + t.openCount, 0);
      const clickedEmails = targets.reduce((sum, t) => sum + t.clickCount, 0);
      const repliedEmails = targets.reduce((sum, t) => sum + t.replyCount, 0);

      return NextResponse.json({
        campaign: {
          id: campaign.id,
          name: campaign.campaignName,
          niche: campaign.targetNiche,
          status: campaign.status,
          createdAt: campaign.createdAt,
        },
        stats: {
          totalTargets: campaign.totalTargets,
          researched: campaign.researchedCount,
          outreached: campaign.outreachedCount,
          published: campaign.publishedCount,
          emails: {
            total: totalEmails,
            opened: openedEmails,
            clicked: clickedEmails,
            replied: repliedEmails,
            openRate: totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0,
            clickRate: totalEmails > 0 ? (clickedEmails / totalEmails) * 100 : 0,
          },
        },
        targets: targets.map((target) => ({
          id: target.id,
          domain: target.domain,
          authority: target.domainAuthority,
          relevance: Number(target.relevanceScore),
          status: target.status,
          priority: target.priority,
          contactEmail: target.contactEmail,
          outreachCount: target.outreachCount,
          opens: target.openCount,
          clicks: target.clickCount,
          replies: target.replyCount,
          published: target.published,
          publishedUrl: target.publishedUrl,
          publishedDate: target.publishedDate,
        })),
      });
    } else {
      // Get all campaigns for website
      const campaigns = await prisma.guestPostingCampaign.findMany({
        where: { websiteId },
        include: {
          targets: {
            include: {
              outreachEmails: true,
            },
          },
        },
      });

      return NextResponse.json({
        websiteId,
        campaigns: campaigns.map((campaign) => {
          const totalEmails = campaign.targets.reduce(
            (sum, t) => sum + t.outreachEmails.length,
            0
          );
          const openedEmails = campaign.targets.reduce(
            (sum, t) => sum + t.openCount,
            0
          );

          return {
            id: campaign.id,
            name: campaign.campaignName,
            niche: campaign.targetNiche,
            status: campaign.status,
            totalTargets: campaign.totalTargets,
            published: campaign.publishedCount,
            openRate:
              totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0,
            createdAt: campaign.createdAt,
          };
        }),
      });
    }
  } catch (error) {
    console.error('Guest posting data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest posting data' },
      { status: 500 }
    );
  }
}
