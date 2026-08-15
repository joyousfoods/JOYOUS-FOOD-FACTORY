import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { QuickView } from './QuickView';

/**
 * Horizontal product carousel used for every "rail" on the homepage and
 * product page. Scroll-snap does the work; the arrows are progressive
 * enhancement for pointer users.
 */
export function ProductRail({
  title,
  subtitle,
  eyebrow,
  products = [],
  loading = false,
  viewAllTo,
  viewAllLabel = 'View all',
  skeletonCount = 4,
  compact = false,
}) {
  const trackRef = useRef(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const scrollBy = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="rail">
      <div className="rail__head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>

        <div className="rail__controls">
          {viewAllTo && (
            <Link to={viewAllTo} className="rail__viewall">
              {viewAllLabel} <ArrowRight size={15} />
            </Link>
          )}
          <div className="rail__arrows">
            <button
              type="button"
              className="rail__arrow"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="rail__arrow"
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="rail__track" ref={trackRef}>
        {loading
          ? Array.from({ length: skeletonCount }, (_, i) => (
              <div className="rail__item" key={`skeleton-${i}`}>
                <ProductCardSkeleton compact={compact} />
              </div>
            ))
          : products.map((product) => (
              <div className="rail__item" key={product.id}>
                <ProductCard
                  product={product}
                  onQuickView={setQuickViewProduct}
                  compact={compact}
                />
              </div>
            ))}
      </div>

      <QuickView
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
