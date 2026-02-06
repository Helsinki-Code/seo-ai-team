/**
 * Email Tracking Data API
 * Fetches REAL email tracking data from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/data/email-tracking?websiteId=X&type=outreach|newsletter
 * Get email tracking stats and history
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const websiteId = parseInt(searchParams.get('websiteId') || '0');
    const type = searchParams.get('type') || 'outreach'; // 'outreach' or 'newsletter'

    if (!websiteId) {
      return NextResponse.json(
        { error: 'websiteId required' },
        { status: 400 }
      );
    }

    if (type === 'outreach') {
      // Get outreach emails from guest posting campaigns
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

      const allOutreachEmails = campaigns.flatMap((campaign) =>
        campaign.targets.flatMap((target) => target.outreachEmails)
      );

      // Calculate metrics
      const total = allOutreachEmails.length;
      const delivered = allOutreachEmails.filter(
        (e) => e.deliveredAt
      ).length;
      const opened = allOutreachEmails.filter((e) => e.openedAt).length;
      const clicked = allOutreachEmails.filter((e) => e.clickedAt).length;
      const replied = allOutreachEmails.filter((e) => e.repliedAt).length;

      // Sentiment analysis
      const sentiments = allOutreachEmails.reduce(
        (acc, email) => {
          if (email.sentiment) {
            acc[email.sentiment] = (acc[email.sentiment] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Get recent emails
      const recentEmails = allOutreachEmails
        .sort(
          (a, b) =>
            new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        )
        .slice(0, 20)
        .map((email) => ({
          id: email.id,
          recipient: email.recipientEmail,
          subject: email.subject,
          status: email.status,
          sent: email.sentAt,
          opened: email.openedAt,
          clicked: email.clickedAt,
          reply: email.repliedAt,
          sentiment: email.sentiment,
        }));

      return NextResponse.json({
        websiteId,
        type: 'outreach',
        metrics: {
          total,
          delivered,
          deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
          opened,
          openRate: total > 0 ? (opened / total) * 100 : 0,
          clicked,
          clickRate: total > 0 ? (clicked / total) * 100 : 0,
          replied,
          replyRate: total > 0 ? (replied / total) * 100 : 0,
        },
        sentiment: sentiments,
        recent: recentEmails,
      });
    } else if (type === 'newsletter') {
      // Get newsletter emails from email lists
      const emailLists = await prisma.emailList.findMany({
        include: {
          trackingRecords: {
            orderBy: { sentAt: 'desc' },
          },
        },
      });

      const allNewsletterEmails = emailLists.flatMap(
        (list) => list.trackingRecords
      );

      // Calculate metrics
      const total = allNewsletterEmails.length;
      const opened = allNewsletterEmails.filter((e) => e.openedAt).length;
      const clicked = allNewsletterEmails.filter((e) => e.clickedAt).length;
      const replied = allNewsletterEmails.filter((e) => e.repliedAt).length;

      // Sentiment analysis
      const sentiments = allNewsletterEmails.reduce(
        (acc, email) => {
          if (email.sentiment) {
            acc[email.sentiment] = (acc[email.sentiment] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Get recent emails
      const recentEmails = allNewsletterEmails
        .slice(0, 20)
        .map((email) => ({
          id: email.id,
          recipient: email.recipientEmail,
          subject: email.subject,
          status: email.status,
          sent: email.sentAt,
          opened: email.openedAt,
          clicked: email.clickedAt,
          reply: email.repliedAt,
          sentiment: email.sentiment,
        }));

      return NextResponse.json({
        websiteId,
        type: 'newsletter',
        metrics: {
          total,
          opened,
          openRate: total > 0 ? (opened / total) * 100 : 0,
          clicked,
          clickRate: total > 0 ? (clicked / total) * 100 : 0,
          replied,
          replyRate: total > 0 ? (replied / total) * 100 : 0,
        },
        sentiment: sentiments,
        recent: recentEmails,
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Email tracking data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email tracking data' },
      { status: 500 }
    );
  }
}
