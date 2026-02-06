/**
 * Publishing API with Database Storage
 * Publishes content and stores all publication data in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { publishToWordPress } from '@/lib/integrations/wordpressPublisher';
import { publishToLinkedIn } from '@/lib/integrations/linkedinPublisher';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface PublishRequest {
  websiteId: number;
  contentPieceIds: number[];
  channels: Array<{
    type: 'wordpress' | 'linkedin';
    config: {
      siteUrl?: string;
      username?: string;
      appPassword?: string;
      accessToken?: string;
      personId?: string;
    };
  }>;
}

/**
 * POST /api/agents/publish-with-storage
 * Publish content and store results in database
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const req: PublishRequest = await request.json();
    const { websiteId, contentPieceIds, channels } = req;

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const publishResults = {
      success: [] as any[],
      failed: [] as any[],
    };

    // Get content pieces
    const contentPieces = await prisma.contentPiece.findMany({
      where: { id: { in: contentPieceIds } },
    });

    for (const contentPiece of contentPieces) {
      for (const channel of channels) {
        try {
          if (channel.type === 'wordpress') {
            const result = await publishToWordPress(
              {
                siteUrl: channel.config.siteUrl!,
                username: channel.config.username!,
                appPassword: channel.config.appPassword!,
              },
              {
                title: contentPiece.title,
                content: contentPiece.content,
                excerpt: contentPiece.metaDescription || '',
                slug: contentPiece.slug || '',
                featuredImageUrl: undefined,
                images: contentPiece.images as any,
                tags: [contentPiece.keyword],
                seoMetadata: {
                  metaDescription: contentPiece.metaDescription || '',
                  focusKeyword: contentPiece.keyword,
                },
              }
            );

            // Store WordPress publication data in database
            const updated = await prisma.contentPiece.update({
              where: { id: contentPiece.id },
              data: {
                publishedUrl: result.url,
                wordPressPostId: result.postId,
                publishedAt: new Date(),
                status: 'published',
              },
            });

            publishResults.success.push({
              contentId: contentPiece.id,
              channel: 'wordpress',
              postId: result.postId,
              url: result.url,
              status: result.status,
              publishedAt: updated.publishedAt,
            });
          } else if (channel.type === 'linkedin') {
            const result = await publishToLinkedIn(
              {
                accessToken: channel.config.accessToken!,
                personId: channel.config.personId,
              },
              {
                content: contentPiece.content.substring(0, 3000),
                title: contentPiece.title,
                articleUrl: contentPiece.publishedUrl || undefined,
                description: contentPiece.metaDescription,
              }
            );

            // Store LinkedIn publication data in database
            const updated = await prisma.contentPiece.update({
              where: { id: contentPiece.id },
              data: {
                linkedInPostId: result.postId,
                status: 'published',
              },
            });

            publishResults.success.push({
              contentId: contentPiece.id,
              channel: 'linkedin',
              postId: result.postId,
              url: result.url,
              status: result.status,
            });
          }
        } catch (error) {
          publishResults.failed.push({
            contentId: contentPiece.id,
            channel: channel.type,
            error:
              error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      websiteId,
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
 * GET /api/agents/publish-with-storage?websiteId=X
 * Get all published content from database
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

    const published = await prisma.contentPiece.findMany({
      where: { websiteId, status: 'published' },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({
      websiteId,
      total: published.length,
      published: published.map((p) => ({
        id: p.id,
        keyword: p.keyword,
        title: p.title,
        wordCount: p.wordCount,
        publishedUrl: p.publishedUrl,
        wordPressPostId: p.wordPressPostId,
        linkedInPostId: p.linkedInPostId,
        publishedAt: p.publishedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Published content retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve published content' },
      { status: 500 }
    );
  }
}
