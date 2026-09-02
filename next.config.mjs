/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: brochure site with no route handlers, server actions or
  // dynamic APIs, so there is nothing for a Node server to do. Output lands in
  // out/ and is served by the shared nginx container on owen-main.
  output: 'export',
  reactStrictMode: true,
  // The Next image optimizer needs a running server; export requires it off.
  images: { unoptimized: true },
  // Emit /about/index.html rather than /about.html so nginx serves the tree
  // directly with no rewrite rules.
  trailingSlash: true,
};

export default nextConfig;
