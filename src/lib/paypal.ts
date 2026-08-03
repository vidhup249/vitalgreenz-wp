/**
 * PayPal REST helper (server-only — reads PAYPAL_SECRET).
 * Uses the Orders v2 API directly, so WooCommerce is only the order store and
 * the customer never touches a WordPress page.
 */
const CLIENT_ID = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID as string | undefined;
const SECRET = import.meta.env.PAYPAL_SECRET as string | undefined;
const ENV = (import.meta.env.PAYPAL_ENV as string) || 'sandbox';

const BASE = ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export function isPayPalConfigured(): boolean {
	return Boolean(CLIENT_ID && SECRET);
}

async function accessToken(): Promise<string> {
	if (!CLIENT_ID || !SECRET) throw new Error('PayPal is not configured (missing client id / secret).');
	const res = await fetch(`${BASE}/v1/oauth2/token`, {
		method: 'POST',
		headers: {
			Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${SECRET}`),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	});
	if (!res.ok) throw new Error(`PayPal token failed: ${res.status} ${await res.text()}`);
	const data = await res.json();
	return data.access_token as string;
}

export async function createPayPalOrder(opts: {
	amount: string; // e.g. "375.00"
	currency: string; // e.g. "USD"
	reference: string | number; // Woo order id
}): Promise<{ id: string; status: string }> {
	const token = await accessToken();
	const res = await fetch(`${BASE}/v2/checkout/orders`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			intent: 'CAPTURE',
			purchase_units: [
				{
					reference_id: String(opts.reference),
					custom_id: String(opts.reference),
					amount: { currency_code: opts.currency, value: opts.amount },
				},
			],
		}),
	});
	if (!res.ok) throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
	const data = await res.json();
	return { id: data.id, status: data.status };
}

export async function capturePayPalOrder(orderId: string): Promise<{
	status: string;
	captureId?: string;
	payerEmail?: string;
}> {
	const token = await accessToken();
	const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
	});
	if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`);
	const data = await res.json();
	const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
	return {
		status: data.status, // "COMPLETED" on success
		captureId: capture?.id,
		payerEmail: data?.payer?.email_address,
	};
}
