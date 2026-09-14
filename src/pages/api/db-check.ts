import type { APIRoute } from 'astro';
import { isSupabaseConfigured, isSupabaseAdminConfigured, getSupabaseAdmin } from '../../lib/supabase';

export const prerender = false;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data, null, 2), { status, headers: { 'Content-Type': 'application/json' } });

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/**
 * Connectivity check only — reports whether the Supabase env vars are set
 * and whether the URL/key pair is actually reachable. Never echoes the key
 * values themselves, only booleans and Supabase's own response status.
 */
export const GET: APIRoute = async () => {
	const envReport = {
		anonClientConfigured: isSupabaseConfigured(),
		adminClientConfigured: isSupabaseAdminConfigured(),
	};

	if (!URL || !ANON_KEY) {
		return json({ ...envReport, reachable: null, message: 'Set the env vars, then reload this endpoint.' });
	}

	let anonResult: Record<string, unknown>;
	try {
		// The Auth service's health check is schema-agnostic (doesn't need any
		// tables to exist yet) and works with the anon key, unlike the bare
		// /rest/v1/ root, which requires the service_role key specifically.
		const res = await fetch(`${URL}/auth/v1/health`, {
			headers: { apikey: ANON_KEY },
		});
		anonResult = {
			reachable: res.ok,
			supabaseStatus: res.status,
			message: res.ok ? 'Connected — URL and anon key are valid.' : 'Reached Supabase, but it rejected the key.',
		};
	} catch (err) {
		anonResult = {
			reachable: false,
			message: err instanceof Error ? err.message : 'Could not reach the Supabase URL.',
		};
	}

	// The real path that matters: can server-side code actually read the
	// `shop` schema with the service_role key? Counts rows rather than
	// returning them — this is a connectivity check, not a data dump.
	let adminResult: Record<string, unknown> = { tested: false };
	if (isSupabaseAdminConfigured()) {
		try {
			const admin = getSupabaseAdmin();
			const tables = ['customers', 'orders', 'order_items', 'newsletter_subscribers'];
			const counts: Record<string, number | string> = {};
			for (const table of tables) {
				const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
				counts[table] = error ? `error: ${error.message}` : (count ?? 0);
			}
			adminResult = { tested: true, ok: true, rowCounts: counts };
		} catch (err) {
			adminResult = { tested: true, ok: false, message: err instanceof Error ? err.message : 'Admin query failed.' };
		}
	}

	return json({ ...envReport, anon: anonResult, admin: adminResult });
};
