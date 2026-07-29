import { useState } from 'react';
import { addItem } from '../../stores/cart';
import { openCart } from '../../stores/cart';

interface Props {
	id: number;
	name: string;
	price: number; // minor units
	image: string;
	slug: string;
	optionLabel?: string;
	options?: string[];
}

export default function ProductBuy({ id, name, price, image, slug, optionLabel, options = [] }: Props) {
	const [qty, setQty] = useState(1);
	const [selected, setSelected] = useState(options[0] ?? '');
	const [added, setAdded] = useState(false);

	const handleAdd = () => {
		const label = selected ? `${name} — ${selected}` : name;
		addItem({ id, name: label, price, image, slug }, qty);
		openCart();
		setAdded(true);
		setTimeout(() => setAdded(false), 1600);
	};

	return (
		<div className="mt-8">
			{options.length > 0 && (
				<div className="mb-6">
					<p className="mb-2 text-sm font-semibold text-ink/70">{optionLabel || 'Option'}</p>
					<div className="flex flex-wrap gap-2">
						{options.map((o) => (
							<button
								key={o}
								onClick={() => setSelected(o)}
								className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-300 ${
									selected === o
										? 'border-ink bg-ink text-cream'
										: 'border-ink/15 text-ink hover:border-ink/40'
								}`}
							>
								{o}
							</button>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3">
				{/* Quantity stepper */}
				<div className="inline-flex items-center rounded-full border border-ink/15">
					<button
						onClick={() => setQty((q) => Math.max(1, q - 1))}
						aria-label="Decrease quantity"
						className="grid h-12 w-12 place-items-center rounded-full text-lg transition hover:bg-ink/5"
					>
						−
					</button>
					<span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
					<button
						onClick={() => setQty((q) => q + 1)}
						aria-label="Increase quantity"
						className="grid h-12 w-12 place-items-center rounded-full text-lg transition hover:bg-ink/5"
					>
						+
					</button>
				</div>

				{/* Add to cart */}
				<button
					onClick={handleAdd}
					className={`group inline-flex flex-1 items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition duration-300 active:scale-[0.98] ${
						added ? 'bg-lime text-ink' : 'bg-ink text-cream hover:bg-brand'
					}`}
				>
					{added ? (
						<>
							<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
								<path d="M20 6 9 17l-5-5" />
							</svg>
							Added to cart
						</>
					) : (
						<>
							<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-rotate-6">
								<path d="M4 5h2l1.2 12.2a1 1 0 0 0 1 .9h8.4a1 1 0 0 0 1-.86L20 8H6" />
								<circle cx="9.5" cy="20.5" r="1.1" />
								<circle cx="16.5" cy="20.5" r="1.1" />
							</svg>
							Add to cart
						</>
					)}
				</button>
			</div>
		</div>
	);
}
