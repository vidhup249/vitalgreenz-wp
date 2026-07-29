import { useState } from 'react';
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

const vibes = [
	{ emoji: '🌹', label: 'Floral & calming', note: 'soft, aromatic, unwinding', match: 'rose', color: '#e0669a' },
	{ emoji: '🌼', label: 'Rich & indulgent', note: 'luxurious and golden', match: 'saffron', color: '#e7a33a' },
	{ emoji: '🫚', label: 'Warm & spiced', note: 'bold masala warmth', match: 'masala', color: '#b0562b' },
	{ emoji: '🌿', label: 'Fresh & light', note: 'clean, grassy, bright', match: 'green', color: '#3f7d54' },
	{ emoji: '🖤', label: 'Bold & classic', note: 'full-bodied and malty', match: 'orthodox', color: '#4a2c1a' },
	{ emoji: '☕', label: 'Easy everyday', note: 'the reliable daily cup', match: 'premium tea', color: '#1f6b3b' },
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
		// exact-ish match on the keyword, else fall back to the first product
		return (
			products.find((p) => lower(p.name).includes(match)) ||
			(match === 'premium tea'
				? products.find((p) => lower(p.name) === 'premium tea')
				: undefined) ||
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
		<div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
			{/* Vibe picker */}
			<div className="order-2 lg:order-1">
				<p className="text-xs font-bold uppercase tracking-widest text-brand">Pick your vibe</p>
				<div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
					{vibes.map((v) => {
						const on = active?.match === v.match;
						return (
							<button
								key={v.match}
								onClick={() => pick(v)}
								className={`flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition duration-300 active:scale-95 ${
									on
										? 'border-ink bg-ink text-cream shadow-lg'
										: 'border-ink/12 bg-paper text-ink hover:-translate-y-0.5 hover:border-ink/40'
								}`}
							>
								<span className="text-2xl">{v.emoji}</span>
								<span className="text-sm font-bold leading-tight">{v.label}</span>
								<span className={`text-xs ${on ? 'text-cream/70' : 'text-ink/55'}`}>{v.note}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Recommendation */}
			<div className="order-1 lg:order-2">
				<div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-cream">
					<div
						className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full blur-3xl transition-colors duration-700"
						style={{ background: active?.color ?? '#1f6b3b', opacity: 0.35 }}
					/>
					<p className="eyebrow text-cream/60">{product ? 'Your match' : 'Your match awaits'}</p>

					<div className="my-6 flex justify-center">
						<div
							className="grid h-40 w-40 place-items-center overflow-hidden rounded-full text-5xl shadow-inner transition-all duration-700 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
							style={{
								background: `radial-gradient(circle at 35% 30%, ${active?.color ?? '#3f7d54'}, #123f24)`,
								transform: added ? 'scale(1.08) rotate(-6deg)' : 'scale(1)',
							}}
						>
							{product?.image ? (
								<img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
							) : (
								<span>🍵</span>
							)}
						</div>
					</div>

					{product ? (
						<>
							<h3 className="text-center text-2xl font-bold">{product.name}</h3>
							<p className="mx-auto mt-2 max-w-xs text-center text-sm text-cream/70">
								{product.summary || `A ${active?.note} cup — packed fresh when you order.`}
							</p>
							<div className="mt-6 flex items-center justify-between rounded-full bg-white/10 p-1.5 pl-5">
								<span className="text-lg font-bold tabular-nums">{formatINR(product.price)}</span>
								<div className="flex items-center gap-1.5">
									<a
										href={product.permalink}
										className="hidden rounded-full px-3 py-2.5 text-sm font-semibold text-cream/80 transition hover:text-cream sm:inline"
									>
										Details
									</a>
									<button
										onClick={handleAdd}
										className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 ${
											added ? 'bg-lime text-ink' : 'bg-cream text-ink hover:bg-lime'
										}`}
									>
										{added ? 'Added ✓' : 'Add to cart'}
									</button>
								</div>
							</div>
						</>
					) : (
						<p className="mx-auto max-w-xs text-center text-sm text-cream/70">
							Tap a vibe and we'll point you to the blend you'll love.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
