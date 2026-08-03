/**
 * WooCommerce order helpers — REST API v3 with the consumer key/secret.
 * SERVER-ONLY (uses WC_SECRET). Never import this into a client component.
 */
const WP = import.meta.env.PUBLIC_WORDPRESS_URL as string;
const KEY = import.meta.env.WC_KEY as string;
const SECRET = import.meta.env.WC_SECRET as string;

const authHeader = () => 'Basic ' + btoa(`${KEY}:${SECRET}`);

export interface WooLineItem {
	product_id: number;
	quantity: number;
	variation_id?: number;
}

export interface WooAddress {
	first_name?: string;
	last_name?: string;
	email?: string;
	phone?: string;
	address_1?: string;
	city?: string;
	state?: string;
	postcode?: string;
	country?: string;
}

/** Create a pending order. Prices come from the products (line_items send only
 *  product_id + quantity), so the client can never tamper with amounts. */
export async function createWooOrder(input: {
	line_items: WooLineItem[];
	billing: WooAddress;
	shipping?: WooAddress;
}): Promise<{ id: number; total: string; currency: string }> {
	const res = await fetch(`${WP}/wp-json/wc/v3/orders`, {
		method: 'POST',
		headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
		body: JSON.stringify({
			payment_method: 'paypal',
			payment_method_title: 'PayPal',
			set_paid: false,
			status: 'pending',
			billing: input.billing,
			shipping: input.shipping ?? input.billing,
			line_items: input.line_items,
		}),
	});
	if (!res.ok) throw new Error(`Woo order create failed: ${res.status} ${await res.text()}`);
	const order = await res.json();
	return { id: order.id, total: order.total, currency: order.currency };
}

/** Flip an order to processing + mark paid, recording the PayPal transaction id. */
export async function markWooOrderPaid(
	id: number,
	transactionId: string
): Promise<{ id: number; status: string }> {
	const res = await fetch(`${WP}/wp-json/wc/v3/orders/${id}`, {
		method: 'PUT',
		headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
		body: JSON.stringify({
			status: 'processing',
			set_paid: true,
			transaction_id: transactionId,
		}),
	});
	if (!res.ok) throw new Error(`Woo order update failed: ${res.status} ${await res.text()}`);
	const order = await res.json();
	return { id: order.id, status: order.status };
}
