import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, cartSubtotal, setQty, removeItem, clearCart } from '../../stores/cart';
import { formatINR } from '../../lib/format';

const FREE_SHIP_THRESHOLD = 50000; // ₹500
const FLAT_SHIP = 4900; // ₹49

export default function Checkout() {
	const items = useStore(cartItems);
	const subtotal = useStore(cartSubtotal);
	const [placed, setPlaced] = useState(false);

	const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIP;
	const total = subtotal + shipping;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}
		// NOTE: no payment gateway / WooCommerce order creation wired yet.
		// Next step: POST to WooCommerce Store API /checkout or a Razorpay flow.
		clearCart();
		setPlaced(true);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	if (placed) {
		return (
			<div className="mx-auto max-w-lg py-20 text-center">
				<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime text-4xl">✓</div>
				<h1 className="display mt-6 text-4xl text-ink">Order placed!</h1>
				<p className="mt-3 text-ink/65 text-pretty">
					Thank you — we've got your order and we'll email a confirmation shortly. Your tea will be
					packed fresh and on its way soon.
				</p>
				<a href="/#shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-cream transition hover:bg-brand">
					Continue shopping
				</a>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="mx-auto max-w-lg py-20 text-center">
				<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-cream text-4xl">🛒</div>
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
			{/* Form */}
			<form id="checkout-form" onSubmit={handleSubmit}>
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

				<button
					type="submit"
					className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-cream transition duration-300 hover:bg-brand"
				>
					Place order · {formatINR(total)}
					<span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
				</button>
				<p className="mt-3 text-center text-xs text-ink/45">
					Demo checkout — no payment is taken yet. Payment &amp; order creation come next.
				</p>
			</form>

			{/* Summary */}
			<aside className="h-fit rounded-3xl bg-paper p-6 ring-1 ring-ink/5 lg:sticky lg:top-24">
				<h2 className="text-xl font-bold">Your order</h2>
				<ul className="mt-5 space-y-4">
					{items.map((item) => (
						<li key={item.id} className="flex gap-3">
							<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
								{item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
								<span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-cream">
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
