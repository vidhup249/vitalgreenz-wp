import { useState } from 'react';
import { addItem, type CartItem } from '../../stores/cart';

type Props = Omit<CartItem, 'qty'> & {
	/** "pill" = compact pill w/ circular badge (product cards) · "full" = wide button */
	variant?: 'pill' | 'full';
	label?: string;
};

export default function AddToCart({ variant = 'pill', label = 'Add to cart', ...item }: Props) {
	const [added, setAdded] = useState(false);

	const handle = () => {
		addItem(item);
		setAdded(true);
		setTimeout(() => setAdded(false), 1400);
	};

	if (variant === 'full') {
		return (
			<button
				onClick={handle}
				aria-label={`Add ${item.name} to cart`}
				className={`group inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-300 active:scale-[0.98] ${
					added ? 'bg-lime text-ink' : 'bg-ink text-cream hover:bg-brand'
				}`}
			>
				{added ? 'Added ✓' : label}
			</button>
		);
	}

	// Pill with circular badge (reference "Book Now ↗" style)
	return (
		<button
			onClick={handle}
			aria-label={`Add ${item.name} to cart`}
			className={`group inline-flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-sm font-semibold transition duration-300 active:scale-95 ${
				added ? 'bg-lime text-ink' : 'bg-ink text-cream hover:bg-brand'
			}`}
		>
			<span>{added ? 'Added' : label}</span>
			<span
				className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-base leading-none transition duration-300 ${
					added ? 'bg-ink text-lime' : 'bg-cream text-ink group-hover:rotate-90'
				}`}
			>
				{added ? '✓' : '+'}
			</span>
		</button>
	);
}
