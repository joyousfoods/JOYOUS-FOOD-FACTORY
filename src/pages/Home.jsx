import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Leaf,
  Gift,
  Star,
  Quote,
  Tag,
  Clock,
} from 'lucide-react';
import { ProductRail } from '../components/product/ProductRail';
import { Image } from '../components/ui/Image';
import { Button } from '../components/ui/Button';
import { useAsync } from '../hooks/useAsync';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { productApi, catalogApi } from '../api';
import { useStoreConfig } from '../context/StoreConfigContext';
import { formatPrice } from '../utils/format';

const BENEFITS = [
  {
    icon: Leaf,
    title: 'Made fresh, every day',
    body: 'Nothing sits in a warehouse. Each order is made the day it ships.',
  },
  {
    icon: Truck,
    title: 'Chilled pan-India delivery',
    body: 'Insulated boxes with ice packs so it arrives the way it left our kitchen.',
  },
  {
    icon: ShieldCheck,
    title: 'FSSAI licensed kitchen',
    body: 'Lic. 23626032002896. Prepared under food-safety standards, start to finish.',
  },
  {
    icon: Gift,
    title: 'Gift-ready packaging',
    body: 'Presentation boxes for weddings, festivals and corporate gifting.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Ordered the gift box for Diwali and every single person asked where it was from. The rose one disappeared first.',
    author: 'Sneha R.',
    location: 'Hyderabad',
    rating: 5,
  },
  {
    quote:
      'We send these to clients every quarter now. Packaging holds up, delivery has never been late, and the team actually picks up the phone.',
    author: 'Karthik M.',
    location: 'Bengaluru',
    rating: 5,
  },
  {
    quote:
      'The kesar badam is genuinely different from anything else I have tried. Worth it for a wedding order.',
    author: 'Anjali P.',
    location: 'Chennai',
    rating: 5,
  },
];

