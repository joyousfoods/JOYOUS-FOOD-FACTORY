import { Star } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export function Rating({ value = 0, count, size = 13, showCount = true, chip = false }) {
  const rounded = Math.round(value * 2) / 2;

  if (chip) {
    return (
      <span className="rating rating--chip">
        {value.toFixed(1)} <Star size={9} fill="currentColor" />
      </span>
    );
  }

  return (
    <span className="rating">
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= rounded ? 'currentColor' : 'none'}
            strokeWidth={1.6}
            style={{ opacity: star <= rounded ? 1 : 0.35 }}
          />
        ))}
      </span>
      {showCount && count > 0 && <span className="rating__count">({count})</span>}
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{count ? ` from ${count} reviews` : ''}
      </span>
    </span>
  );
}

export function PriceBlock({ pricePaise, mrpPaise, discountPercent, size }) {
  const hasDiscount = mrpPaise > pricePaise;

  return (
    <div className={`price ${size === 'lg' ? 'price--lg' : ''}`}>
      <span className="price__current">{formatPrice(pricePaise)}</span>
      {hasDiscount && (
        <>
          <span className="price__mrp">{formatPrice(mrpPaise)}</span>
          <span className="price__off">{discountPercent}% off</span>
        </>
      )}
    </div>
  );
}

export function Badge({ variant = 'neutral', children, className = '' }) {
  return <span className={`badge badge--${variant} ${className}`}>{children}</span>;
}

export function Alert({ variant = 'info', icon: Icon, children }) {
  return (
    <div className={`alert alert--${variant}`} role={variant === 'danger' ? 'alert' : undefined}>
      {Icon && <Icon size={16} />}
      <div>{children}</div>
    </div>
  );
}

export function VegMark() {
  return <span className="veg-mark" title="Vegetarian" aria-label="Vegetarian" />;
}

/** Maps a product badge string from the DB onto a visual variant. */
export function ProductBadge({ badge }) {
  if (!badge) return null;

  const variant =
    {
      Bestseller: 'gold',
      New: 'pink',
      Classic: 'neutral',
      'Free Shipping': 'success',
      'Bulk Save': 'info',
      'Most Popular': 'gold',
    }[badge] || 'neutral';

  return <Badge variant={variant}>{badge}</Badge>;
}
