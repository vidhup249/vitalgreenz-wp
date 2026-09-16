import type { APIRoute } from 'astro';
import { createSupabaseServerClient, isAllowedAdmin } from '../../../lib/supabase-server';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../../../lib/supabase';

export const prerender = false; // on-demand serverless function

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Editable keys — must match shop.certifications.key exactly.
const KEYS = ['fssai', 'tea_board', 'spices_board', 'apeda'];

// Middleware only gates /admin/* page routes (a redirect makes no sense for
// a fetch() caller expecting JSON), so this route checks admin auth itself —
// same pattern as /api/admin/login.
export const POST: APIRoute = async ({ request, cookies }) => {
	let supabase;
	try {
		supabase = createSupabaseServerClient(request, cookies);
	} catch {
		return json({ error: 'Admin sign-in is not configured yet.' }, 503);
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user || !isAllowedAdmin(user.email)) {
		return json({ error: 'Unauthorized' }, 401);
	}

	if (!isSupabaseAdminConfigured()) {
		return json({ error: 'Supabase admin client is not configured.' }, 503);
	}

	let body: Record<string, string>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const admin = getSupabaseAdmin();
	for (const key of KEYS) {
		if (!(key in body)) continue;
		const number = (body[key] || '').trim() || null;
		const { error } = await admin
			.from('certifications')
			.update({ number, updated_at: new Date().toISOString(), updated_by: user.email })
			.eq('key', key);
		if (error) return json({ error: `Failed to save ${key}: ${error.message}` }, 500);
	}

	return json({ ok: true });
};
