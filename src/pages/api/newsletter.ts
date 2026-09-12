import type { APIRoute } from 'astro';

export const prerender = false;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter signup — UI-only for now. Validates the address and returns
 * success, but does not persist or send it anywhere yet. Wire this up to a
 * real ESP (Mailchimp/Klaviyo/etc.) once one is chosen: add the API call
 * here and nothing on the frontend needs to change.
 */
export const POST: APIRoute = async ({ request }) => {
	let body: { email?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const email = (body.email || '').trim();
	if (!EMAIL_RE.test(email)) {
		return json({ error: 'Enter a valid email address.' }, 400);
	}

	// TODO: subscribe `email` via the chosen email marketing provider.

	return json({ ok: true });
};
