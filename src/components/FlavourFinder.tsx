import { useState } from 'react';
import type { ReactNode } from 'react';
import { addItem } from '../stores/cart';
import { formatINR } from '../lib/format';

export interface FinderProduct {
	id: number;
	name: string;
	price: number; // minor units
	image: string;
	permalink: string;
	slug: string;
	summary: string;
}

/* ----------------------------- Line icons ----------------------------- */
const iconPaths: Record<string, ReactNode> = {
	flower: (
		<>
			<circle cx="12" cy="12" r="3" />
			<path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
			<path d="M12 7.5V9M7.5 12H9M16.5 12H15M12 16.5V15" />
		</>
	),
	sparkles: (
		<>
			<path d="M9.94 14.06A2 2 0 0 0 8.5 12.6l-5.2-1.35a.4.4 0 0 1 0-.78L8.5 9.12A2 2 0 0 0 9.94 7.68l1.35-5.2a.4.4 0 0 1 .78 0l1.35 5.2A2 2 0 0 0 14.86 9.1l5.2 1.35a.4.4 0 0 1 0 .78l-5.2 1.35a2 2 0 0 0-1.44 1.44l-1.35 5.2a.4.4 0 0 1-.78 0z" />
			<path d="M19 4v3M20.5 5.5h-3" />
		</>
	),
	flame: (
		<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
	),
	leaf: (
		<>
			<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
			<path d="M2 21c0-3 1.85-5.36 5.08-6" />
		</>
	),
	coffee: (
		<>
			<path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
			<path d="M6 2v2M10 2v2M14 2v2" />
		</>
	),
	sun: (
		<>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</>
	),
};

function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			{iconPaths[name]}
		</svg>
	);
}

const vibes = [
	{ icon: 'flower', label: 'Floral & calming', note: 'soft, aromatic, unwinding', match: 'rose', color: '#e0669a' },
	{ icon: 'sparkles', label: 'Rich & indulgent', note: 'luxurious and golden', match: 'saffron', color: '#e7a33a' },
	{ icon: 'flame', label: 'Warm & spiced', note: 'bold masala warmth', match: 'masala', color: '#b0562b' },
	{ icon: 'leaf', label: 'Fresh & light', note: 'clean, grassy, bright', match: 'green', color: '#3f7d54' },
	{ icon: 'coffee', label: 'Bold & classic', note: 'full-bodied and malty', match: 'orthodox', color: '#4a2c1a' },
	{ icon: 'sun', label: 'Easy everyday', note: 'the reliable daily cup', match: 'premium tea', color: '#1f6b3b' },
];

