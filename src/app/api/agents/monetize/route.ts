/**
 * Monetization API
 * Generates monetization strategy and manages affiliate networks
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  generateMonetizationStrategy,
  getAffiliatePerformance,
  insertAffiliateLinksIntoContent,
} from '@/lib/agents/monetizationAutomation';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface MonetizeRequest {
  contentId: string;
  contentTitle: string;
  contentBody: string;
  keywords: string[];
  affiliateConfigs: {
    amazon?: {
      partnerId: string;
      secretKey: string;
      publicKey: string;
      region: string;
    };
    shareASale?: {
      affiliateId: string;
      apiToken: string;
      apiSecret: string;
    };
    cjAffiliate?: {
      apiKey: string;
      publisherId: string;
    };
    clickBank?: {
      accountNickname: string;
      apiKey: string;
    };
    googleAdSense?: {
      publisherId: string;
      clientId: string;
      clientSecret: string;
      refreshToken: string;
      siteUrl: string;
    };
    emailProvider?: {
      provider: 'convertkit' | 'fluentcrm' | 'mailchimp';
      config: Record<string, string>;
    };
  };
  placement?: 'inline' | 'footer' | 'sidebar';
}

/**
 * POST /api/agents/monetize
 * Generate monetization strategy for content
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

    const monetizeRequest: MonetizeRequest = await request.json();

    // Generate monetization strategy
    const strategy = await generateMonetizationStrategy(
      monetizeRequest.contentId,
      monetizeRequest.contentTitle,
      monetizeRequest.keywords,
      {
        amazon: monetizeRequest.affiliateConfigs.amazon,
        shareASale: monetizeRequest.affiliateConfigs.shareASale,
        cjAffiliate: monetizeRequest.affiliateConfigs.cjAffiliate,
        clickBank: monetizeRequest.affiliateConfigs.clickBank,
        googleAdSense: monetizeRequest.affiliateConfigs.googleAdSense,
        emailProvider: monetizeRequest.affiliateConfigs.emailProvider,
      }
    );

    // Insert affiliate links into content
    const placement = monetizeRequest.placement || 'inline';
    const { modifiedContent, insertedLinks } =
      insertAffiliateLinksIntoContent(
        monetizeRequest.contentBody,
        strategy.products,
        placement
      );

    return NextResponse.json({
      contentId: monetizeRequest.contentId,
      strategy,
      modifiedContent,
      insertedLinksCount: insertedLinks,
      earnings: {
        estimated: {
          monthly: strategy.estimatedMonthlyRevenue,
          yearly: strategy.estimatedMonthlyRevenue * 12,
        },
        breakdown: {
          affiliate: strategy.estimatedMonthlyRevenue * 0.7,
          adSense: strategy.adSenseEnabled
            ? strategy.estimatedMonthlyRevenue * 0.2
            : 0,
          email: strategy.emailCaptureEnabled
            ? strategy.estimatedMonthlyRevenue * 0.1
            : 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Monetization error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Monetization failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/monetize/performance
 * Get real affiliate performance data
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
    const shareASaleConfig = searchParams.get('shareAsaleConfig');
    const clickBankConfig = searchParams.get('clickBankConfig');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const configs = {
      shareASale: shareASaleConfig ? JSON.parse(shareASaleConfig) : undefined,
      clickBank: clickBankConfig ? JSON.parse(clickBankConfig) : undefined,
    };

    const dateRange =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined;

    const performance = await getAffiliatePerformance(configs, dateRange);

    return NextResponse.json({
      performance,
      summary: {
        totalRevenue: performance.totalRevenue,
        averageConversionRate:
          performance.totalClicks > 0
            ? (performance.totalConversions / performance.totalClicks) * 100
            : 0,
        conversionValue:
          performance.totalConversions > 0
            ? performance.totalRevenue / performance.totalConversions
            : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Performance fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch performance data',
      },
      { status: 500 }
    );
  }
}
