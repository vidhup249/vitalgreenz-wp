import { useStore } from '@nanostores/react';
import { cartCount, openCart } from '../../stores/cart';

interface Props {
	variant?: 'dark' | 'light';
}

export default function CartButton({ variant = 'dark' }: Props) {
	const count = useStore(cartCount);
	const isLight = variant === 'light';

	return (
		<button
			onClick={openCart}
			aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
			className={`group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-300 ${
				isLight
					? 'bg-white/15 text-white backdrop-blur hover:bg-white/25'
					: 'bg-ink text-cream hover:bg-brand-dark'
			}`}
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="transition-transform duration-300 group-hover:-rotate-6"
			>
				<path d="M4 5h2l1.2 12.2a1 1 0 0 0 1 .9h8.4a1 1 0 0 0 1-.86L20 8H6" />
				<circle cx="9.5" cy="20.5" r="1.2" />
				<circle cx="16.5" cy="20.5" r="1.2" />
			</svg>
			<span className="hidden sm:inline">Cart</span>
			<span
				className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold tabular-nums transition ${
					count > 0 ? 'scale-100' : 'scale-0'
				} ${isLight ? 'bg-lime text-ink' : 'bg-lime text-ink'}`}
			>
				{count}
			</span>
		</button>
	);
}