export default function FlavourFinder({ products }: { products: FinderProduct[] }) {
	const [active, setActive] = useState<(typeof vibes)[number] | null>(null);
	const [added, setAdded] = useState(false);

	const pick = (vibe: (typeof vibes)[number]) => {
		setActive(vibe);
		setAdded(false);
	};

	const findProduct = (match: string): FinderProduct | undefined => {
		const lower = (s: string) => s.toLowerCase();
		return (
			products.find((p) => lower(p.name).includes(match)) ||
			(match === 'premium tea' ? products.find((p) => lower(p.name) === 'premium tea') : undefined) ||
			products[0]
		);
	};

	const product = active ? findProduct(active.match) : null;

	const handleAdd = () => {
		if (!product) return;
		addItem({ id: product.id, name: product.name, price: product.price, image: product.image, slug: product.slug });
		setAdded(true);
		setTimeout(() => setAdded(false), 1600);
	};

	return (
		<div className="grid gap-5 lg:grid-cols-2">
			{/* ---------------- Card 1 · dark · the picker ---------------- */}
			<div className="relative isolate overflow-hidden rounded-[2rem] bg-ink p-8 text-cream sm:p-10">
				{/* Floating decorative graphic */}
				<div
					className="animate-float-y pointer-events-none absolute -right-8 -top-8 -z-10 opacity-[0.07]"
					style={{ animationDuration: '7s' }}
					aria-hidden="true"
				>
					<Icon name="leaf" className="h-40 w-40" />
				</div>

				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/45">01 — Your mood</p>
				<h3 className="mt-4 text-2xl font-bold leading-[1.1] sm:text-3xl">
					What are you<br />
					<span className="text-cream/40">in the mood for?</span>
				</h3>

				<div className="mt-8 grid grid-cols-2 gap-2.5">
					{vibes.map((v) => {
						const on = active?.match === v.match;
						return (
							<button
								key={v.match}
								onClick={() => pick(v)}
								className={`group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-300 active:scale-[0.98] ${
									on ? 'border-lime bg-white/10' : 'border-white/10 hover:border-white/25 hover:bg-white/5'
								}`}
							>
								<span
									className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition duration-300 ${
										on ? 'bg-lime text-ink' : 'bg-white/10 text-cream'
									}`}
								>
									<Icon name={v.icon} className="h-[18px] w-[18px]" />
								</span>
								<span className="text-sm font-semibold leading-tight">{v.label}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* ---------------- Card 2 · light · the result ---------------- */}
			<div className="relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-paper p-8 ring-1 ring-ink/5 sm:p-10">
				<div className="flex items-center justify-between">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">02 — Your match</p>
					{active && (
						<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50">
							<Icon name={active.icon} className="h-4 w-4" />
							{active.label}
						</span>
					)}
				</div>

				{product ? (
					<div className="mt-4 flex flex-1 flex-col">
						{/* Floating product image + accent chip */}
						<div className="relative flex justify-center py-4">
							<div
								className="animate-float-y h-44 w-44 overflow-hidden rounded-[1.75rem] bg-cream shadow-[0_34px_60px_-24px_rgba(16,36,26,0.4)]"
								style={{ animationDuration: '5s' }}
							>
								{product.image && (
									<img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
								)}
							</div>
							<span
								className="animate-float-y absolute right-[18%] top-2 grid h-11 w-11 place-items-center rounded-2xl text-cream shadow-lg"
								style={{ background: active?.color ?? '#1f6b3b', animationDuration: '4s', animationDelay: '-1s' }}
							>
								<Icon name={active?.icon ?? 'leaf'} className="h-5 w-5" />
							</span>
						</div>

						<h3 className="mt-2 text-center text-2xl font-bold text-ink">{product.name}</h3>
						<p className="mx-auto mt-2 max-w-xs text-center text-sm text-ink/55 text-pretty">
							{product.summary || `A ${active?.note} cup — packed fresh when you order.`}
						</p>

						<div className="mt-auto flex items-center justify-between gap-3 rounded-full bg-ink p-1.5 pl-5 text-cream">
							<span className="text-lg font-bold tabular-nums">{formatINR(product.price)}</span>
							<div className="flex items-center gap-1">
								<a
									href={product.permalink}
									className="hidden rounded-full px-3 py-2.5 text-sm font-semibold text-cream/70 transition hover:text-cream sm:inline"
								>
									Details
								</a>
								<button
									onClick={handleAdd}
									className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 ${
										added ? 'bg-lime text-ink' : 'bg-cream text-ink hover:bg-lime'
									}`}
								>
									{added ? (
										<>
											<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M20 6 9 17l-5-5" />
											</svg>
											Added
										</>
									) : (
										'Add to cart'
									)}
								</button>
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
						{/* Floating placeholder illustration */}
						<div className="animate-float-y relative text-ink/25" style={{ animationDuration: '5s' }} aria-hidden="true">
							<svg width="88" height="88" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M14 30h30v10a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12Z" />
								<path d="M44 32h4a7 7 0 1 1 0 14h-2" />
								<path d="M22 22c-1.5-2-1.5-4 0-6M30 22c-1.5-2-1.5-4 0-6M38 22c-1.5-2-1.5-4 0-6" className="animate-float-y" />
							</svg>
						</div>
						<p className="mt-6 max-w-xs text-sm text-ink/55">
							Tap a mood and we'll point you to the blend you'll love.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
