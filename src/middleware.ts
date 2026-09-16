import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient, isAllowedAdmin } from './lib/supabase-server';

/**
 * Gates every /admin route (except the login page/API itself) behind a
 * Supabase Auth session AND the ADMIN_EMAILS allowlist — see the warning in
 * supabase-server.ts about why session presence alone is not enough here.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const isAdminRoute = pathname.startsWith('/admin');
	const isExempt = pathname === '/admin/login' || pathname === '/api/admin/login';

	if (!isAdminRoute || isExempt) return next();

	try {
		const supabase = createSupabaseServerClient(context.request, context.cookies);
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !isAllowedAdmin(user.email)) {
			return context.redirect('/admin/login');
		}
	} catch {
		return context.redirect('/admin/login');
	}

	return next();
});
