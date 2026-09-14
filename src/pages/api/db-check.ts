import type { APIRoute } from 'astro';
import { isSupabaseConfigured, isSupabaseAdminConfigured } from '../../lib/supabase';

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

	try {
		// The Auth service's health check is schema-agnostic (doesn't need any
		// tables to exist yet) and works with the anon key, unlike the bare
		// /rest/v1/ root, which requires the service_role key specifically.
		const res = await fetch(`${URL}/auth/v1/health`, {
			headers: { apikey: ANON_KEY },
		});
		return json({
			...envReport,
			reachable: res.ok,
			supabaseStatus: res.status,
			message: res.ok ? 'Connected — URL and anon key are valid.' : 'Reached Supabase, but it rejected the key.',
		});
	} catch (err) {
		return json({
			...envReport,
			reachable: false,
			message: err instanceof Error ? err.message : 'Could not reach the Supabase URL.',
		});
	}
};
