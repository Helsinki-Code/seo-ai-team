/**
 * Agent Orchestration API
 * Coordinates the complete SEO workflow:
 * 1. Website Analysis → 2. Keyword Extraction → 3. SERP Research → 4. Content Generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractKeywordsFromContent } from '@/lib/agents/keywordExtractor';
import {
  generateResearchReports,
  generateOptimizedTitle,
  generateArticleOutline,
} from '@/lib/agents/serpAnalysis';
import { generateRankingContent } from '@/lib/agents/contentGenerator';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface OrchestrationRequest {
  websiteUrl: string;
  websiteContent: string;
  industry: string;
  targetAudience: string;
  businessContext: string;
  businessType: string;
}

interface OrchestrationResponse {
  stage: string;
  status: 'in_progress' | 'completed' | 'error';
  data?: any;
  error?: string;
  progress: number;
}

/**
 * POST /api/agents/orchestrate
 * Start the complete SEO content generation pipeline
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

    const body: OrchestrationRequest = await request.json();

    // Stage 1: Extract Keywords
    console.log('[Stage 1] Extracting keywords from content...');
    const extractedKeywords = await extractKeywordsFromContent(
      body.websiteContent,
      body.industry,
      body.targetAudience
    );

    // Stage 2: Generate SERP Research Reports
    console.log('[Stage 2] Generating SERP research reports...');
    const researchReports = await generateResearchReports(
      extractedKeywords.allKeywords.slice(0, 15), // Limit to 15 keywords for production
      body.industry,
      body.businessType
    );

    // Stage 3: Generate Content for Each Keyword
    console.log('[Stage 3] Generating ranking content...');
    const generatedContent = [];

    for (let i = 0; i < researchReports.length; i++) {
      const report = researchReports[i];
      const content = await generateRankingContent(
        report.keyword,
        report,
        body.businessContext
      );

      // Generate article outline
      const outline = await generateArticleOutline(report.keyword, report);

      generatedContent.push({
        keyword: report.keyword,
        research: report,
        content,
        outline,
      });

      // Delay to avoid rate limiting
      if (i < researchReports.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      stage: 'completed',
      status: 'completed',
      progress: 100,
      data: {
        keywords: extractedKeywords,
        researchReports,
        generatedContent,
        summary: {
          totalKeywordsExtracted: extractedKeywords.allKeywords.length,
          totalArticlesGenerated: generatedContent.length,
          estimatedTraffic: researchReports.reduce(
            (sum, r) => sum + parseInt(r.estimatedTraffic.split('-')[0]) || 0,
            0
          ),
          averageOpportunityScore:
            Math.round(
              researchReports.reduce((sum, r) => sum + r.opportunityScore, 0) /
                researchReports.length
            ) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      {
        stage: 'error',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Stream orchestration progress
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return headers for streaming
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Simulate progress updates
        const stages = [
          { stage: 'Extracting keywords', progress: 20 },
          { stage: 'Analyzing SERPs', progress: 40 },
          { stage: 'Researching competitors', progress: 60 },
          { stage: 'Generating content', progress: 80 },
          { stage: 'Optimizing images', progress: 100 },
        ];

        for (const { stage, progress } of stages) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ stage, progress })}\n\n`
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
