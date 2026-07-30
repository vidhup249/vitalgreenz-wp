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
			className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full transition duration-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold ${
				isLight ? 'bg-white/15 text-white backdrop-blur hover:bg-white/25' : 'bg-ink text-cream hover:bg-brand-dark'
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
			{/* Count: floating badge on the mobile circle, inline chip on desktop */}
			<span
				className={`absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] font-bold leading-none tabular-nums text-ink transition sm:static sm:right-auto sm:top-auto ${
					count > 0 ? 'scale-100' : 'scale-0'
				}`}
			>
				{count}
			</span>
		</button>
	);
}
