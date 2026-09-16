import type { APIRoute } from 'astro';
import { getProduct } from '../../lib/woocommerce';
import { createWooOrder, type WooLineItem, type WooAddress } from '../../lib/woo-orders';
import { createPayPalOrder, isPayPalConfigured } from '../../lib/paypal';
import { recordShopOrder, type ShopOrderItemInput } from '../../lib/shop-orders';
import { isSupabaseAdminConfigured } from '../../lib/supabase';

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
		discountCoupon?: string;
		vstepReferenceId?: string;
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
	// Also collects name/price for the Supabase order mirror below, so each
	// product only needs fetching once.
	const line_items: WooLineItem[] = [];
	const shopItems: ShopOrderItemInput[] = [];
	try {
		for (const it of items) {
			const product = await getProduct(Number(it.id));
			const li: WooLineItem = { product_id: product.id, quantity: Number(it.qty) };
			if (product.type === 'variable' && (product as any).variations?.length) {
				li.variation_id = (product as any).variations[0].id;
			}
			line_items.push(li);

			const unitPrice =
				Number(product.on_sale ? product.prices.sale_price : product.prices.price) /
				10 ** product.prices.currency_minor_unit;
			shopItems.push({ productId: product.id, name: product.name, unitPrice, qty: Number(it.qty) });
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

		// 3) Mirror into Supabase for the admin dashboard — best-effort. Never
		//    fails the checkout: WooCommerce + PayPal above are what actually
		//    matter to the customer, and Supabase may not be configured in
		//    every environment yet.
		if (isSupabaseAdminConfigured()) {
			try {
				const subtotal = shopItems.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
				const total = Number(order.total);
				await recordShopOrder({
					customer: { fullName: c.fullname || '', mobile: c.phone || '', email: c.email || '' },
					address: { line1: c.address || '', city: c.city || '', state: c.state || '', postcode: c.pincode || '' },
					items: shopItems,
					subtotal,
					shipping: total - subtotal,
					total,
					currency,
					paymentMethod: 'paypal',
					discountCouponCode: c.discountCoupon,
					vstepReferenceId: c.vstepReferenceId,
					wooOrderId: order.id,
				});
			} catch (err) {
				console.error('Supabase order mirror failed (non-fatal):', err);
			}
		}

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
