import type { APIRoute } from 'astro';
import { certsFor } from '../../lib/certifications';

export const prerender = false; // on-demand serverless function

// Public and read-only — the same certification numbers already shown on
// product pages and the footer. Used by the checkout page's client-side
// trust box, which (unlike the Astro components) can't reach the
// service_role Supabase client directly.
export const GET: APIRoute = async () => {
	const certs = await certsFor();
	return new Response(JSON.stringify({ certs }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
