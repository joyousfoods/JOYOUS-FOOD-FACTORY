/**
 * All monetary values in this codebase are integer paise.
 * These helpers exist so no arithmetic ever touches a float.
 */

export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100);

export const paiseToRupees = (paise) => Math.round(paise) / 100;

export const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paiseToRupees(paise));

/** Percentage off, rounded down so we never overstate a discount. */
export const discountPercent = (mrpPaise, pricePaise) => {
  if (!mrpPaise || mrpPaise <= pricePaise) return 0;
  return Math.floor(((mrpPaise - pricePaise) / mrpPaise) * 100);
};

export const clampPaise = (value, min, max) =>
  Math.max(min, Math.min(max, Math.round(value)));
