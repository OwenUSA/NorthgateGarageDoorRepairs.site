/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Everything is local (placeholders in public/) -- no remote image patterns, per
    // process.md Prompt 2 answer.
    unoptimized: false,
  },
};

export default nextConfig;
