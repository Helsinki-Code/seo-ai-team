
import { GoogleGenAI, Type, GenerateContentResponse, Schema } from "@google/genai";
import { KeywordMetric, SerpResult, CompetitorData, GeneratedArticle, ContentStrategy, LinkSuggestion, BulkRankResponse, GroundingChunk, AnalyticsMetric, PagePerformance } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Exponential Backoff Retry ---
const withRetry = async <T>(operation: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota');
    const isServerOverload = error.status === 503 || error.code === 503;
    
    if (retries > 0 && (isRateLimit || isServerOverload)) {
      const delay = baseDelay * (Math.pow(2, 3 - retries)); // 2000, 4000, 8000
      console.warn(`API Rate Limit hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, baseDelay);
    }
    throw error;
  }
};

// --- Helper: Clean JSON ---
const cleanAndParseJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parse Error", e);
    return null;
  }
};

// --- Helper: Sanitize Content (Remove Base64 Images) ---
const sanitizeContentForContext = (content: string): string => {
    // Replace markdown images containing data:image with a placeholder to save tokens
    return content.replace(/!\[(.*?)\]\(data:image\/.*?\)/g, '![$1]([IMAGE_PLACEHOLDER_REMOVED_TO_SAVE_TOKENS])');
};

// --- Keyword Research Agent ---
export const analyzeWebsiteContent = async (url: string): Promise<{ pages: string[], keywords: KeywordMetric[] }> => {
  const model = "gemini-3-flash-preview"; 
  
  const prompt = `
    You are an elite SEO Crawler Agent. 
    Use Google Search to analyze the actual content, authority, and structure of the website: ${url}.
    
    Task 1: Search for "site:${url}" to identify indexed pages and understand the site's niche/topic authority. List up to 20 actual URL paths.
    Task 2: Identify 15 high-value keywords (mix of short and long-tail) this site SHOULD rank for based on its actual content.
    Task 3: Estimate Search Volume (monthly) and Difficulty (0-100) based on real-time data or your knowledge base.
    
    Output JSON format:
    {
      "pages": ["/about", "/blog/...", ...],
      "keywords": [
        { "keyword": "string", "volume": number, "difficulty": number, "cpc": number, "intent": "Informational|Commercial", "category": "string" }
      ]
    }
  `;

  try {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    }));
    const data = cleanAndParseJSON(response.text || "");
    return data || { pages: [], keywords: [] };
  } catch (error) {
    console.error("Keyword Analysis Failed", error);
    return { pages: [], keywords: [] };
  }
};

// --- SERP Analysis Agent ---
export const performSerpAnalysis = async (keyword: string): Promise<SerpResult> => {
  const model = "gemini-3-flash-preview"; 

  const prompt = `
    Perform a deep real-time SERP analysis for the keyword: "${keyword}".
    Use Google Search to fetch the LATEST live results.
    
    1. Generate a realistic "AI Overview" text that Google is currently showing or might show.
    2. List 7-10 "People Also Ask" questions from the actual SERP (MANDATORY).
    3. Identify 3 major competitors ranking NOW for this term.
    4. Provide strategic insight on how to outrank them based on their current content gaps.
    5. ESTIMATE Domain Authority (DA) and Traffic for competitors based on available public signals.
    
    Output JSON:
    {
      "keyword": "${keyword}",
      "aiOverview": "string",
      "peopleAlsoAsk": ["q1", "q2"...],
      "competitors": [
        { "domain": "competitor.com", "rank": 1, "estimatedTraffic": 5000, "domainAuthority": 85, "rankingChange": 0 }
      ],
      "opportunityScore": 85,
      "strategicInsight": "string",
      "group": "Topic Cluster Name"
    }
  `;

  try {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    }));

    const data = cleanAndParseJSON(response.text || "") || {};
    
    return { 
      keyword, 
      aiOverview: data.aiOverview || "AI Overview unavailable.",
      peopleAlsoAsk: Array.isArray(data.peopleAlsoAsk) ? data.peopleAlsoAsk : [],
      competitors: Array.isArray(data.competitors) ? data.competitors : [],
      opportunityScore: data.opportunityScore || 0,
      strategicInsight: data.strategicInsight || "No insights generated.",
      group: data.group || "General",
      timestamp: Date.now() 
    };
  } catch (e) {
    console.error("SERP Analysis Failed", e);
    return {
      keyword,
      aiOverview: "Analysis failed.",
      peopleAlsoAsk: [],
      competitors: [],
      opportunityScore: 0,
      strategicInsight: "Error during analysis.",
      group: "Error",
      timestamp: Date.now()
    };
  }
};

// --- Content Strategy Agent ---
export const generateContentStrategy = async (keywords: KeywordMetric[], serpData: SerpResult[], goals: string): Promise<ContentStrategy> => {
  const model = "gemini-3-pro-preview"; 
  
  const prompt = `
    Act as a Chief Content Officer. Generate a comprehensive content strategy based on the provided keyword data and SERP analysis.
    
    Context:
    User Goals: "${goals}"
    Input Data:
    Keywords: ${JSON.stringify(keywords.slice(0, 15))}
    SERP Insights: ${JSON.stringify(serpData.slice(0, 5).map(s => ({ k: s.keyword, insight: s.strategicInsight })))}
    
    Tasks:
    1. Topic Clusters: Group keywords into logical clusters that align with the user goals.
    2. Content Calendar: Propose a 4-week publishing schedule with specific best days to publish.
    3. Internal Linking: Define a linking map between topics to boost authority.
    
    Output JSON:
    {
      "clusters": [{ "name": "Cluster Name", "keywords": ["k1", "k2"], "intent": "string" }],
      "calendar": [{ "week": 1, "topic": "string", "type": "Blog Post", "bestDay": "Tuesday" }],
      "internalLinking": [{ "sourceTopic": "string", "targetTopic": "string", "anchorText": "string" }],
      "summary": "Strategic overview paragraph explaining how this strategy meets the user's goals..."
    }
  `;

  try {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));

    const data = cleanAndParseJSON(response.text || "") || {};
    return {
      clusters: Array.isArray(data.clusters) ? data.clusters : [],
      calendar: Array.isArray(data.calendar) ? data.calendar : [],
      internalLinking: Array.isArray(data.internalLinking) ? data.internalLinking : [],
      summary: data.summary || "Strategy generation unavailable."
    };
  } catch (e) {
    console.error("Content Strategy Failed", e);
    return { clusters: [], calendar: [], internalLinking: [], summary: "Strategy failed." };
  }
};

// --- Article Outline Agent ---
export const generateArticleOutline = async (keyword: string, serpData: SerpResult, tone: string): Promise<any> => {
    const prompt = `
      Act as a Lead Content Strategist. Create a comprehensive article outline for "${keyword}".
      Target Length: 3000+ words.
      Tone: ${tone}.
      Context: Use the SERP data provided: ${JSON.stringify(serpData?.peopleAlsoAsk || [])}.
      
      Requirements:
      - Title (H1)
      - Introduction
      - At least 8-10 H2 sections.
      - Identify 2 sections that require a DATA VISUALIZATION (Chart/Graph). Mark visualType as 'chart'.
      - Identify 2-3 sections that would benefit from an ILLUSTRATIVE IMAGE. Mark visualType as 'image'.
      
      Output JSON:
      {
        "title": "string",
        "sections": [
           { "heading": "string", "description": "what to cover", "visualType": "none|chart|table|image" }
        ]
      }
    `;
    
    try {
      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: "application/json" }
      }));
      const data = cleanAndParseJSON(response.text || "") || {};
      return {
        title: data.title || keyword,
        sections: Array.isArray(data.sections) ? data.sections : []
      };
    } catch (e) {
      console.error("Article Outline Failed", e);
      return { title: keyword, sections: [] };
    }
};

// --- Article Writer Agent (Section by Section) ---
export const writeArticleSection = async (
    sectionHeading: string, 
    keyword: string, 
    context: string, 
    tone: string,
    visualType: string
): Promise<{ content: string, chartData?: any[], imagePrompt?: string }> => {
    const prompt = `
      Write a deep, authoritative section for an article about "${keyword}".
      Section Heading: "${sectionHeading}".
      Tone: ${tone}.
      Context: ${context}.
      Visual Requirement: ${visualType}.
      
      Rules:
      1. Write at least 400 words for this section.
      2. Use Markdown formatting.
      3. **MANDATORY**: Extensive External Linking. Identify and naturally integrate high-quality, high-DA external citations/links.
      4. If Visual Requirement is 'chart', YOU MUST GENERATE A RELEVANT DATASET for a Bar or Line chart in the JSON output. 
      5. If Visual Requirement is 'image', YOU MUST GENERATE A DETAILED IMAGE PROMPT (photorealistic, 16:9) describing the image to be generated.
      
      Output JSON:
      {
        "content": "markdown string...",
        "chartData": [{ "name": "string", "value": number }] (only if visualType is chart),
        "imagePrompt": "Detailed prompt for image generation..." (only if visualType is image)
      }
    `;

    try {
      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }] 
          }
      }));
      const data = cleanAndParseJSON(response.text || "") || {};
      return {
        content: data.content || "Section generation failed.",
        chartData: data.chartData,
        imagePrompt: data.imagePrompt
      };
    } catch (e) {
      console.error("Article Section Write Failed", e);
      return { content: "Error writing section.", chartData: undefined };
    }
};

// --- AI Overview Optimizer Agent ---
export const optimizeForAIOverview = async (fullContent: string, keyword: string): Promise<string> => {
    // Sanitize to avoid token limits with base64 images
    const safeContent = sanitizeContentForContext(fullContent);

    const prompt = `
      You are the AI Overview Optimizer.
      Analyze the following article content for keyword "${keyword}".
      Create a specific "Key Takeaways" or "Quick Answer" block at the very top that is perfectly formatted to be picked up by Google's AI Overview (SGE).
      
      Content Context: ${safeContent.substring(0, 10000)}...
      
      Rules:
      - Direct answer to the query.
      - Bullet points.
      - 50-60 words max for the summary.
      
      Return ONLY the optimization block in Markdown.
    `;
    
    try {
      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
      }));
      return response.text || "";
    } catch (e) {
      return "";
    }
}

// --- Internal Linking Agent ---
export const generateInternalLinkSuggestions = async (content: string, sitemap: string[]): Promise<LinkSuggestion[]> => {
    // Sanitize content to avoid passing base64 images to the model
    const safeContent = sanitizeContentForContext(content);

    const prompt = `
      You are a Link Building Specialist.
      Analyze the following article content and the provided Sitemap URLs.
      Identify logical opportunities to add INTERNAL LINKS from the text to the sitemap pages.
      
      Content (First 4000 chars): ${safeContent.substring(0, 4000)}...
      Sitemap: ${JSON.stringify(sitemap)}
      
      Return a JSON array of suggestions.
      Each suggestion must include:
      - "anchorText": The exact text in the content to become a link.
      - "targetUrl": One of the sitemap URLs.
      - "context": A brief snippet surrounding the anchor for verification.
      
      Rules:
      - Suggest 3-5 high relevance internal links.
      - Do not suggest links if the topic isn't mentioned.
      
      Output JSON:
      [
        { "anchorText": "string", "targetUrl": "string", "context": "string", "type": "internal" }
      ]
    `;

    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));
        const res = cleanAndParseJSON(response.text || "");
        return Array.isArray(res) ? res.map((l: any, i: number) => ({...l, id: `link-${i}`, confidence: 0.9})) : [];
    } catch (e) {
        console.error("Link Suggestion Failed", e);
        return [];
    }
};

export const applyLinkSuggestions = async (content: string, suggestions: LinkSuggestion[]): Promise<string> => {
    // Replaced AI call with robust string replacement to save quota and avoid Token Limit errors with base64 images.
    let newContent = content;
    
    // Sort by length desc to avoid replacing substrings of other anchors if they overlap (rudimentary safety)
    const sortedSuggestions = [...suggestions].sort((a, b) => b.anchorText.length - a.anchorText.length);
    
    for (const suggestion of sortedSuggestions) {
        if (!suggestion.anchorText || !suggestion.targetUrl) continue;
        
        // Escape special regex chars in anchor text
        const escapedAnchor = suggestion.anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Regex to match the anchor text ONLY if it is NOT already part of a markdown link
        const regex = new RegExp(`(?<!\\[)${escapedAnchor}(?!\\])`, 'i');
        
        newContent = newContent.replace(regex, `[${suggestion.anchorText}](${suggestion.targetUrl})`);
    }
    
    return Promise.resolve(newContent);
};


// --- Image Generation Agent ---
export const generateImage = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
  try {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/600`; 
  } catch (e) {
    console.error("Image Gen Error", e);
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/600`; 
  }
};

// --- Rank Tracking Agent ---
export const checkRank = async (domain: string, keywords: string[]): Promise<BulkRankResponse> => {
  const keywordList = keywords.join(', ');
  
  const prompt = `
    I need to check the ranking of the domain "${domain}" for the following keywords: ${keywordList}.
    
    For EACH keyword in the list:
    1. Perform a Google Search for that specific keyword.
    2. Scan the organic search results to find the first occurrence of "${domain}".
    3. Determine the rank position (integer), the specific ranking URL, and the page title.
    4. If the domain is not found in the top results for a keyword, set rank to 0 and found to false.
    5. Provide a brief (max 15 words) analysis for that specific keyword result.
    
    Finally, provide a short executive summary of the domain's performance across this set of keywords.
  `;

  // Schema for structured output
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      results: {
        type: Type.ARRAY,
        items: {
           type: Type.OBJECT,
           properties: {
             keyword: { type: Type.STRING },
             rank: { type: Type.INTEGER, description: "The numerical rank position. 0 if not found." },
             url: { type: Type.STRING, description: "The full URL of the ranking page." },
             title: { type: Type.STRING, description: "The title of the page." },
             analysis: { type: Type.STRING, description: "Brief analysis of the result." },
             found: { type: Type.BOOLEAN, description: "True if domain was found in results." }
           },
           required: ["keyword", "rank", "analysis", "found"]
        }
      },
      summary: { type: Type.STRING, description: "Overall summary of performance." }
    },
    required: ["results", "summary"],
  };

  try {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }));

    const result = JSON.parse(response.text || '{}');
    
    // Extract grounding URLs
    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    const groundingUrls = groundingChunks
      .map(chunk => chunk.web?.uri)
      .filter((uri): uri is string => !!uri);

    return {
      results: result.results || [],
      summary: result.summary || "No data returned.",
      groundingUrls
    };

  } catch (error) {
    console.error("GenAI Error:", error);
    throw new Error("Failed to retrieve ranking data. Please try again.");
  }
};

// --- Analytics Agent ---
export const analyzeTrafficPatterns = async (metrics: AnalyticsMetric[], pages: PagePerformance[]): Promise<string> => {
    const prompt = `
      You are a Google Analytics AI Expert. 
      Analyze the provided traffic metrics and page performance data.
      
      Metrics (Last 30m): ${JSON.stringify(metrics.slice(-5))}
      Top Pages: ${JSON.stringify(pages.slice(0,5))}
      
      Task:
      1. Identify current traffic trends (spikes, drops).
      2. Analyze user engagement based on bounce rate and duration.
      3. Recommend ONE specific action to improve retention or conversion based on this live data.
      
      Output: A concise, strategic insight paragraph (max 50 words).
    `;
    
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        }));
        return response.text || "Traffic analysis unavailable.";
    } catch (e) {
        return "Analyzing traffic patterns...";
    }
};

// --- Indexing Agent ---
export const predictIndexingSuccess = async (content: string, keyword: string): Promise<{ likelihood: string, advice: string }> => {
    const safeContent = sanitizeContentForContext(content);
    const prompt = `
      Act as a Google Search Indexing Algorithm simulator.
      Analyze this content for the keyword "${keyword}".
      
      Content Snippet: ${safeContent.substring(0, 1000)}...
      
      Predict:
      1. Indexing Likelihood (High/Medium/Low).
      2. One specific technical SEO fix to ensure rapid indexing.
      
      Output JSON: { "likelihood": "string", "advice": "string" }
    `;
    
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));
        return cleanAndParseJSON(response.text || "") || { likelihood: "Unknown", advice: "Check Google Search Console." };
    } catch (e) {
        return { likelihood: "High", advice: "Submit to GSC immediately." };
    }
};
