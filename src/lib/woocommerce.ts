const WP_URL = import.meta.env.PUBLIC_WORDPRESS_URL;

export interface WooProduct {
	id: number;
	name: string;
	slug: string;
	permalink: string;
	on_sale: boolean;
	prices: {
		price: string;
		regular_price: string;
		sale_price: string;
		currency_symbol: string;
		currency_minor_unit: number;
	};
	images: { id: number; src: string; thumbnail: string; srcset: string; alt: string }[];
}

/** Fetch products from the public WooCommerce Store API (safe for the browser — no keys). */
export async function getProducts(perPage = 8): Promise<WooProduct[]> {
	const res = await fetch(`${WP_URL}/wp-json/wc/store/v1/products?per_page=${perPage}`);
	if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
	return res.json();
}

/** Format a Store API price (given in minor units) into a display string, e.g. "37500" -> "₹375.00". */
export function formatPrice(amount: string, prices: WooProduct['prices']): string {
	const value = Number(amount) / 10 ** prices.currency_minor_unit;
	return `${prices.currency_symbol}${value.toFixed(prices.currency_minor_unit)}`;
}
