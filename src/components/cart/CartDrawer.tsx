import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
	cartItems,
	cartSubtotal,
	isCartOpen,
	closeCart,
	setQty,
	removeItem,
} from '../../stores/cart';
import { formatINR } from '../../lib/format';

const FREE_SHIP_THRESHOLD = 50000; // ₹500

export default function CartDrawer() {
	const items = useStore(cartItems);
	const subtotal = useStore(cartSubtotal);
	const open = useStore(isCartOpen);

	// Lock scroll (Lenis + native) + close on Escape while open.
	useEffect(() => {
		if (open) {
			const lenis = (window as any).lenis;
			lenis?.stop();
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
			window.addEventListener('keydown', onKey);
			return () => {
				lenis?.start();
				document.body.style.overflow = prev;
				window.removeEventListener('keydown', onKey);
			};
		}
	}, [open]);

	const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
	const progress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

	return (
		<>
			{/* Backdrop */}
			<div
				onClick={closeCart}
				aria-hidden={!open}
				className={`fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm transition-opacity duration-500 ${
					open ? 'opacity-100' : 'pointer-events-none opacity-0'
				}`}
			/>

			{/* Panel */}
			<aside
				role="dialog"
				aria-label="Shopping cart"
				aria-modal="true"
				className={`fixed right-0 top-0 z-[70] flex h-[100dvh] w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
					open ? 'translate-x-0' : 'translate-x-full'
				}`}
			>
				{/* Header */}
				<header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
					<div>
						<p className="eyebrow text-ink/60">Your basket</p>
						<h2 className="mt-1 text-xl font-bold">
							{items.length ? `${items.length} blend${items.length > 1 ? 's' : ''}` : 'Empty'}
						</h2>
					</div>
					<button
						onClick={closeCart}
						aria-label="Close cart"
						className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 transition hover:bg-ink/10 hover:rotate-90"
					>
						<span className="text-xl leading-none">&times;</span>
					</button>
				</header>

				{/* Free-ship meter */}
				{items.length > 0 && (
					<div className="border-b border-ink/10 px-6 py-4">
						<p className="text-sm text-ink/70">
							{remaining > 0 ? (
								<>
									You're <span className="font-semibold text-brand">{formatINR(remaining)}</span> away from free
									shipping
								</>
							) : (
								<span className="font-semibold text-brand">You've unlocked free shipping!</span>
							)}
						</p>
						<div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
							<div
								className="h-full rounded-full bg-lime transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Items */}
				<div className="flex-1 overflow-y-auto px-6 py-4">
					{items.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-cream text-ink/60">
								<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
									<path d="M6 2v2M10 2v2M14 2v2" />
								</svg>
							</div>
							<p className="font-semibold">Nothing steeping yet</p>
							<p className="mt-1 text-sm text-ink/60">Add a blend and it'll appear here.</p>
							<button
								onClick={closeCart}
								className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand"
							>
								Browse teas
							</button>
						</div>
					) : (
						<ul className="space-y-4">
							{items.map((item) => (
								<li key={item.id} className="flex gap-4">
									<div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
										{item.image && (
											<img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
										)}
									</div>
									<div className="flex flex-1 flex-col">
										<div className="flex items-start justify-between gap-2">
											<p className="text-sm font-semibold leading-snug">{item.name}</p>
											<button
												onClick={() => removeItem(item.id)}
												aria-label={`Remove ${item.name}`}
												className="text-ink/40 transition hover:text-clay"
											>
												<span className="text-sm">Remove</span>
											</button>
										</div>
										<p className="mt-0.5 text-sm text-ink/60">{formatINR(item.price)}</p>
										<div className="mt-auto flex items-center gap-3">
											<div className="inline-flex items-center rounded-full border border-ink/15">
												<button
													onClick={() => setQty(item.id, item.qty - 1)}
													aria-label="Decrease quantity"
													className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-ink/5"
												>
													−
												</button>
												<span className="w-6 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
												<button
													onClick={() => setQty(item.id, item.qty + 1)}
													aria-label="Increase quantity"
													className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-ink/5"
												>
													+
												</button>
											</div>
											<span className="ml-auto text-sm font-bold">{formatINR(item.price * item.qty)}</span>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Footer */}
				{items.length > 0 && (
					<footer className="border-t border-ink/10 px-6 py-5">
						<div className="flex items-center justify-between">
							<span className="text-sm text-ink/60">Subtotal</span>
							<span className="text-lg font-bold">{formatINR(subtotal)}</span>
						</div>
						<p className="mt-1 text-xs text-ink/50">Taxes &amp; shipping calculated at checkout.</p>
						<a
							href="/checkout"
							className="group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-semibold text-cream transition duration-300 hover:bg-brand"
						>
							Checkout
							<span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
						</a>
					</footer>
				)}
			</aside>
		</>
	);
}
