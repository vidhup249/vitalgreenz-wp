/** Format an INR amount given in minor units (paise). 37500 -> "₹375". */
export function formatINR(minor: number): string {
	const value = minor / 100;
	return `₹${value.toLocaleString('en-IN', {
		minimumFractionDigits: value % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	})}`;
}
