/**
 * WordPress Automated Publishing Integration
 * Publishes generated content directly to WordPress sites
 * Handles featured images, content images, SEO metadata, and scheduling
 */

import axios from 'axios';

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  appPassword: string; // Application-specific password (not actual password)
}

export interface WordPressPublishRequest {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featuredImageUrl?: string;
  images: Array<{
    url: string;
    altText: string;
    caption?: string;
  }>;
  category?: string;
  tags?: string[];
  publishSchedule?: Date; // Schedule for future publishing
  seoMetadata?: {
    metaDescription: string;
    focusKeyword: string;
    keywordDensity?: Record<string, number>;
  };
}

/**
 * Publish content to WordPress automatically
 */
export async function publishToWordPress(
  config: WordPressConfig,
  postData: WordPressPublishRequest
): Promise<{
  postId: number;
  url: string;
  status: string;
}> {
  const auth = Buffer.from(
    `${config.username}:${config.appPassword}`
  ).toString('base64');

  const client = axios.create({
    baseURL: `${config.siteUrl}/wp-json/wp/v2`,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  try {
    // Step 1: Upload featured image if provided
    let featuredImageId: number | undefined;
    if (postData.featuredImageUrl) {
      featuredImageId = await uploadImageToWordPress(
        config,
        postData.featuredImageUrl,
        postData.title
      );
    }

    // Step 2: Upload content images
    const imageMap: Record<string, number> = {};
    for (const img of postData.images) {
      const mediaId = await uploadImageToWordPress(config, img.url, img.altText);
      imageMap[img.url] = mediaId;
    }

    // Step 3: Replace image URLs in content with WordPress media IDs
    let processedContent = postData.content;
    for (const [originalUrl, mediaId] of Object.entries(imageMap)) {
      processedContent = processedContent.replace(
        originalUrl,
        `<!-- wp:image {"id":${mediaId},"sizeSlug":"large"} -->
<figure class="wp-block-image size-large"><img src="${originalUrl}" alt="${postData.images.find((i) => i.url === originalUrl)?.altText || ''}" class="wp-image-${mediaId}" /></figure>
<!-- /wp:image -->`
      );
    }

    // Step 4: Create WordPress post
    const createResponse = await client.post('/posts', {
      title: postData.title,
      content: processedContent,
      excerpt: postData.excerpt,
      slug: postData.slug,
      status: postData.publishSchedule ? 'scheduled' : 'publish',
      date: postData.publishSchedule?.toISOString(),
      featured_media: featuredImageId || 0,
      categories: postData.category
        ? [(await getCategoryIdByName(config, postData.category))]
        : undefined,
      tags: postData.tags
        ? await Promise.all(postData.tags.map((t) => getTagIdByName(config, t)))
        : undefined,
      meta: {
        // Yoast SEO meta fields (if Yoast is active)
        _yoast_wpseo_focuskw: postData.seoMetadata?.focusKeyword || '',
        _yoast_wpseo_metadesc: postData.seoMetadata?.metaDescription || '',
        _yoast_wpseo_linkdex: '75', // Placeholder SEO score
      },
    });

    return {
      postId: createResponse.data.id,
      url: createResponse.data.link,
      status: createResponse.data.status,
    };
  } catch (error) {
    console.error('WordPress publishing error:', error);
    throw new Error(
      `Failed to publish to WordPress: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Upload image to WordPress media library
 */
async function uploadImageToWordPress(
  config: WordPressConfig,
  imageUrl: string,
  altText: string
): Promise<number> {
  const auth = Buffer.from(
    `${config.username}:${config.appPassword}`
  ).toString('base64');

  try {
    // Fetch image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    // Upload to WordPress
    const uploadResponse = await axios.post(
      `${config.siteUrl}/wp-json/wp/v2/media`,
      imageResponse.data,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${altText.replace(/\s+/g, '-')}.jpg"`,
        },
      }
    );

    // Update alt text
    await axios.post(
      `${config.siteUrl}/wp-json/wp/v2/media/${uploadResponse.data.id}`,
      {
        alt_text: altText,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return uploadResponse.data.id;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

/**
 * Get category ID by name (or create if doesn't exist)
 */
async function getCategoryIdByName(
  config: WordPressConfig,
  categoryName: string
): Promise<number> {
  const auth = Buffer.from(
    `${config.username}:${config.appPassword}`
  ).toString('base64');

  try {
    // Search for existing category
    const searchResponse = await axios.get(
      `${config.siteUrl}/wp-json/wp/v2/categories?search=${categoryName}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (searchResponse.data.length > 0) {
      return searchResponse.data[0].id;
    }

    // Create new category if not found
    const createResponse = await axios.post(
      `${config.siteUrl}/wp-json/wp/v2/categories`,
      {
        name: categoryName,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return createResponse.data.id;
  } catch (error) {
    console.error('Category lookup error:', error);
    throw error;
  }
}

/**
 * Get tag ID by name (or create if doesn't exist)
 */
async function getTagIdByName(
  config: WordPressConfig,
  tagName: string
): Promise<number> {
  const auth = Buffer.from(
    `${config.username}:${config.appPassword}`
  ).toString('base64');

  try {
    const searchResponse = await axios.get(
      `${config.siteUrl}/wp-json/wp/v2/tags?search=${tagName}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (searchResponse.data.length > 0) {
      return searchResponse.data[0].id;
    }

    const createResponse = await axios.post(
      `${config.siteUrl}/wp-json/wp/v2/tags`,
      {
        name: tagName,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return createResponse.data.id;
  } catch (error) {
    console.error('Tag lookup error:', error);
    throw error;
  }
}

/**
 * Schedule post for future publishing
 */
export async function scheduleWordPressPost(
  config: WordPressConfig,
  postId: number,
  publishDate: Date
): Promise<void> {
  const auth = Buffer.from(
    `${config.username}:${config.appPassword}`
  ).toString('base64');

  await axios.post(
    `${config.siteUrl}/wp-json/wp/v2/posts/${postId}`,
    {
      status: 'scheduled',
      date: publishDate.toISOString(),
    },
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
}

/**
 * Update post with new content (for optimization iterations)
 */
export async function updateWordPressPost(
  config: WordPressConfig,
  postId: number,
  updates: Partial<WordPressPublishRequest>
): Promise<void> {
  const auth = Buffer.from(
    `${config.username}:${config.appPassword}`
  ).toString('base64');

  await axios.post(
    `${config.siteUrl}/wp-json/wp/v2/posts/${postId}`,
    {
      title: updates.title,
      content: updates.content,
      excerpt: updates.excerpt,
      modified: new Date().toISOString(),
    },
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
}
