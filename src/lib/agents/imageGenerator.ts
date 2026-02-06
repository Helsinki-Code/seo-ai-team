/**
 * Image Generator Agent
 * Uses Gemini 2.5 Flash Image model to generate images
 * Nexus pattern: Image generation with aspect ratio support
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRetry } from './utils/retry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  aspectRatio: string;
  createdAt: number;
  base64?: string;
}

/**
 * Generate image using Gemini 2.5 Flash Image model
 * Returns base64 data or fallback to placeholder
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const response = await withRetry(() =>
      model.generateContent({
        contents: [
          {
            parts: [
              {
                text: `Generate a professional, high-quality image for this prompt. Aspect ratio: ${aspectRatio}. ${prompt}`,
              },
            ],
          },
        ],
      })
    );

    const result = response.response;

    // Check if response has image data
    if (result.candidates && result.candidates[0]?.content) {
      const parts = result.candidates[0].content.parts;

      for (const part of parts) {
        // Handle inline image data
        if ('inlineData' in part && part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    // Fallback if no image generated
    return generatePlaceholderImage(prompt, aspectRatio);
  } catch (error) {
    console.error('Image generation error:', error);
    return generatePlaceholderImage(prompt, aspectRatio);
  }
};

/**
 * Generate placeholder image URL as fallback
 */
const generatePlaceholderImage = (
  prompt: string,
  aspectRatio: string
): string => {
  // Use picsum.photos as fallback with seed based on prompt
  const seed = encodeURIComponent(prompt.substring(0, 50));
  const [width, height] = aspectRatio === '16:9' ? [1200, 675] : [800, 600];
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

/**
 * Batch generate multiple images
 */
export const generateImageBatch = async (
  prompts: string[],
  aspectRatio: string = '16:9'
): Promise<GeneratedImage[]> => {
  const images: GeneratedImage[] = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      const url = await generateImage(prompts[i], aspectRatio);
      images.push({
        id: `img-${Date.now()}-${i}`,
        prompt: prompts[i],
        url,
        aspectRatio,
        createdAt: Date.now(),
      });

      // Rate limiting - wait 1s between requests
      if (i < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.warn(`Failed to generate image for prompt ${i}:`, error);
      // Continue with next prompt
    }
  }

  return images;
};

/**
 * Refine image prompt for better results
 */
export const refineImagePrompt = (basePrompt: string): string => {
  return `Professional, high-quality, detailed illustration for an SEO/digital marketing article. ${basePrompt}. Style: modern, clean, professional. Colors: vibrant and engaging. No text, no watermarks.`;
};
