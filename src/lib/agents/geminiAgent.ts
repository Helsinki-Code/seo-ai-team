/**
 * Gemini 3.0 Flash Agent with Extended Thinking
 * Provides AI-powered reasoning for SEO agent decisions
 *
 * Uses Google's latest Gemini model with high-level thinking
 * for comprehensive analysis and decision-making
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const THINKING_CONFIG = {
  thinkingLevel: 'HIGH' as const,
};

const MODEL = 'gemini-3-flash-preview';

export interface AgentThought {
  thinking: string;
  decision: string;
  confidence: number;
  actionPlan: string[];
}

export interface AgentResponse {
  thought: AgentThought;
  response: string;
  actions: string[];
  metadata: {
    timestamp: number;
    model: string;
    thinkingTime?: number;
  };
}

/**
 * Execute an agent task with Gemini's extended thinking
 * Perfect for complex SEO decisions requiring deep analysis
 */
export async function executeAgentTask(
  agentRole: string,
  taskDescription: string,
  context: Record<string, any>
): Promise<AgentResponse> {
  const startTime = Date.now();

  const prompt = `
You are a specialized SEO agent: ${agentRole}

Your role and expertise:
${getRoleDescription(agentRole)}

Current Task: ${taskDescription}

Context Data:
${JSON.stringify(context, null, 2)}

Provide:
1. Your detailed thinking and analysis
2. Specific decision about what action to take
3. Confidence level (0-100)
4. Step-by-step action plan
5. Detailed explanation

Respond in JSON format:
{
  "thinking": "your detailed analysis",
  "decision": "the specific action you've decided to take",
  "confidence": 85,
  "actionPlan": ["step 1", "step 2", ...],
  "reasoning": "why this approach"
}
`;

  try {
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model: MODEL,
      config: THINKING_CONFIG,
      contents,
    });

    let fullText = '';
    let thinkingContent = '';

    for await (const chunk of response) {
      fullText += chunk.text || '';

      // Extract thinking blocks if present
      if (chunk.thinkingContent) {
        thinkingContent += chunk.thinkingContent;
      }
    }

    // Parse the JSON response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse agent response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      thought: {
        thinking: thinkingContent || parsed.thinking || '',
        decision: parsed.decision,
        confidence: parsed.confidence || 70,
        actionPlan: parsed.actionPlan || [],
      },
      response: parsed.reasoning || fullText,
      actions: parsed.actionPlan || [],
      metadata: {
        timestamp: Date.now(),
        model: MODEL,
        thinkingTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error('Agent execution error:', error);
    throw new Error(
      `Agent task failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Analyze SEO data and generate insights
 */
export async function analyzeWebsiteData(
  websiteUrl: string,
  data: Record<string, any>
): Promise<string> {
  const prompt = `
Analyze this website's SEO data and provide actionable insights:

URL: ${websiteUrl}

Data:
${JSON.stringify(data, null, 2)}

Provide:
1. Top 5 immediate issues to fix
2. Quick wins (can implement in < 1 hour)
3. Long-term strategy recommendations
4. Estimated impact for each recommendation

Be specific and data-driven. Prioritize by potential impact.
`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  let analysis = '';
  const response = await ai.models.generateContentStream({
    model: MODEL,
    config: THINKING_CONFIG,
    contents,
  });

  for await (const chunk of response) {
    analysis += chunk.text || '';
  }

  return analysis;
}

/**
 * Generate content optimization suggestions
 */
export async function optimizeContent(
  title: string,
  content: string,
  targetKeyword: string
): Promise<{
  optimizedTitle: string;
  keywordSuggestions: string[];
  contentImprovements: string[];
  estimatedBoost: string;
}> {
  const prompt = `
Optimize this content for SEO:

Title: ${title}
Target Keyword: ${targetKeyword}

Current Content: ${content}

Provide optimization in JSON:
{
  "optimizedTitle": "better title with keyword",
  "keywordSuggestions": ["related keyword 1", "related keyword 2"],
  "contentImprovements": ["improvement 1", "improvement 2"],
  "estimatedBoost": "Estimated 15-30% CTR increase"
}
`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  let result = '';
  const response = await ai.models.generateContentStream({
    model: MODEL,
    config: THINKING_CONFIG,
    contents,
  });

  for await (const chunk of response) {
    result += chunk.text || '';
  }

  const jsonMatch = result.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

function getRoleDescription(agentRole: string): string {
  const roles: Record<string, string> = {
    technical_seo: `
      Technical SEO Specialist
      - Audit website performance, speed, mobile-friendliness
      - Fix crawlability issues, indexing problems
      - Implement schema markup and structured data
      - Optimize Core Web Vitals
      - Ensure HTTPS, clean URLs, proper redirects
    `,
    content_strategy: `
      Content Strategy Director
      - Analyze keyword opportunities and search intent
      - Plan content calendar based on seasonality
      - Identify content gaps vs competitors
      - Determine content formats (blog, video, infographic)
      - Prioritize based on traffic potential and difficulty
    `,
    content_creator: `
      Content Creation Agent
      - Write SEO-optimized articles and blog posts
      - Create meta titles and descriptions
      - Structure content for readability and SEO
      - Incorporate keywords naturally
      - Ensure E-A-T (Expertise, Authority, Trustworthiness)
    `,
    link_builder: `
      Link Building Specialist
      - Identify high-quality link opportunities
      - Research relevant domains for outreach
      - Craft outreach campaigns
      - Monitor backlink profile
      - Identify and disavow toxic links
    `,
    analyst: `
      SEO Analytics Agent
      - Track keyword rankings over time
      - Monitor organic traffic trends
      - Analyze competitor strategies
      - Generate performance reports
      - Identify quick wins and opportunities
    `,
  };

  return roles[agentRole] || 'SEO Agent';
}

export async function streamAgentResponse(
  agentRole: string,
  task: string,
  onChunk: (text: string) => void
): Promise<void> {
  const prompt = `
As a ${agentRole}, handle this task:
${task}

Provide real-time actionable insights.
`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const response = await ai.models.generateContentStream({
    model: MODEL,
    config: THINKING_CONFIG,
    contents,
  });

  for await (const chunk of response) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
}
