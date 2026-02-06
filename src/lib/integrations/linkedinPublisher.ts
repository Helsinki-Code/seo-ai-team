/**
 * LinkedIn Automated Publishing Integration
 * Publishes content to LinkedIn for parasite SEO benefits
 * Generates LinkedIn-optimized snippets and article links
 */

import axios from 'axios';

export interface LinkedInConfig {
  accessToken: string;
  personId?: string; // LinkedIn profile ID
  organizationId?: string; // Company page ID
}

export interface LinkedInPublishRequest {
  content: string;
  articleUrl?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkedInOptimized?: boolean;
}

/**
 * Convert article content to LinkedIn post format
 */
function convertToLinkedInFormat(
  content: string,
  title: string,
  articleUrl: string
): string {
  // Extract first 1300 characters (LinkedIn limit) and add article link
  const excerpt = content.substring(0, 1000);
  const cleanExcerpt = excerpt
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
    .trim();

  return `${cleanExcerpt}...

${title}

Read the full article: ${articleUrl}

#SEO #Content #DigitalMarketing`;
}

/**
 * Publish content to LinkedIn profile
 */
export async function publishToLinkedIn(
  config: LinkedInConfig,
  postData: LinkedInPublishRequest
): Promise<{
  postId: string;
  url: string;
  status: string;
}> {
  if (!config.personId) {
    throw new Error('LinkedIn person ID is required');
  }

  try {
    const linkedInPost = convertToLinkedInFormat(
      postData.content,
      postData.title || 'New Article',
      postData.articleUrl || ''
    );

    // Create LinkedIn API request
    const response = await axios.post(
      `https://api.linkedin.com/v2/ugcPosts`,
      {
        author: `urn:li:person:${config.personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishedContent': {
            shareMediaCategory: postData.imageUrl ? 'IMAGE' : 'NONE',
            shareContent: {
              shareCommentary: {
                text: linkedInPost,
              },
              ...(postData.imageUrl && {
                media: [
                  {
                    status: 'READY',
                    description: {
                      text: postData.description || postData.title || '',
                    },
                    media: postData.imageUrl,
                    title: {
                      text: postData.title || 'Article',
                    },
                  },
                ],
              }),
            },
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return {
      postId: response.data.id || '',
      url: `https://www.linkedin.com/feed/update/${response.data.id}/`,
      status: 'published',
    };
  } catch (error) {
    console.error('LinkedIn publishing error:', error);
    throw new Error(
      `Failed to publish to LinkedIn: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Publish to LinkedIn Company Page
 */
export async function publishToLinkedInCompanyPage(
  config: LinkedInConfig,
  postData: LinkedInPublishRequest
): Promise<{
  postId: string;
  url: string;
  status: string;
}> {
  if (!config.organizationId) {
    throw new Error('LinkedIn organization ID is required');
  }

  try {
    const linkedInPost = convertToLinkedInFormat(
      postData.content,
      postData.title || 'New Article',
      postData.articleUrl || ''
    );

    const response = await axios.post(
      `https://api.linkedin.com/v2/ugcPosts`,
      {
        author: `urn:li:organization:${config.organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishedContent': {
            shareMediaCategory: 'ARTICLE',
            shareContent: {
              shareCommentary: {
                text: linkedInPost,
              },
              media: [
                {
                  status: 'READY',
                  description: {
                    text: postData.description || '',
                  },
                  originalUrl: postData.articleUrl || '',
                  title: {
                    text: postData.title || 'Article',
                  },
                  thumbnail: postData.imageUrl || '',
                },
              ],
            },
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return {
      postId: response.data.id || '',
      url: `https://www.linkedin.com/feed/update/${response.data.id}/`,
      status: 'published',
    };
  } catch (error) {
    console.error('LinkedIn company page publishing error:', error);
    throw new Error(
      `Failed to publish to LinkedIn company page: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Generate LinkedIn engagement metrics
 */
export async function getLinkedInPostMetrics(
  config: LinkedInConfig,
  postId: string
): Promise<{
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}> {
  try {
    const response = await axios.get(
      `https://api.linkedin.com/v2/ugcPosts/${postId}/engagement`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return {
      likes: response.data.likeCount || 0,
      comments: response.data.commentCount || 0,
      shares: response.data.shareCount || 0,
      impressions: response.data.impressionCount || 0,
      clicks: response.data.clickCount || 0,
    };
  } catch (error) {
    console.error('Failed to get LinkedIn metrics:', error);
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      clicks: 0,
    };
  }
}

/**
 * Generate multiple LinkedIn post variations
 */
export function generateLinkedInVariations(
  title: string,
  articleUrl: string,
  keywords: string[]
): string[] {
  const variations = [
    `🚀 Just published: "${title}"

Key insights:
${keywords.slice(0, 3).map((k) => `• ${k}`).join('\n')}

Read more: ${articleUrl}

#SEO #ContentMarketing #Growth`,

    `📚 New article: ${title}

Covering ${keywords.join(', ')}

${articleUrl}

Thoughts? I'd love to hear your perspective!

#DigitalMarketing #SEO`,

    `💡 Latest insights on ${keywords[0]}

In this article, I dive deep into:
${keywords.slice(0, 4).map((k) => `→ ${k}`).join('\n')}

${articleUrl}

#Industry #Insights #Knowledge`,
  ];

  return variations;
}
