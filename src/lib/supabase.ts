/**
 * Supabase client for the V-STEP database (shared with the V-STEP mobile app).
 * Schema/tables are decided separately — this only establishes the connection.
 *
 * Two clients, for two different trust levels:
 *  - `supabase` (anon key): safe to use from anywhere, including client-side
 *    code. Only ever sees/changes what the project's Row Level Security
 *    policies allow an anonymous user to see/change.
 *  - `supabaseAdmin` (service role key): SERVER-ONLY, bypasses RLS entirely.
 *    Never import this into a client component or expose it to the browser.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
	return Boolean(URL && ANON_KEY);
}

export function isSupabaseAdminConfigured(): boolean {
	return Boolean(URL && SERVICE_ROLE_KEY);
}

let _supabase: SupabaseClient | null = null;
/** Anon-key client — RLS-restricted, safe for any context. */
export function getSupabase(): SupabaseClient {
	if (!URL || !ANON_KEY) {
		throw new Error(
			'Supabase is not configured (missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY).'
		);
	}
	if (!_supabase) _supabase = createClient(URL, ANON_KEY);
	return _supabase;
}

let _supabaseAdmin: SupabaseClient | null = null;
/** Service-role client — full access, bypasses RLS. SERVER-ONLY. */
export function getSupabaseAdmin(): SupabaseClient {
	if (!URL || !SERVICE_ROLE_KEY) {
		throw new Error(
			'Supabase admin client is not configured (missing PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
		);
	}
	if (!_supabaseAdmin) {
		_supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
	}
	return _supabaseAdmin;
}
