/**
 * Guest Posting API with Database Storage
 * Discovers opportunities, sends outreach, tracks results - ALL stored in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  findGuestPostingOpportunities,
  generateOutreachEmails,
  sendGuestPostOutreach,
} from '@/lib/agents/guestPostAutomation';
import { initializeSMTP } from '@/lib/integrations/smtpOutreach';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long-running guest posting tasks

interface GuestPostingRequest {
  websiteId: number;
  campaignName: string;
  niche: string;
  keywords: string[];
  yourBrand: string;
  articleTitle: string;
  articleUrl: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
}

/**
 * POST /api/agents/guest-posting-with-storage
 * Discover opportunities, generate outreach, send emails - STORE EVERYTHING in database
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const req: GuestPostingRequest = await request.json();
    const {
      websiteId,
      campaignName,
      niche,
      keywords,
      yourBrand,
      articleTitle,
      articleUrl,
      smtpConfig,
    } = req;

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Create campaign in database
    const campaign = await prisma.guestPostingCampaign.create({
      data: {
        websiteId,
        campaignName,
        targetNiche: niche,
        status: 'planning',
      },
    });

    const results = {
      campaignId: campaign.id,
      opportunitiesDiscovered: 0,
      outreachSent: 0,
      errors: [] as any[],
    };

    try {
      // STEP 1: Discover guest posting opportunities
      console.log('[Guest Posting] Discovering opportunities...');
      const opportunities = await findGuestPostingOpportunities(niche, keywords);

      // Store targets in database
      for (const opportunity of opportunities) {
        await prisma.guestPostingTarget.create({
          data: {
            campaignId: campaign.id,
            domain: opportunity.domain,
            domainAuthority: opportunity.domainAuthority,
            relevanceScore: opportunity.relevanceScore,
            contactEmail: opportunity.contactEmail,
            guestPostUrl: opportunity.guestPostUrl,
            guidelinesUrl: opportunity.guidelinesUrl,
            guidelinesContent: opportunity.guidelinesContent,
            estimatedMonthlyTraffic: opportunity.estimatedMonthlyTraffic,
            priority: opportunity.priority,
            status: 'researched',
            discoveredAt: opportunity.discovered,
          },
        });

        results.opportunitiesDiscovered++;
      }

      // Update campaign with target count
      await prisma.guestPostingCampaign.update({
        where: { id: campaign.id },
        data: {
          totalTargets: results.opportunitiesDiscovered,
          researchedCount: results.opportunitiesDiscovered,
        },
      });

      // STEP 2: Generate personalized outreach emails
      console.log('[Guest Posting] Generating outreach emails...');
      const targets = await prisma.guestPostingTarget.findMany({
        where: { campaignId: campaign.id },
      });

      const outreachEmails = await generateOutreachEmails(
        yourBrand,
        articleTitle,
        articleUrl,
        targets as any
      );

      // STEP 3: Send outreach emails via SMTP
      if (smtpConfig) {
        console.log('[Guest Posting] Sending outreach emails...');
        const transporter = initializeSMTP(smtpConfig);

        for (const target of targets) {
          try {
            const email = outreachEmails[target.domain];
            if (!email) continue;

            // Parse email (assuming format: "Subject: ...\n\nBody: ...")
            const [subjectLine, ...bodyLines] = email.split('\n');
            const subject = subjectLine.replace('Subject: ', '').trim();
            const body = bodyLines.join('\n').trim();

            // Send via SMTP
            await sendGuestPostOutreach(
              'gmail',
              target.contactEmail || 'contact@example.com',
              subject,
              body,
              articleUrl
            );

            // Store outreach email in database
            const messageId = `gp_${campaign.id}_${target.id}_${Date.now()}`;
            await prisma.outreachEmail.create({
              data: {
                targetId: target.id,
                messageId,
                recipientEmail: target.contactEmail || 'unknown@example.com',
                subject,
                body,
                status: 'sent',
              },
            });

            // Update target with outreach count
            await prisma.guestPostingTarget.update({
              where: { id: target.id },
              data: {
                outreachCount: { increment: 1 },
                status: 'outreached',
              },
            });

            results.outreachSent++;
          } catch (error) {
            const errorMsg = `Failed to send outreach to ${target.domain}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            results.errors.push({ target: target.domain, error: errorMsg });
          }
        }
      }

      // Update campaign status
      await prisma.guestPostingCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'in_progress',
          outreachedCount: results.outreachSent,
        },
      });
    } catch (error) {
      results.errors.push({
        step: 'guest_posting_automation',
        error:
          error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json({
      websiteId,
      campaign: {
        id: campaign.id,
        name: campaign.campaignName,
        status: campaign.status,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Guest posting error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Guest posting failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/guest-posting-with-storage?websiteId=X&campaignId=X
 * Get guest posting campaign data from database
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
      // Get specific campaign with all targets and emails
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
        },
        targets: campaign.targets.map((target) => ({
          id: target.id,
          domain: target.domain,
          authority: target.domainAuthority,
          relevance: Number(target.relevanceScore),
          status: target.status,
          contactEmail: target.contactEmail,
          outreachCount: target.outreachCount,
          opens: target.openCount,
          clicks: target.clickCount,
          replies: target.replyCount,
          published: target.published,
          emails: target.outreachEmails.map((email) => ({
            id: email.id,
            subject: email.subject,
            sent: email.sentAt,
            status: email.status,
          })),
        })),
      });
    } else {
      // Get all campaigns
      const campaigns = await prisma.guestPostingCampaign.findMany({
        where: { websiteId },
        include: {
          targets: true,
        },
      });

      return NextResponse.json({
        websiteId,
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.campaignName,
          niche: c.targetNiche,
          status: c.status,
          totalTargets: c.totalTargets,
          outreached: c.outreachedCount,
          published: c.publishedCount,
          createdAt: c.createdAt,
        })),
      });
    }
  } catch (error) {
    console.error('Campaign retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve campaign data' },
      { status: 500 }
    );
  }
}
