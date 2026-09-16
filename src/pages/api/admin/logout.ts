import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-server';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	try {
		const supabase = createSupabaseServerClient(request, cookies);
		await supabase.auth.signOut();
	} catch {
		// Not configured or already signed out — fall through to the redirect either way.
	}
	return redirect('/admin/login');
};
