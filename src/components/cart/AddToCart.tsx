import { useState } from 'react';
import { addItem, type CartItem } from '../../stores/cart';

type Props = Omit<CartItem, 'qty'> & {
	/** "full" = wide labelled button (product cards) · "compact" = smaller labelled button */
	variant?: 'full' | 'compact';
	label?: string;
};

function CartIcon() {
	return (
		<svg
			width="17"
			height="17"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.9"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M4 5h2l1.2 12.2a1 1 0 0 0 1 .9h8.4a1 1 0 0 0 1-.86L20 8H6" />
			<circle cx="9.5" cy="20.5" r="1.1" />
			<circle cx="16.5" cy="20.5" r="1.1" />
		</svg>
	);
}

export default function AddToCart({ variant = 'full', label = 'Add to cart', ...item }: Props) {
	const [added, setAdded] = useState(false);

	const handle = () => {
		addItem(item);
		setAdded(true);
		setTimeout(() => setAdded(false), 1400);
	};

	const size = variant === 'full' ? 'w-full px-5 py-3' : 'px-4 py-2.5';

	return (
		<button
			onClick={handle}
			aria-label={`Add ${item.name} to cart`}
			className={`group inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-300 active:scale-[0.97] ${size} ${
				added ? 'bg-lime text-ink' : 'bg-ink text-cream hover:bg-brand'
			}`}
		>
			<span className={`transition-transform duration-300 ${added ? 'scale-110' : 'group-hover:-rotate-6'}`}>
				{added ? (
					<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<path d="M20 6 9 17l-5-5" />
					</svg>
				) : (
					<CartIcon />
				)}
			</span>
			{added ? 'Added' : label}
		</button>
	);
}
