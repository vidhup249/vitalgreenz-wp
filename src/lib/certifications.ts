/**
 * Government certification claims shown across the site (PDP trust badges,
 * compliance accordion, footer bar, checkout microcopy).
 *
 * A certification only renders once a real, verified number is configured —
 * FSSAI/Tea Board/Spices Board/APEDA are regulated marks, so a placeholder or
 * fabricated number must never reach the live site. Add the real values to
 * PUBLIC_FSSAI_LIC_NO / PUBLIC_SPICES_BOARD_NO / PUBLIC_APEDA_REG_NO in .env
 * (and Vercel) to switch each badge on.
 */

export type ProductType = 'tea' | 'spice' | 'kombucha';

export interface Certification {
	key: string;
	label: string;
	number: string | null;
	numberLabel: string;
	blurb: string;
	/** Product types this claim applies to. Omitted = applies to every product. */
	appliesTo?: ProductType[];
}

const FSSAI_LIC_NO = (import.meta.env.PUBLIC_FSSAI_LIC_NO as string | undefined) || null;
const SPICES_BOARD_NO = (import.meta.env.PUBLIC_SPICES_BOARD_NO as string | undefined) || null;
const APEDA_REG_NO = (import.meta.env.PUBLIC_APEDA_REG_NO as string | undefined) || null;

// Already public on the About page (client-supplied, verified) — safe to
// reuse sitewide rather than gating behind an env var.
const TEA_BOARD_REG_NO = 'TB|LC|TM|BLF|TR-10007 & TB|LC|TM|KE-10001';

export const CERTIFICATIONS: Certification[] = [
	{
		key: 'fssai',
		label: 'FSSAI Certified',
		number: FSSAI_LIC_NO,
		numberLabel: 'Lic No.',
		blurb: 'Formulated, processed and packaged in hygienic FSSAI-audited facilities.',
	},
	{
		key: 'teaBoard',
		label: 'Tea Board of India',
		number: TEA_BOARD_REG_NO,
		numberLabel: 'Reg.',
		blurb: 'Direct sourcing from registered small tea growers across India.',
		appliesTo: ['tea'],
	},
	{
		key: 'spicesBoard',
		label: 'Spices Board India',
		number: SPICES_BOARD_NO,
		numberLabel: 'Cert.',
		blurb: '100% natural, unadulterated whole & ground spices.',
		appliesTo: ['spice'],
	},
	{
		key: 'apeda',
		label: 'APEDA Registered',
		number: APEDA_REG_NO,
		numberLabel: 'Reg.',
		blurb: 'Registered for export of agricultural & processed food products.',
	},
];

/**
 * Configured certifications for a product type. Pass no product type (footer,
 * checkout) to get every configured certification regardless of scope.
 */
export function certsFor(productType?: ProductType): Certification[] {
	return CERTIFICATIONS.filter(
		(c) => c.number && (!c.appliesTo || !productType || c.appliesTo.includes(productType))
	);
}

export function productTypeOf(brand: string): ProductType | undefined {
	const b = brand.toLowerCase();
	if (b.includes('wayomile')) return 'tea';
	if (b.includes('flavvo')) return 'spice';
	if (b.includes('sbooch')) return 'kombucha';
	return undefined;
}