export default function Home() {
  const { categories, delivery } = useStoreConfig();
  const { products: recentlyViewed } = useRecentlyViewed();

  const featured = useAsync(
    ({ signal }) => productApi.list({ featured: true, limit: 8 }, { signal }),
    []
  );
  const bestSellers = useAsync(
    ({ signal }) => productApi.list({ bestSeller: true, limit: 8, sort: 'popularity' }, { signal }),
    []
  );
  const newArrivals = useAsync(
    ({ signal }) => productApi.list({ newArrival: true, limit: 8, sort: 'newest' }, { signal }),
    []
  );
  const offers = useAsync(
    ({ signal }) => productApi.list({ onOffer: true, limit: 8, sort: 'discount' }, { signal }),
    []
  );
  const coupons = useAsync(({ signal }) => catalogApi.coupons({ signal }), []);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <div className="gold-rule" />
            <span className="eyebrow">Est. 2020 · Hyderabad</span>
            <h1 className="hero__title">
              Blending tradition with <span className="italic-accent">modern elegance</span>
            </h1>
            <p className="hero__lede">
              Artisanal chocolate beedas — the age-old magic of Indian paan meeting the richness of
              premium chocolate. Made fresh, delivered chilled, across India.
            </p>

            <div className="hero__actions">
              <Button variant="gold" size="lg" to="/shop">
                Shop the collection <ArrowRight size={17} />
              </Button>
              <Button variant="outline" size="lg" to="/gifting">
                Corporate gifting
              </Button>
            </div>

            <div className="hero__proof">
              <div className="hero__proof-item">
                <Star size={15} fill="currentColor" />
                <span>
                  <strong>4.9</strong> average rating
                </span>
              </div>
              <div className="hero__proof-item">
                <Truck size={15} />
                <span>
                  Free delivery over <strong>{formatPrice(delivery.freeThresholdPaise)}</strong>
                </span>
              </div>
              <div className="hero__proof-item">
                <Leaf size={15} />
                <span>
                  <strong>100%</strong> vegetarian
                </span>
              </div>
            </div>
          </div>

          <div className="hero__media">
            <Image
              src="/products/signature-product.png"
              alt="Signature chocolate beeda"
              ratio="1"
              eager
              objectFit="contain"
              className="hero__image hero__image--back"
            />
            <Image
              src="/products/honey-dry-fruit-pack-18.jpeg"
              alt="Honey dry fruit mix, pack of 18"
              ratio="1"
              eager
              className="hero__image hero__image--front"
            />
          </div>
        </div>
      </section>

      {/* ── Benefits strip ───────────────────────────────── */}
      <section className="benefits">
        <div className="container benefits__grid">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="benefits__item">
              <span className="benefits__icon">
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="section section--cream">
        <div className="container">
          <div className="section-head section-head--center">
            <div>
              <span className="eyebrow">Shop by collection</span>
              <h2 className="section-title">Find your flavour</h2>
              <p className="section-subtitle">
                Four collections, one kitchen. Every piece finished by hand.
              </p>
            </div>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="category-card"
              >
                <Image src={category.imageUrl} alt="" ratio="4/5" />
                <div className="category-card__overlay">
                  <h3>{category.name}</h3>
                  <span>
                    {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product rails ────────────────────────────────── */}
      <section className="section section--white">
        <div className="container">
          <ProductRail
            eyebrow="Handpicked"
            title="Featured this week"
            subtitle="What our kitchen is most proud of right now."
            products={featured.data?.items || []}
            loading={featured.loading}
            viewAllTo="/shop?featured=true"
          />

          <ProductRail
            eyebrow="Loved by India"
            title="Best sellers"
            subtitle="The ones that go out of the door fastest."
            products={bestSellers.data?.items || []}
            loading={bestSellers.loading}
            viewAllTo="/shop?bestSeller=true"
          />
        </div>
      </section>

      {/* ── Offers ───────────────────────────────────────── */}
      {(coupons.data?.items?.length > 0 || offers.data?.items?.length > 0) && (
        <section className="section section--cream">
          <div className="container">
            {coupons.data?.items?.length > 0 && (
              <>
                <div className="section-head">
                  <div>
                    <span className="eyebrow">Save more</span>
                    <h2 className="section-title">Current offers</h2>
                    <p className="section-subtitle">
                      Apply any of these at checkout. The discount is calculated on your cart.
                    </p>
                  </div>
                  <Link to="/offers" className="rail__viewall">
                    All offers <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="coupon-grid">
                  {coupons.data.items.slice(0, 4).map((coupon) => (
                    <div key={coupon.id} className="coupon-card">
                      <div className="coupon-card__tag">
                        <Tag size={15} />
                      </div>
                      <div className="coupon-card__body">
                        <span className="coupon-card__code">{coupon.code}</span>
                        <p>{coupon.description}</p>
                        {coupon.minOrderPaise > 0 && (
                          <small>Minimum order {formatPrice(coupon.minOrderPaise)}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {offers.data?.items?.length > 0 && (
              <div style={{ marginTop: 'var(--space-16)' }}>
                <ProductRail
                  eyebrow="Limited time"
                  title="On offer now"
                  products={offers.data.items}
                  loading={offers.loading}
                  viewAllTo="/shop?onOffer=true"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Gifting banner ───────────────────────────────── */}
      <section className="gifting-banner">
        <div className="container gifting-banner__grid">
          <div className="gifting-banner__content">
            <span className="eyebrow">Gifting</span>
            <h2>Boxes built to be given</h2>
            <p>
              Weddings, Diwali, client thank-yous, or a Tuesday that needed improving. Our gift
              boxes ship free anywhere in India, and we will customise flavours for bulk and
              corporate orders.
            </p>
            <div className="gifting-banner__actions">
              <Button variant="gold" to="/shop?category=gift-boxes">
                Shop gift boxes
              </Button>
              <Button variant="ghost" to="/gifting" className="gifting-banner__link">
                Corporate enquiry <ArrowRight size={15} />
              </Button>
            </div>
          </div>
          <div className="gifting-banner__media">
            <Image
              src="/Gemini_Generated_Image_50m3lk50m3lk50m3.png"
              alt="Special gift box"
              ratio="4/3"
            />
          </div>
        </div>
      </section>

      {/* ── New arrivals ─────────────────────────────────── */}
      <section className="section section--white">
        <div className="container">
          <ProductRail
            eyebrow="Just landed"
            title="New arrivals"
            subtitle="The newest additions to the range."
            products={newArrivals.data?.items || []}
            loading={newArrivals.loading}
            viewAllTo="/shop?newArrival=true"
          />

          {recentlyViewed.length > 0 && (
            <ProductRail
              eyebrow="Pick up where you left off"
              title="Recently viewed"
              products={recentlyViewed}
              compact
            />
          )}
        </div>
      </section>

      {/* ── Brand story ──────────────────────────────────── */}
      <section className="section section--cream">
        <div className="container story">
          <div className="story__media">
            <Image src="/assets/legacy-product.png" alt="Chocolate beeda, cut open" ratio="4/5" />
            <div className="story__frame" />
          </div>
          <div className="story__content">
            <span className="eyebrow">Our story</span>
            <h2 className="section-title">A legacy of taste, reimagined</h2>
            <p>
              Joyous Food Factory started with a simple question: what if the beloved tradition of
              sweet paan met the richness of premium chocolate? Our chocolate beeda is the answer —
              rose petals, fresh pistachio, real saffron and betel leaf, wrapped in a chocolate
              shell and finished by hand.
            </p>
            <p>
              Everything is made fresh in our Hyderabad kitchen the day it ships. Nothing is
              stockpiled, nothing is frozen. That is why we deliver chilled, and why the box you
              open tastes like the one that left us.
            </p>
            <Button variant="outline" to="/about">
              Read our full story <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="section section--berry">
        <div className="container">
          <div className="section-head section-head--center">
            <div>
              <span className="eyebrow">What people say</span>
              <h2 className="section-title">Loved across India</h2>
            </div>
          </div>

          <div className="testimonial-grid">
            {TESTIMONIALS.map((testimonial) => (
              <figure key={testimonial.author} className="testimonial">
                <Quote size={22} className="testimonial__mark" />
                <div className="testimonial__stars">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.location}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Delivery promise ─────────────────────────────── */}
      <section className="section section--tight section--white">
        <div className="container delivery-strip">
          <div className="delivery-strip__item">
            <Clock size={22} />
            <div>
              <h3>Dispatched within 24 hours</h3>
              <p>Orders placed before 4 PM go out the same day, Monday to Saturday.</p>
            </div>
          </div>
          <div className="delivery-strip__item">
            <Truck size={22} />
            <div>
              <h3>Free delivery over {formatPrice(delivery.freeThresholdPaise)}</h3>
              <p>
                Flat {formatPrice(delivery.feePaise)} below that. Gift boxes and commercial packs
                always ship free.
              </p>
            </div>
          </div>
          <div className="delivery-strip__item">
            <ShieldCheck size={22} />
            <div>
              <h3>Secure payments</h3>
              <p>UPI, cards, net banking and wallets via Razorpay. Cash on delivery available.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
