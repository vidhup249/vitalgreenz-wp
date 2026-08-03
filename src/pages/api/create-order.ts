import type { APIRoute } from 'astro';
import { getProduct } from '../../lib/woocommerce';
import { createWooOrder, type WooLineItem, type WooAddress } from '../../lib/woo-orders';
import { createPayPalOrder, isPayPalConfigured } from '../../lib/paypal';

export const prerender = false; // on-demand serverless function

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

interface Body {
	items: { id: number; qty: number }[];
	customer: {
		fullname?: string;
		email?: string;
		phone?: string;
		address?: string;
		city?: string;
		state?: string;
		pincode?: string;
	};
}

export const POST: APIRoute = async ({ request }) => {
	if (!isPayPalConfigured()) {
		return json({ error: 'Payments are not configured yet.' }, 503);
	}

	let body: Body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const items = (body.items || []).filter((i) => i && Number(i.id) > 0 && Number(i.qty) > 0);
	if (!items.length) return json({ error: 'Your basket is empty.' }, 400);

	// Build line items from real products only (prices are computed by WooCommerce,
	// never trusted from the client). Attach variation_id for variable products.
	const line_items: WooLineItem[] = [];
	try {
		for (const it of items) {
			const product = await getProduct(Number(it.id));
			const li: WooLineItem = { product_id: product.id, quantity: Number(it.qty) };
			if (product.type === 'variable' && (product as any).variations?.length) {
				li.variation_id = (product as any).variations[0].id;
			}
			line_items.push(li);
		}
	} catch {
		return json({ error: 'One or more products could not be validated.' }, 400);
	}

	// Split the name and map the form to a Woo billing address.
	const c = body.customer || {};
	const [first_name, ...rest] = (c.fullname || '').trim().split(/\s+/);
	const billing: WooAddress = {
		first_name: first_name || '',
		last_name: rest.join(' '),
		email: c.email,
		phone: c.phone,
		address_1: c.address,
		city: c.city,
		state: c.state,
		postcode: c.pincode,
		country: 'IN',
	};

	try {
		// 1) Pending WooCommerce order (authoritative total).
		const order = await createWooOrder({ line_items, billing });

		// 2) PayPal order for that exact amount.
		//    Currency must match the browser SDK's currency (PUBLIC_PAYPAL_CURRENCY);
		//    falls back to the Woo order currency. NO FX conversion is performed — keep
		//    the store currency and PUBLIC_PAYPAL_CURRENCY the same.
		const currency = (import.meta.env.PUBLIC_PAYPAL_CURRENCY as string) || order.currency;
		const paypal = await createPayPalOrder({
			amount: order.total,
			currency,
			reference: order.id,
		});

		return json({
			wooOrderId: order.id,
			paypalOrderId: paypal.id,
			total: order.total,
			currency,
		});
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'Order creation failed.' }, 500);
	}
};
