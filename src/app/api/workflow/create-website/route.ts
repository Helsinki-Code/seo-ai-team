/**
 * Create Website API
 * Actually creates website in database when user submits URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

interface CreateWebsiteRequest {
  url: string;
}

/**
 * POST /api/workflow/create-website
 * Create a website and return its ID
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const req: CreateWebsiteRequest = await request.json();
    const { url } = req;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let domainName: string;
    try {
      const parsedUrl = new URL(url);
      domainName = parsedUrl.hostname;
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Get user's default organization (create if doesn't exist)
    let org = await prisma.organization.findFirst({
      where: {
        owner: {
          clerkId: userId,
        },
      },
    });

    if (!org) {
      // Get or create user
      let user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        // Auto-create user on first use
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: 'user@example.com',
            name: 'User',
          },
        });
      }

      org = await prisma.organization.create({
        data: {
          name: `${domainName} Organization`,
          ownerId: user.id,
        },
      });
    }

    // Check if website already exists
    let website = await prisma.website.findFirst({
      where: {
        organizationId: org.id,
        url,
      },
    });

    // Create website if it doesn't exist
    if (!website) {
      website = await prisma.website.create({
        data: {
          organizationId: org.id,
          url,
          domainName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      website: {
        id: website.id,
        url: website.url,
        domainName: website.domainName,
        createdAt: website.createdAt,
      },
    });
  } catch (error) {
    console.error('Website creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create website',
      },
      { status: 500 }
    );
  }
}
