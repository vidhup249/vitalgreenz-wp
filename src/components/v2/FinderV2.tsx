import { useState } from 'react';
import { addItem } from '../../stores/cart';
import { formatINR } from '../../lib/format';

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
	{ label: 'Floral & calming', note: 'soft, aromatic, unwinding', match: 'rose' },
	{ label: 'Rich & indulgent', note: 'luxurious and golden', match: 'saffron' },
	{ label: 'Warm & spiced', note: 'bold masala warmth', match: 'masala' },
	{ label: 'Fresh & light', note: 'clean, grassy, bright', match: 'green' },
	{ label: 'Bold & classic', note: 'full-bodied and malty', match: 'orthodox' },
	{ label: 'Easy everyday', note: 'the reliable daily cup', match: 'premium tea' },
];

/**
 * Flavour finder — "Edition" styling.
 * Same matching behaviour as the original, rebuilt as a quiet two-panel
 * list so the section stays uncluttered.
 */
export default function FinderV2({ products }: { products: FinderProduct[] }) {
	// Starts on the first mood so the match panel reads as a worked example
	// rather than a large empty card.
	const [active, setActive] = useState<(typeof vibes)[number] | null>(vibes[0]);
	const [added, setAdded] = useState(false);

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
		addItem({
			id: product.id,
			name: product.name,
			price: product.price,
			image: product.image,
			slug: product.slug,
		});
		setAdded(true);
		setTimeout(() => setAdded(false), 1600);
	};

	return (
		<div className="split">
			{/* ---------------- 01 · the picker ---------------- */}
			<div className="panel card-dark">
				<p className="panel-step" style={{ color: 'var(--on-dark-mute)' }}>
					01 — Your mood
				</p>
				<h3 className="d3" style={{ marginTop: '1.25rem', marginBottom: '2.5rem' }}>
					What are you
					<br />
					<span style={{ color: 'var(--on-dark-mute)' }}>in the mood for?</span>
				</h3>

				<div className="moods">
					{vibes.map((v) => (
						<button
							key={v.match}
							className="mood"
							data-on={active?.match === v.match ? 'true' : 'false'}
							onClick={() => {
								setActive(v);
								setAdded(false);
							}}
						>
							<span className="mood-label">{v.label}</span>
							<span className="mood-dot" />
						</button>
					))}
				</div>
			</div>

			{/* ---------------- 02 · the match ---------------- */}
			<div className="panel card">
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
					<p className="panel-step">02 — Your match</p>
					{active && <p className="panel-step" style={{ color: 'var(--ink)' }}>{active.label}</p>}
				</div>

				{product ? (
					<>
						<div className="match-media">
							{product.image && <img src={product.image} alt={product.name} loading="lazy" />}
						</div>

						<h3 className="d3" style={{ textAlign: 'center' }}>
							{product.name}
						</h3>
						<p
							className="body"
							style={{ textAlign: 'center', margin: '0.85rem auto 0', maxWidth: '32ch' }}
						>
							{product.summary || `A ${active?.note} cup — packed fresh when you order.`}
						</p>

						<div className="match-price">
							<span className="pcard-price">{formatINR(product.price)}</span>
							<span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
								<a href={product.permalink} className="btn btn-ghost" style={{ padding: '0.8rem 1.25rem' }}>
									Details
								</a>
								<button
									onClick={handleAdd}
									className="btn btn-dark"
									style={{
										padding: '0.8rem 1.35rem',
										background: added ? 'var(--accent)' : undefined,
									}}
								>
									{added ? 'Added ✓' : 'Add to cart'}
								</button>
							</span>
						</div>
					</>
				) : (
					<div
						style={{
							margin: 'auto',
							textAlign: 'center',
							paddingBlock: '3rem',
							maxWidth: '26ch',
						}}
					>
						<span
							aria-hidden="true"
							style={{
								display: 'block',
								width: '54px',
								height: '1px',
								background: 'var(--line-2)',
								margin: '0 auto 2rem',
							}}
						/>
						<p className="body">Tap a mood and we'll point you to the blend you'll love.</p>
					</div>
				)}
			</div>
		</div>
	);
}
