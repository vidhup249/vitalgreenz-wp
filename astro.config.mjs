// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import vercel from '@astrojs/vercel';

// Absolute site URL — needed so OG/Twitter image URLs are absolute (social
// scrapers require it). Auto-uses the Vercel production domain on deploy;
// override with PUBLIC_SITE_URL if you use a custom domain.
const SITE =
  process.env.PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site: SITE,

  // Pages stay static/prerendered; only routes marked `export const prerender = false`
  // (the /api/* checkout endpoints) run on-demand as serverless functions.
  output: 'static',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});
