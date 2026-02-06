/**
 * Monetization Data API
 * Fetches REAL monetization data from database and affiliate networks
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/data/monetization?websiteId=X
 * Get monetization overview with real data from database
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const websiteId = parseInt(searchParams.get('websiteId') || '0');

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId required' },
        { status: 400 }
      );
    }

    // Get monetization config
    const config = await prisma.monetizationConfig.findUnique({
      where: { websiteId },
    });

    // Get affiliate revenues for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const affiliateRevenues = await prisma.affiliateRevenue.findMany({
      where: {
        configId: config?.id,
        recordedDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Calculate totals by source
    const revenueBySource = affiliateRevenues.reduce(
      (acc, rev) => {
        if (!acc[rev.source]) {
          acc[rev.source] = { revenue: 0, clicks: 0, conversions: 0 };
        }
        acc[rev.source].revenue += Number(rev.amount);
        acc[rev.source].clicks += rev.clicks;
        acc[rev.source].conversions += rev.conversions;
        return acc;
      },
      {} as Record<string, { revenue: number; clicks: number; conversions: number }>
    );

    // Get email list data
    const emailLists = config
      ? await prisma.emailList.findMany({
          where: { configId: config.id },
        })
      : [];

    const totalSubscribers = emailLists.reduce(
      (sum, list) => sum + list.subscriberCount,
      0
    );
    const totalGrowth = emailLists.reduce(
      (sum, list) => sum + list.growthRate,
      0
    );

    // Calculate totals
    const monthlyRevenue = Object.values(revenueBySource).reduce(
      (sum, r) => sum + r.revenue,
      0
    );
    const totalClicks = Object.values(revenueBySource).reduce(
      (sum, r) => sum + r.clicks,
      0
    );
    const totalConversions = Object.values(revenueBySource).reduce(
      (sum, r) => sum + r.conversions,
      0
    );

    return NextResponse.json({
      websiteId,
      monetization: {
        monthly: {
          revenue: monthlyRevenue,
          clicks: totalClicks,
          conversions: totalConversions,
          conversionRate:
            totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        },
        annual: {
          revenue: monthlyRevenue * 12,
        },
        bySource: revenueBySource,
      },
      emailLists: {
        totalSubscribers,
        monthlyGrowth: totalGrowth,
        lists: emailLists.map((list) => ({
          id: list.id,
          provider: list.provider,
          subscribers: list.subscriberCount,
          growthRate: list.growthRate,
        })),
      },
      adSense: {
        enabled: config?.googleAdSenseId ? true : false,
        publisherId: config?.googleAdSenseId,
      },
      configured: {
        amazon: config?.amazonPartnerId ? true : false,
        shareASale: config?.shareASaleAffiliateId ? true : false,
        cjAffiliate: config?.cjPublisherId ? true : false,
        clickBank: config?.clickBankAccountName ? true : false,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Monetization data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monetization data' },
      { status: 500 }
    );
  }
}
