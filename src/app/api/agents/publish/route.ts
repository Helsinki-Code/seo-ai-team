/**
 * Automated Content Publishing API
 * Publishes generated content to WordPress and LinkedIn
 * Handles scheduling and multi-channel distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { publishToWordPress } from '@/lib/integrations/wordpressPublisher';
import {
  publishToLinkedIn,
  publishToLinkedInCompanyPage,
  generateLinkedInVariations,
} from '@/lib/integrations/linkedinPublisher';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PublishRequest {
  contentId: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  keyword: string;
  channels: Array<{
    type: 'wordpress' | 'linkedin' | 'linkedin-company';
    config: {
      // WordPress config
      siteUrl?: string;
      username?: string;
      appPassword?: string;
      // LinkedIn config
      accessToken?: string;
      personId?: string;
      organizationId?: string;
    };
    publishSchedule?: Date;
  }>;
  images: Array<{
    url: string;
    altText: string;
    caption?: string;
  }>;
  featuredImageUrl?: string;
  seoMetadata?: {
    metaDescription: string;
    focusKeyword: string;
  };
}

/**
 * POST /api/agents/publish
 * Publish content to selected channels
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

    const publishRequest: PublishRequest = await request.json();

    const publishResults = {
      success: [] as any[],
      failed: [] as any[],
    };

    // Publish to each channel
    for (const channel of publishRequest.channels) {
      try {
        if (channel.type === 'wordpress') {
          const result = await publishToWordPress(
            {
              siteUrl: channel.config.siteUrl!,
              username: channel.config.username!,
              appPassword: channel.config.appPassword!,
            },
            {
              title: publishRequest.title,
              content: publishRequest.content,
              excerpt: publishRequest.excerpt,
              slug: publishRequest.slug,
              featuredImageUrl: publishRequest.featuredImageUrl,
              images: publishRequest.images,
              tags: [publishRequest.keyword],
              publishSchedule: channel.publishSchedule,
              seoMetadata: publishRequest.seoMetadata,
            }
          );

          publishResults.success.push({
            channel: 'wordpress',
            postId: result.postId,
            url: result.url,
            status: result.status,
          });
        }

        if (channel.type === 'linkedin') {
          const result = await publishToLinkedIn(
            {
              accessToken: channel.config.accessToken!,
              personId: channel.config.personId,
            },
            {
              content: publishRequest.content,
              title: publishRequest.title,
              articleUrl: publishRequest.featuredImageUrl
                ? `${channel.config.siteUrl}/${publishRequest.slug}`
                : undefined,
              description: publishRequest.excerpt,
              imageUrl: publishRequest.featuredImageUrl,
            }
          );

          publishResults.success.push({
            channel: 'linkedin',
            postId: result.postId,
            url: result.url,
            status: result.status,
          });
        }

        if (channel.type === 'linkedin-company') {
          const result = await publishToLinkedInCompanyPage(
            {
              accessToken: channel.config.accessToken!,
              organizationId: channel.config.organizationId,
            },
            {
              content: publishRequest.content,
              title: publishRequest.title,
              articleUrl: `${channel.config.siteUrl}/${publishRequest.slug}`,
              description: publishRequest.excerpt,
              imageUrl: publishRequest.featuredImageUrl,
            }
          );

          publishResults.success.push({
            channel: 'linkedin-company',
            postId: result.postId,
            url: result.url,
            status: result.status,
          });
        }
      } catch (error) {
        publishResults.failed.push({
          channel: channel.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      contentId: publishRequest.contentId,
      publishResults,
      successCount: publishResults.success.length,
      failureCount: publishResults.failed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Publishing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Publishing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/publish/variations
 * Get LinkedIn post variations for the same content
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
    const title = searchParams.get('title') || '';
    const articleUrl = searchParams.get('articleUrl') || '';
    const keywords = searchParams.getAll('keywords') || [];

    const variations = generateLinkedInVariations(
      title,
      articleUrl,
      keywords
    );

    return NextResponse.json({
      variations,
      count: variations.length,
    });
  } catch (error) {
    console.error('Variation generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate variations',
      },
      { status: 500 }
    );
  }
}
