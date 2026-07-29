import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface CartItem {
	id: number;
	name: string;
	price: number; // minor units (e.g. 37500 = ₹375.00)
	image: string;
	slug: string;
	qty: number;
}

/** Cart persists to localStorage so it survives page navigations (MPA). */
export const cartItems = persistentAtom<CartItem[]>('wayomile:cart', [], {
	encode: JSON.stringify,
	decode: JSON.parse,
});

/** Drawer open/close state (shared across islands on a page). */
export const isCartOpen = atom(false);

export const cartCount = computed(cartItems, (items) =>
	items.reduce((n, i) => n + i.qty, 0)
);

export const cartSubtotal = computed(cartItems, (items) =>
	items.reduce((sum, i) => sum + i.price * i.qty, 0)
);

export function addItem(item: Omit<CartItem, 'qty'>, qty = 1) {
	const items = cartItems.get();
	const existing = items.find((i) => i.id === item.id);
	if (existing) {
		cartItems.set(
			items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i))
		);
	} else {
		cartItems.set([...items, { ...item, qty }]);
	}
	isCartOpen.set(true);
}

export function setQty(id: number, qty: number) {
	if (qty <= 0) return removeItem(id);
	cartItems.set(cartItems.get().map((i) => (i.id === id ? { ...i, qty } : i)));
}

export function removeItem(id: number) {
	cartItems.set(cartItems.get().filter((i) => i.id !== id));
}

export function clearCart() {
	cartItems.set([]);
}

export function openCart() {
	isCartOpen.set(true);
}
export function closeCart() {
	isCartOpen.set(false);
}
