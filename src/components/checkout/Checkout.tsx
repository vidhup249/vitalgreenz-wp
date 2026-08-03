import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, cartSubtotal, setQty, removeItem, clearCart } from '../../stores/cart';
import { formatINR } from '../../lib/format';

const FREE_SHIP_THRESHOLD = 50000; // ₹500
const FLAT_SHIP = 4900; // ₹49

const CLIENT_ID = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID as string | undefined;
const CURRENCY = (import.meta.env.PUBLIC_PAYPAL_CURRENCY as string) || 'INR';

// Load the PayPal JS SDK once, on demand.
let sdkPromise: Promise<any> | null = null;
function loadPayPalSdk(): Promise<any> {
	if (typeof window === 'undefined') return Promise.resolve(null);
	if ((window as any).paypal) return Promise.resolve((window as any).paypal);
	if (sdkPromise) return sdkPromise;
	sdkPromise = new Promise((resolve, reject) => {
		const s = document.createElement('script');
		s.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=${CURRENCY}&intent=capture`;
		s.onload = () => resolve((window as any).paypal);
		s.onerror = () => reject(new Error('Failed to load PayPal SDK'));
		document.head.appendChild(s);
	});
	return sdkPromise;
}

export default function Checkout() {
	const items = useStore(cartItems);
	const subtotal = useStore(cartSubtotal);
	const [error, setError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const paypalRef = useRef<HTMLDivElement>(null);
	const wooOrderIdRef = useRef<number | null>(null);
	const renderedRef = useRef(false);

	const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIP;
	const total = subtotal + shipping;

	useEffect(() => {
		if (!CLIENT_ID || items.length === 0 || renderedRef.current || !paypalRef.current) return;
		renderedRef.current = true;

		loadPayPalSdk()
			.then((paypal) => {
				if (!paypal || !paypalRef.current) return;
				paypal
					.Buttons({
						style: { color: 'gold', shape: 'pill', layout: 'vertical', height: 48, label: 'paypal' },
						createOrder: async () => {
							setError(null);
							const form = formRef.current;
							if (form && !form.checkValidity()) {
								form.reportValidity();
								throw new Error('form-invalid');
							}
							const customer = form ? Object.fromEntries(new FormData(form).entries()) : {};
							const cart = cartItems.get().map((i) => ({ id: i.id, qty: i.qty }));
							const res = await fetch('/api/create-order', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ items: cart, customer }),
							});
							const data = await res.json();
							if (!res.ok) {
								setError(data.error || 'Could not start the payment.');
								throw new Error(data.error || 'create-order-failed');
							}
							wooOrderIdRef.current = data.wooOrderId;
							return data.paypalOrderId;
						},
						onApprove: async (data: { orderID: string }) => {
							const res = await fetch('/api/capture-order', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ paypalOrderId: data.orderID, wooOrderId: wooOrderIdRef.current }),
							});
							const out = await res.json();
							if (!res.ok || !out.ok) {
								setError('Payment was not completed. If you were charged, contact us and we’ll sort it out.');
								return;
							}
							clearCart();
							window.location.href = `/success?order=${out.wooOrderId}`;
						},
						onError: () => setError('Something went wrong with PayPal. Please try again.'),
						onCancel: () => setError(null),
					})
					.render(paypalRef.current);
			})
			.catch(() => setError('Could not load PayPal. Please refresh and try again.'));
	}, [items.length]);

	if (items.length === 0) {
		return (
			<div className="mx-auto max-w-lg py-20 text-center">
				<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-cream text-ink/60">
					<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<path d="M4 5h2l1.2 12.2a1 1 0 0 0 1 .9h8.4a1 1 0 0 0 1-.86L20 8H6" />
						<circle cx="9.5" cy="20.5" r="1.2" /><circle cx="16.5" cy="20.5" r="1.2" />
					</svg>
				</div>
				<h1 className="display mt-6 text-3xl text-ink">Your basket is empty</h1>
				<p className="mt-3 text-ink/60">Add a blend or two and they'll show up here.</p>
				<a href="/#shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-brand">
					Browse teas
				</a>
			</div>
		);
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
			{/* Form + payment */}
			<div>
				<form ref={formRef} id="checkout-form" onSubmit={(e) => e.preventDefault()}>
					<h2 className="text-xl font-bold">Contact</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<Field name="fullname" label="Full name" required placeholder="Your name" />
						<Field name="email" type="email" label="Email" required placeholder="you@email.com" />
						<Field name="phone" type="tel" label="Phone" required placeholder="+91 …" />
					</div>

					<h2 className="mt-10 text-xl font-bold">Shipping address</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Field name="address" label="Address" required placeholder="House no, street, area" />
						</div>
						<Field name="city" label="City" required placeholder="City" />
						<Field name="state" label="State" required placeholder="State" />
						<Field name="pincode" label="PIN code" required placeholder="6-digit PIN" />
					</div>
				</form>

				{/* Payment */}
				<div className="mt-10">
					<h2 className="text-xl font-bold">Payment</h2>
					{CLIENT_ID ? (
						<>
							<p className="mt-2 text-sm text-ink/55">
								Fill in your details above, then pay securely with PayPal — you'll approve the
								payment in a PayPal window and come straight back.
							</p>
							<div ref={paypalRef} className="mt-5 min-h-[52px]" />
						</>
					) : (
						<div className="mt-3 rounded-2xl border border-ink/10 bg-cream/60 p-5 text-sm text-ink/70">
							<p className="font-semibold text-ink">Online payment isn't switched on yet.</p>
							<p className="mt-1">
								We're finishing our PayPal setup. Your <strong>{formatINR(total)}</strong> order can be
								placed as soon as it's live.
							</p>
						</div>
					)}
					{error && (
						<p className="mt-3 rounded-xl bg-clay/10 px-4 py-3 text-sm font-medium text-clay">{error}</p>
					)}
				</div>
			</div>

			{/* Summary */}
			<aside className="h-fit rounded-3xl bg-paper p-6 ring-1 ring-ink/5 lg:sticky lg:top-24">
				<h2 className="text-xl font-bold">Your order</h2>
				<ul className="mt-5 space-y-4">
					{items.map((item) => (
						<li key={item.id} className="flex gap-3">
							<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
								{item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
								<span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold leading-none text-cream">
									{item.qty}
								</span>
							</div>
							<div className="flex flex-1 flex-col">
								<p className="text-sm font-semibold leading-snug">{item.name}</p>
								<div className="mt-auto flex items-center gap-2">
									<div className="inline-flex items-center rounded-full border border-ink/15 text-xs">
										<button type="button" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease" className="grid h-6 w-6 place-items-center">−</button>
										<span className="w-5 text-center tabular-nums">{item.qty}</span>
										<button type="button" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase" className="grid h-6 w-6 place-items-center">+</button>
									</div>
									<button type="button" onClick={() => removeItem(item.id)} className="text-xs text-ink/40 transition hover:text-clay">
										Remove
									</button>
								</div>
							</div>
							<span className="text-sm font-bold tabular-nums">{formatINR(item.price * item.qty)}</span>
						</li>
					))}
				</ul>

				<div className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
					<Row label="Subtotal" value={formatINR(subtotal)} />
					<Row label="Shipping" value={shipping === 0 ? 'Free' : formatINR(shipping)} />
					<div className="flex items-center justify-between border-t border-ink/10 pt-3 text-base font-bold">
						<span>Total</span>
						<span>{formatINR(total)}</span>
					</div>
				</div>
			</aside>
		</div>
	);
}

function Field({
	name,
	label,
	type = 'text',
	required = false,
	placeholder,
}: {
	name: string;
	label: string;
	type?: string;
	required?: boolean;
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="text-sm font-semibold text-ink/70">{label}</span>
			<input
				name={name}
				type={type}
				required={required}
				placeholder={placeholder}
				className="mt-1.5 w-full rounded-xl border border-ink/12 bg-cream px-4 py-3 text-[0.95rem] text-ink outline-none transition focus:border-brand focus:ring-[3px] focus:ring-brand/20"
			/>
		</label>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between text-ink/70">
			<span>{label}</span>
			<span className="font-semibold text-ink">{value}</span>
		</div>
	);
}
