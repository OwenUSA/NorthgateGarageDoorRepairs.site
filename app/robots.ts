import type { MetadataRoute } from 'next';
import { business } from '@/lib/business';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${business.siteUrl}/sitemap.xml`,
  };
}

// output: "export" cannot infer this metadata route is static; say so explicitly.
export const dynamic = "force-static";
