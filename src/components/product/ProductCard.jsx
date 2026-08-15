import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Image } from '../ui/Image';
import { PriceBlock, Rating, ProductBadge, VegMark } from '../ui/Misc';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

/**
 * The single product card used on the homepage rails, the shop grid, the
 * wishlist and every "related products" strip. One component means the
 * price, badge and add-to-cart affordance behave identically everywhere.
 */
function ProductCardBase({ product, onQuickView, eager = false, compact = false }) {
  const cart = useCart();
  const wishlist = useWishlist();

  const quantity = cart.getQuantity(product.id);
  const busy = cart.isPending?.(product.id) || false;
  const saved = wishlist.has(product.id);

  const inStock = product.inStock !== false;
  const pricePaise = product.pricePaise ?? (product.price || 0) * 100;
  const mrpPaise = product.mrpPaise ?? (product.mrp || product.price || 0) * 100;
  const discountPercent = product.discountPercent ?? (
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0
  );

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    cart.addItem(product);
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    wishlist.toggle(product);
  };

  const handleQuickView = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <article className={`product-card ${compact ? 'product-card--compact' : ''}`}>
      <Link to={`/product/${product.slug}`} className="product-card__media">
        <Image
          src={product.image || product.imageUrl}
          alt={product.name}
          ratio="1"
          eager={eager}
          sizes="(max-width: 700px) 45vw, (max-width: 1100px) 30vw, 280px"
        />

        <div className="product-card__badges">
          {discountPercent > 0 && (
            <span className="discount-badge">{discountPercent}% OFF</span>
          )}
          <ProductBadge badge={product.badge} />
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            className={`product-card__action ${saved ? 'is-active' : ''}`}
            onClick={handleWishlist}
            disabled={wishlist.isPending(product.id)}
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={saved}
          >
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
          {onQuickView && (
            <button
              type="button"
              className="product-card__action"
              onClick={handleQuickView}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye size={16} />
            </button>
          )}
        </div>

        {!inStock && (
          <div className="product-card__soldout">
            <span>Sold out</span>
          </div>
        )}
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          {product.isVeg && <VegMark />}
          <span className="product-card__category">{product.category?.name || product.category}</span>
          {product.ratingCount > 0 && <Rating value={product.ratingAvg} chip />}
        </div>

        <h3 className="product-card__title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        {product.packLabel && <p className="product-card__pack">{product.packLabel}</p>}

        <div className="product-card__footer">
          <PriceBlock
            pricePaise={pricePaise}
            mrpPaise={mrpPaise}
            discountPercent={discountPercent}
          />

          {inStock ? (
            quantity > 0 ? (
              <div className="stepper stepper--sm">
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={(e) => {
                    e.preventDefault();
                    cart.setQuantity(product.id, quantity - 1);
                  }}
                  disabled={busy}
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} />
                </button>
                <span className="stepper__value">{quantity}</span>
                <button
                  type="button"
                  className="stepper__btn"
                  onClick={(e) => {
                    e.preventDefault();
                    cart.setQuantity(product.id, quantity + 1);
                  }}
                  disabled={busy}
                  aria-label="Increase quantity"
                >
                  <Plus size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="product-card__add"
                onClick={handleAdd}
                disabled={busy}
              >
                {busy ? <span className="btn__spinner" /> : <ShoppingBag size={14} />}
                Add
              </button>
            )
          ) : (
            <span className="product-card__unavailable">Unavailable</span>
          )}
        </div>

        {product.lowStock && product.inStock && (
          <p className="product-card__stock-warning">Only {product.stock} left</p>
        )}
        {product.freeShipping && <p className="product-card__ship">Free delivery</p>}
      </div>
    </article>
  );
}

// The shop grid re-renders on every filter change; the cards themselves
// only change when the product, its cart quantity or its saved state does.
export const ProductCard = memo(ProductCardBase);

export function ProductCardSkeleton({ compact = false }) {
  return (
    <div className={`product-card product-card--skeleton ${compact ? 'product-card--compact' : ''}`}>
      <div className="skeleton skeleton--image" />
      <div className="product-card__body">
        <div className="skeleton skeleton--text" style={{ width: '40%' }} />
        <div className="skeleton skeleton--title" style={{ width: '85%' }} />
        <div className="skeleton skeleton--text" style={{ width: '55%' }} />
        <div className="product-card__footer">
          <div className="skeleton skeleton--text" style={{ width: 70, height: 18 }} />
          <div className="skeleton skeleton--pill" style={{ width: 62 }} />
        </div>
      </div>
    </div>
  );
}
