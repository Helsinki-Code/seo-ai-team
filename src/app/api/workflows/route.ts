import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/workflows
 * Retrieve user's recent workflows
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-create user if doesn't exist
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizations: {
          include: {
            websites: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!user) {
      // Create user on first login
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: 'user@example.com', // This will be updated by webhook later
          name: 'User',
        },
        include: {
          organizations: {
            include: {
              websites: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      });
    }

    const workflows = user.organizations.flatMap((org) =>
      org.websites.map((website) => ({
        id: website.id,
        websiteUrl: website.url,
        status: 'completed' as const,
        keywordCount: 0,
        createdAt: website.createdAt,
        progress: 100,
      }))
    );

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}
