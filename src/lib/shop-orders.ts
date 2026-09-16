/**
 * Writes to the Supabase `shop` schema — the richer order ledger that backs
 * the admin dashboard. WooCommerce (see woo-orders.ts) stays the system of
 * record for stock/payment; this mirrors each order alongside it.
 *
 * Deliberately best-effort: every call here is wrapped by its caller so a
 * Supabase hiccup (or Supabase not being configured yet in this environment)
 * never blocks the actual checkout/payment flow. See the try/catch at each
 * call site in api/create-order.ts and api/capture-order.ts.
 */
import { getSupabaseAdmin } from './supabase';

export interface ShopOrderItemInput {
	productId: number;
	name: string;
	unitPrice: number; // rupees, decimal
	qty: number;
}

export interface RecordShopOrderInput {
	customer: { fullName: string; mobile: string; email: string };
	address: { line1: string; city: string; state: string; postcode: string };
	items: ShopOrderItemInput[];
	subtotal: number;
	shipping: number;
	total: number;
	currency: string;
	paymentMethod: string;
	discountCouponCode?: string;
	vstepReferenceId?: string;
	wooOrderId: number;
}

/** Finds a customer by mobile number (the de-dupe key), or creates one. */
async function findOrCreateCustomer(customer: RecordShopOrderInput['customer']): Promise<string> {
	const admin = getSupabaseAdmin();

	const { data: existing, error: findErr } = await admin
		.from('customers')
		.select('id')
		.eq('mobile_number', customer.mobile)
		.maybeSingle();
	if (findErr) throw findErr;
	if (existing) return existing.id;

	const { data: created, error: createErr } = await admin
		.from('customers')
		.insert({ full_name: customer.fullName, mobile_number: customer.mobile, email: customer.email })
		.select('id')
		.single();
	if (createErr) throw createErr;
	return created.id;
}

/** Creates the shop.orders + shop.order_items rows for a freshly-placed order. */
export async function recordShopOrder(
	input: RecordShopOrderInput
): Promise<{ orderId: string; orderNumber: string }> {
	const admin = getSupabaseAdmin();
	const customerId = await findOrCreateCustomer(input.customer);

	const { data: order, error: orderErr } = await admin
		.from('orders')
		.insert({
			customer_id: customerId,
			woo_order_id: input.wooOrderId,
			subtotal_amount: input.subtotal,
			shipping_amount: input.shipping,
			total_amount: input.total,
			currency: input.currency,
			payment_method: input.paymentMethod,
			discount_coupon_code: input.discountCouponCode || null,
			vstep_reference_id: input.vstepReferenceId || null,
			recipient_name: input.customer.fullName,
			recipient_mobile: input.customer.mobile,
			address_line1: input.address.line1,
			city: input.address.city,
			state: input.address.state,
			postcode: input.address.postcode,
		})
		.select('id, order_number')
		.single();
	if (orderErr) throw orderErr;

	const itemRows = input.items.map((it) => ({
		order_id: order.id,
		product_id: it.productId,
		product_name: it.name,
		unit_price: it.unitPrice,
		quantity: it.qty,
		line_total: it.unitPrice * it.qty,
	}));
	const { error: itemsErr } = await admin.from('order_items').insert(itemRows);
	if (itemsErr) throw itemsErr;

	return { orderId: order.id, orderNumber: order.order_number };
}

/** Flips the mirrored order to paid/confirmed once PayPal capture succeeds. */
export async function markShopOrderPaid(wooOrderId: number, paymentReference: string): Promise<void> {
	const admin = getSupabaseAdmin();
	const { error } = await admin
		.from('orders')
		.update({ status: 'confirmed', payment_status: 'paid', payment_reference: paymentReference })
		.eq('woo_order_id', wooOrderId);
	if (error) throw error;
}
