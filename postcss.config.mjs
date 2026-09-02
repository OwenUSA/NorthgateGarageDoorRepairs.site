// Tailwind v4's CSS-first pipeline requires @tailwindcss/postcss as the PostCSS plugin --
// it's Tailwind's own package, not an extra dependency choice (dependency allowlist:
// see CLAUDE.md / process.md Appendix A).
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
