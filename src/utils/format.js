/** All amounts crossing the API are integer paise. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrWithPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

export const formatPrice = (paise) => {
  const value = (paise ?? 0) / 100;
  return Number.isInteger(value) ? inr.format(value) : inrWithPaise.format(value);
};

export const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );

/** "2 days ago" / "in 3 hours" for order timelines and notifications. */
export const formatRelative = (value) => {
  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' });

  const units = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];

  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return 'just now';
};

export const statusLabel = (status) =>
  String(status || '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const pluralise = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
