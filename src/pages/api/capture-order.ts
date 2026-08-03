import type { APIRoute } from 'astro';
import { capturePayPalOrder, isPayPalConfigured } from '../../lib/paypal';
import { markWooOrderPaid } from '../../lib/woo-orders';

export const prerender = false; // on-demand serverless function

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
	if (!isPayPalConfigured()) return json({ error: 'Payments are not configured yet.' }, 503);

	let body: { paypalOrderId?: string; wooOrderId?: number };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const { paypalOrderId, wooOrderId } = body;
	if (!paypalOrderId || !wooOrderId) return json({ error: 'Missing order references.' }, 400);

	try {
		const capture = await capturePayPalOrder(paypalOrderId);
		if (capture.status !== 'COMPLETED') {
			return json({ ok: false, status: capture.status }, 402);
		}
		// Payment captured → mark the Woo order paid + processing.
		await markWooOrderPaid(Number(wooOrderId), capture.captureId || paypalOrderId);
		return json({ ok: true, wooOrderId });
	} catch (err) {
		// Payment may have captured even if the Woo update failed — surface it so it
		// can be reconciled (a webhook is the belt-and-braces fix later).
		return json({ error: err instanceof Error ? err.message : 'Capture failed.' }, 500);
	}
};
