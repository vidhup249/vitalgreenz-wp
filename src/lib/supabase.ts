/**
 * Supabase client for a database shared with the V-STEP mobile app.
 * Schema/tables are decided separately — this only establishes the connection.
 *
 * Two clients, for two different trust levels:
 *  - `supabase` (anon key): safe to use from anywhere, including client-side
 *    code. Only ever sees/changes what the project's Row Level Security
 *    policies allow an anonymous user to see/change.
 *  - `supabaseAdmin` (service role key): SERVER-ONLY, bypasses RLS entirely.
 *    Never import this into a client component or expose it to the browser.
 *
 * This app's own tables (customers/orders/newsletter — see supabase/schema.sql)
 * live in the `shop` Postgres schema, not `public`, to stay structurally
 * isolated from the V-STEP app's existing tables. getSupabaseAdmin() defaults
 * to that schema, so `getSupabaseAdmin().from('orders')` reaches `shop.orders`
 * without needing `.schema('shop')` on every call. Reach into `public` (or
 * anywhere else) explicitly with `.schema('public').from(...)` when needed —
 * e.g. if/when this app needs to *read* the V-STEP tables themselves.
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

// Typed against the `shop` schema specifically — createClient()'s inferred
// return type changes shape with `db.schema`, so the bare `SupabaseClient`
// alias (which defaults to "public") doesn't match what this actually returns.
type SupabaseAdminClient = SupabaseClient<any, any, 'shop'>;

let _supabaseAdmin: SupabaseAdminClient | null = null;
/** Service-role client — full access, bypasses RLS. SERVER-ONLY. */
export function getSupabaseAdmin(): SupabaseAdminClient {
	if (!URL || !SERVICE_ROLE_KEY) {
		throw new Error(
			'Supabase admin client is not configured (missing PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
		);
	}
	if (!_supabaseAdmin) {
		_supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY, {
			auth: { persistSession: false, autoRefreshToken: false },
			db: { schema: 'shop' },
		});
	}
	return _supabaseAdmin;
}
