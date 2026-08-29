import type { MetadataRoute } from 'next';

// This is a private internal tool. Disallow all crawlers everywhere.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
