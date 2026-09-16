/**
 * Cookie-backed Supabase Auth client for Astro's server-side pages/routes.
 *
 * IMPORTANT: Supabase Auth's user pool is shared with the V-STEP mobile app
 * (same project, same `auth.users` table) — "logged in" alone does NOT mean
 * "is an admin of this site". Every admin-gated route must also check
 * isAllowedAdmin() below, which cross-references an explicit allowlist.
 * Never grant admin access on session presence alone.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

const ADMIN_EMAILS = ((import.meta.env.ADMIN_EMAILS as string) || '')
	.split(',')
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

/** Astro's `cookies` has no getAll() — parse the raw incoming header ourselves. */
function parseCookieHeader(header: string | null): { name: string; value: string }[] {
	if (!header) return [];
	return header
		.split(';')
		.map((pair) => {
			const idx = pair.indexOf('=');
			if (idx === -1) return null;
			const name = pair.slice(0, idx).trim();
			const value = pair.slice(idx + 1).trim();
			if (!name) return null;
			try {
				return { name, value: decodeURIComponent(value) };
			} catch {
				return { name, value };
			}
		})
		.filter((c): c is { name: string; value: string } => c !== null);
}

/** Server client bound to this request — reads the session, writes refreshed cookies. */
export function createSupabaseServerClient(request: Request, cookies: AstroCookies) {
	if (!URL || !ANON_KEY) {
		throw new Error('Supabase is not configured (missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY).');
	}
	return createServerClient(URL, ANON_KEY, {
		cookies: {
			getAll: () => parseCookieHeader(request.headers.get('cookie')),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					cookies.set(name, value, options as CookieOptions);
				}
			},
		},
	});
}

/** True only if the email is on the explicit admin allowlist (case-insensitive). */
export function isAllowedAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isAdminAuthConfigured(): boolean {
	return Boolean(URL && ANON_KEY) && ADMIN_EMAILS.length > 0;
}
