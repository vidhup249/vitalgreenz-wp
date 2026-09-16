/**
 * Government certification claims shown across the site (PDP trust badges,
 * compliance accordion, footer bar, checkout microcopy) — numbers live in
 * shop.certifications and are editable at /admin/certifications.
 *
 * A certification only renders once a real, verified number is set —
 * FSSAI/Tea Board/Spices Board/APEDA are regulated marks, so a placeholder
 * or fabricated number must never reach the live site. Leaving a field
 * blank in the admin form hides that badge everywhere, immediately.
 */
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabase';

export type ProductType = 'tea' | 'spice' | 'kombucha';

export interface Certification {
	key: string;
	label: string;
	number: string | null;
	numberLabel: string;
	blurb: string;
	/** Product types this claim applies to. Null = applies to every product. */
	appliesTo: ProductType[] | null;
}

interface CertificationRow {
	key: string;
	label: string;
	number: string | null;
	number_label: string;
	blurb: string;
	applies_to: ProductType[] | null;
}

/** Server-only (service_role). Reads every configured row, numbers or not. */
export async function getCertifications(): Promise<Certification[]> {
	if (!isSupabaseAdminConfigured()) return [];
	const { data, error } = await getSupabaseAdmin()
		.from('certifications')
		.select('key, label, number, number_label, blurb, applies_to');
	if (error || !data) return [];
	return (data as unknown as CertificationRow[]).map((row) => ({
		key: row.key,
		label: row.label,
		number: row.number,
		numberLabel: row.number_label,
		blurb: row.blurb,
		appliesTo: row.applies_to,
	}));
}

export function filterCerts(certs: Certification[], productType?: ProductType): Certification[] {
	return certs.filter(
		(c) => c.number && (!c.appliesTo || !productType || c.appliesTo.includes(productType))
	);
}

/** Fetch + filter in one call — only certs with a real number, scoped to a product type. */
export async function certsFor(productType?: ProductType): Promise<Certification[]> {
	return filterCerts(await getCertifications(), productType);
}

export function productTypeOf(brand: string): ProductType | undefined {
	const b = brand.toLowerCase();
	if (b.includes('wayomile')) return 'tea';
	if (b.includes('flavvo')) return 'spice';
	if (b.includes('sbooch')) return 'kombucha';
	return undefined;
}
