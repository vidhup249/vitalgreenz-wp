const WP_URL = import.meta.env.PUBLIC_WORDPRESS_URL;

export interface WooImage {
	id: number;
	src: string;
	thumbnail: string;
	srcset: string;
	alt: string;
}

export interface WooCategory {
	id: number;
	name: string;
	slug: string;
}

export interface WooAttribute {
	id: number;
	name: string;
	terms: { id: number; name: string; slug: string }[];
}

export interface WooProduct {
	id: number;
	name: string;
	slug: string;
	permalink: string;
	type: string;
	description: string;
	short_description: string;
	on_sale: boolean;
	attributes?: WooAttribute[];
	prices: {
		price: string;
		regular_price: string;
		sale_price: string;
		currency_symbol: string;
		currency_minor_unit: number;
	};
	average_rating: string;
	review_count: number;
	images: WooImage[];
	categories: WooCategory[];
}

/** Fetch with a timeout + retries, so a slow/flaky WooCommerce host doesn't fail the build. */
async function fetchJSON(url: string, attempts = 3, timeoutMs = 20000): Promise<any> {
	let lastErr: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			return await res.json();
		} catch (err) {
			lastErr = err;
			// brief backoff before retrying
			if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
		}
	}
	throw new Error(`Failed to fetch ${url} after ${attempts} attempts: ${lastErr}`);
}

/**
 * Fetch products from the public WooCommerce Store API (browser-safe — no keys).
 *
 * Memoised by perPage: the homepage renders several components that each need the
 * product list (Story, FeatureCards, ProductShowcase, FlavourFinder). Without this
 * cache each would fire its own sequential request, and because Astro streams HTML
 * the below-hero content wouldn't flush until all of them resolved (~3s on a slow
 * host). Sharing one in-flight promise collapses that to a single fetch.
 */
const productsCache = new Map<number, Promise<WooProduct[]>>();

export function getProducts(perPage = 100): Promise<WooProduct[]> {
	let pending = productsCache.get(perPage);
	if (!pending) {
		pending = fetchJSON(`${WP_URL}/wp-json/wc/store/v1/products?per_page=${perPage}`).catch(
			(err) => {
				// Don't cache failures — let the next caller retry.
				productsCache.delete(perPage);
				throw err;
			}
		);
		productsCache.set(perPage, pending);
	}
	return pending;
}

/** Fetch a single product (full detail incl. description + attributes). */
export async function getProduct(id: number): Promise<WooProduct> {
	return fetchJSON(`${WP_URL}/wp-json/wc/store/v1/products/${id}`);
}

/** WooCommerce sometimes stores term names with stray quotes/slashes — tidy them. */
export function cleanTerm(name: string): string {
	return name.replace(/^["'\\]+|["'\\]+$/g, '').trim();
}

// Curated display order (by WooCommerce product name).
// Note: "Premium Tea" is the "Premium Tea Granules" listing on the price chart.
export const DISPLAY_ORDER = [
	'Premium Rose Tea',
	'Premium Saffron Tea',
	'Indian Masala Tea',
	'Premium Tea',
	'Premium Green Tea',
	'Premium Orthodox Black Tea',
];

export function orderProducts(products: WooProduct[]): WooProduct[] {
	const rank = (name: string) => {
		const i = DISPLAY_ORDER.indexOf(name);
		return i === -1 ? Number.MAX_SAFE_INTEGER : i;
	};
	return [...products].sort((a, b) => rank(a.name) - rank(b.name));
}

/** Get products in curated order, plus the distinct category list for filter chips. */
export async function getShopData() {
	const products = orderProducts(await getProducts(100));
	const map = new Map<number, WooCategory>();
	for (const p of products) {
		for (const c of p.categories) {
			if (c.name.toLowerCase() !== 'uncategorized') map.set(c.id, c);
		}
	}
	return { products, categories: [...map.values()] };
}

/** Store API prices come in minor units. "37500" -> "₹375". */
export function formatPrice(amount: string, prices: WooProduct['prices']): string {
	const value = Number(amount) / 10 ** prices.currency_minor_unit;
	return `${prices.currency_symbol}${value.toLocaleString('en-IN', {
		minimumFractionDigits: value % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	})}`;
}

/** Old backend brand → current storefront brand. Applied to all displayed copy. */
export function normalizeBrand(text: string): string {
	return text.replace(/vital\s*greenz/gi, 'Wayomile');
}

/** Strip HTML tags from WooCommerce rich-text fields for safe short summaries. */
export function stripHtml(html: string, max = 120): string {
	const text = normalizeBrand(html)
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}
