import type { APIRoute } from 'astro';
import { createSupabaseServerClient, isAllowedAdmin } from '../../../lib/supabase-server';

export const prerender = false;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, cookies }) => {
	let body: { email?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const email = (body.email || '').trim();
	const password = body.password || '';
	if (!email || !password) return json({ error: 'Enter your email and password.' }, 400);

	let supabase;
	try {
		supabase = createSupabaseServerClient(request, cookies);
	} catch {
		return json({ error: 'Admin sign-in is not configured yet.' }, 503);
	}

	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error || !data.user) {
		return json({ error: 'Incorrect email or password.' }, 401);
	}

	// Correct credentials, but not an allowed admin — sign the session back
	// out immediately rather than leaving a valid, merely-unprivileged cookie.
	if (!isAllowedAdmin(data.user.email)) {
		await supabase.auth.signOut();
		return json({ error: 'This account does not have admin access.' }, 403);
	}

	return json({ ok: true });
};
