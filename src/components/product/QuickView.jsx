import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Truck, Minus, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Image } from '../ui/Image';
import { Button } from '../ui/Button';
import { PriceBlock, Rating, VegMark, Badge } from '../ui/Misc';
import { Spinner } from '../ui/States';
import { productApi } from '../../api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

/**
 * Lets a customer check pack size, price and description without losing
 * their place in the grid. Fetches the full record on open, because the
 * card payload deliberately omits the long description.
 */
export function QuickView({ product, open, onClose }) {
  const cart = useCart();
  const wishlist = useWishlist();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open || !product) return undefined;

    let cancelled = false;
    setLoading(true);
    setQuantity(1);
    setDetail(null);

    productApi
      .detail(product.slug)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        // Fall back to the card data we already have rather than
        // showing an error for a convenience surface.
        if (!cancelled) setDetail(product);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, product]);

  if (!product) return null;

  const shown = detail || product;
  const saved = wishlist.has(product.id);

  return (
    <Modal open={open} onClose={onClose} title="Quick view" wide>
      <div className="quick-view">
        <div className="quick-view__media">
          <Image src={shown.imageUrl} alt={shown.name} ratio="1" eager />
        </div>

        <div className="quick-view__info">
          <div className="quick-view__meta">
            {shown.isVeg && <VegMark />}
            <span className="quick-view__category">{shown.category?.name}</span>
            {shown.ratingCount > 0 && <Rating value={shown.ratingAvg} count={shown.ratingCount} />}
          </div>

          <h3 className="quick-view__title">{shown.name}</h3>
          {shown.packLabel && <p className="quick-view__pack">{shown.packLabel}</p>}

          <PriceBlock
            pricePaise={shown.pricePaise}
            mrpPaise={shown.mrpPaise}
            discountPercent={shown.discountPercent}
            size="lg"
          />

          {loading && !detail ? (
            <div style={{ padding: '12px 0' }}>
              <Spinner size={16} />
            </div>
          ) : (
            shown.shortDescription && (
              <p className="quick-view__description">{shown.shortDescription}</p>
            )
          )}

          <div className="quick-view__flags">
            {shown.freeShipping && (
              <Badge variant="success">
                <Truck size={11} /> Free delivery
              </Badge>
            )}
            {shown.tier === 'BULK' && (
              <Badge variant="info">Sold in multiples of {shown.orderMultiple}</Badge>
            )}
            {shown.lowStock && <Badge variant="warning">Only {shown.stock} left</Badge>}
          </div>

          {shown.inStock !== false ? (
            <>
              <div className="quick-view__qty">
                <span>Quantity</span>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper__btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="stepper__value">{quantity}</span>
                  <button
                    type="button"
                    className="stepper__btn"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <div className="quick-view__actions">
                <Button
                  variant="primary"
                  onClick={async () => {
                    const ok = await cart.addItem(shown, quantity);
                    if (ok) onClose();
                  }}
                  loading={cart.isPending?.(shown.id) || false}
                >
                  <ShoppingBag size={16} /> Add to cart
                </Button>
                <Button
                  variant="outline"
                  iconOnly
                  onClick={() => wishlist.toggle(shown)}
                  aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
                </Button>
              </div>
            </>
          ) : (
            <p className="quick-view__soldout">
              This product is currently sold out. Save it to your wishlist and we will keep it
              handy for you.
            </p>
          )}

          <Link to={`/product/${shown.slug}`} className="quick-view__link" onClick={onClose}>
            View full details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
