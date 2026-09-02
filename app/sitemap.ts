import type { MetadataRoute } from 'next';
import { business } from '@/lib/business';

// Exactly the five routes in CLAUDE.md's ROUTES constant (D-01) -- no locations grid, no
// per-service routes, nothing auto-discovered.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/about', '/services', '/contact', '/privacy'];
  return routes.map((route) => ({
    url: `${business.siteUrl}${route}`,
    lastModified: new Date(),
  }));
}

// output: "export" cannot infer this metadata route is static; say so explicitly.
export const dynamic = "force-static";
