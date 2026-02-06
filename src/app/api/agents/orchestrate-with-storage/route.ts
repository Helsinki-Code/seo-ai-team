/**
 * Complete Orchestration API with Database Storage
 * Extracts keywords -> Researches SERP -> Generates content -> Stores EVERYTHING in database
 * NO mock data, everything is stored and retrieved from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  extractKeywordsFromContent,
  analyzeKeywordOpportunity,
} from '@/lib/agents/keywordExtractor';
import { analyzeSERPForKeyword } from '@/lib/agents/serpAnalysis';
import { generateRankingContent } from '@/lib/agents/contentGenerator';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface OrchestrationRequest {
  websiteId: number;
  websiteUrl: string;
  contentToAnalyze: string;
  maxKeywords?: number;
}

/**
 * POST /api/agents/orchestrate-with-storage
 * Full pipeline with database persistence
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const req: OrchestrationRequest = await request.json();
    const { websiteId, contentToAnalyze, maxKeywords = 15 } = req;

    // Verify website exists
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const results = {
      keywordsExtracted: [] as any[],
      serpResearched: [] as any[],
      contentGenerated: [] as any[],
      errors: [] as any[],
    };

    // STEP 1: Extract keywords and STORE in database
    console.log('[Orchestration] Starting keyword extraction...');
    let extractedKeywords: string[] = [];

    try {
      const extraction = await extractKeywordsFromContent(
        contentToAnalyze,
        website.url
      );
      extractedKeywords = extraction.allKeywords.slice(0, maxKeywords);

      // Store keywords in database
      for (const keyword of extractedKeywords) {
        const keywordRecord = await prisma.keyword.upsert({
          where: { websiteId_keyword: { websiteId, keyword } },
          update: { updatedAt: new Date() },
          create: {
            websiteId,
            keyword,
            type: 'primary', // Will be updated based on analysis
            extractedAt: new Date(),
          },
        });

        results.keywordsExtracted.push({
          id: keywordRecord.id,
          keyword: keywordRecord.keyword,
          storedAt: keywordRecord.extractedAt,
        });
      }
    } catch (error) {
      const errorMsg = `Keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push({ step: 'keyword_extraction', error: errorMsg });
    }

    // STEP 2: Research SERP and STORE results in database
    console.log('[Orchestration] Starting SERP research...');
    for (const keyword of extractedKeywords) {
      try {
        // Get keyword record from database
        const keywordRecord = await prisma.keyword.findUnique({
          where: { websiteId_keyword: { websiteId, keyword } },
        });

        if (!keywordRecord) continue;

        // Research SERP
        const serpData = await analyzeSERPForKeyword(keyword, website.url);

        // Store SERP research in database
        const serpResearch = await prisma.serpResearch.upsert({
          where: { keywordId: keywordRecord.id },
          update: {
            searchIntent: serpData.searchIntent,
            opportunityScore: serpData.opportunityScore,
            difficulty: serpData.difficulty,
            currentTopRankings: serpData.competitors,
            peopleAlsoAsk: serpData.peopleAlsoAsk,
            aiOverview: serpData.aiOverview,
            strategicInsights: serpData.strategicInsights,
            contentRecommendations: serpData.contentRecommendations,
            rankingFactors: serpData.rankingFactors,
            gaps: serpData.gaps,
            quickWins: serpData.quickWins,
            updatedAt: new Date(),
          },
          create: {
            keywordId: keywordRecord.id,
            searchIntent: serpData.searchIntent,
            opportunityScore: serpData.opportunityScore,
            difficulty: serpData.difficulty,
            currentTopRankings: serpData.competitors,
            peopleAlsoAsk: serpData.peopleAlsoAsk,
            aiOverview: serpData.aiOverview,
            strategicInsights: serpData.strategicInsights,
            contentRecommendations: serpData.contentRecommendations,
            rankingFactors: serpData.rankingFactors,
            gaps: serpData.gaps,
            quickWins: serpData.quickWins,
          },
        });

        // Update keyword with search intent
        await prisma.keyword.update({
          where: { id: keywordRecord.id },
          data: {
            searchIntent: serpData.searchIntent,
            monthlySearchVolume: serpData.searchVolume,
            searchDifficulty: serpData.difficulty,
          },
        });

        results.serpResearched.push({
          keywordId: keywordRecord.id,
          keyword,
          opportunity: serpData.opportunityScore,
          difficulty: serpData.difficulty,
          storedAt: serpResearch.researchedAt,
        });
      } catch (error) {
        const errorMsg = `SERP research failed for "${keyword}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push({ step: 'serp_research', keyword, error: errorMsg });
      }
    }

    // STEP 3: Generate content and STORE in database
    console.log('[Orchestration] Starting content generation...');
    for (const keyword of extractedKeywords.slice(0, 5)) {
      // Limit to 5 content pieces per run
      try {
        // Get complete keyword data
        const keywordRecord = await prisma.keyword.findUnique({
          where: { websiteId_keyword: { websiteId, keyword } },
          include: { serpResearch: true },
        });

        if (!keywordRecord?.serpResearch) continue;

        // Generate content
        const content = await generateRankingContent(
          keyword,
          keywordRecord.serpResearch.contentRecommendations || '',
          keywordRecord.serpResearch.rankingFactors || ''
        );

        // Get or create agent (SEO Director)
        const seoDirector = await prisma.agent.findFirst({
          where: { websiteId, agentType: 'content_strategy' },
        });

        const agentId =
          seoDirector?.id ||
          (
            await prisma.agent.create({
              data: {
                websiteId,
                agentType: 'content_strategy',
                status: 'idle',
              },
            })
          ).id;

        // Store content in database
        const contentPiece = await prisma.contentPiece.create({
          data: {
            websiteId,
            createdByAgentId: agentId,
            keyword,
            title: content.title,
            metaDescription: content.metaDescription,
            slug: content.slug,
            content: content.content,
            wordCount: content.wordCount,
            readingTime: Math.ceil(content.wordCount / 200),
            images: content.images,
            seoScore: content.seoScore,
            keywordDensity: content.keywordDensity,
            status: 'draft',
          },
        });

        results.contentGenerated.push({
          contentId: contentPiece.id,
          keyword,
          title: contentPiece.title,
          wordCount: contentPiece.wordCount,
          seoScore: contentPiece.seoScore,
          storedAt: contentPiece.generatedAt,
        });
      } catch (error) {
        const errorMsg = `Content generation failed for "${keyword}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push({
          step: 'content_generation',
          keyword,
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      websiteId,
      results,
      summary: {
        keywordsExtracted: results.keywordsExtracted.length,
        serpResearched: results.serpResearched.length,
        contentGenerated: results.contentGenerated.length,
        errors: results.errors.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Orchestration failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/orchestrate-with-storage?websiteId=X
 * Retrieve all stored data for website
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

    // Fetch all stored data
    const [keywords, contentPieces, rankings] = await Promise.all([
      prisma.keyword.findMany({
        where: { websiteId },
        include: { serpResearch: true },
      }),
      prisma.contentPiece.findMany({
        where: { websiteId },
      }),
      prisma.ranking.findMany({
        where: { websiteId },
      }),
    ]);

    return NextResponse.json({
      websiteId,
      data: {
        keywords: {
          total: keywords.length,
          items: keywords.map((k) => ({
            id: k.id,
            keyword: k.keyword,
            type: k.type,
            searchVolume: k.monthlySearchVolume,
            difficulty: k.searchDifficulty,
            intent: k.searchIntent,
            serpResearched: !!k.serpResearch,
            extractedAt: k.extractedAt,
          })),
        },
        content: {
          total: contentPieces.length,
          items: contentPieces.map((c) => ({
            id: c.id,
            keyword: c.keyword,
            title: c.title,
            status: c.status,
            wordCount: c.wordCount,
            seoScore: c.seoScore,
            publishedAt: c.publishedAt,
          })),
        },
        rankings: {
          total: rankings.length,
          recent: rankings
            .sort((a, b) => b.trackedAt.getTime() - a.trackedAt.getTime())
            .slice(0, 20),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}
