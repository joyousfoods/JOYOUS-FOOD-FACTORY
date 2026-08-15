import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  ShieldCheck,
  Truck,
  Leaf,
  Headphones,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { catalogApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useStoreConfig } from '../../context/StoreConfigContext';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.123.553 4.197 1.603 6.04L0 24l6.108-1.604a11.803 11.803 0 005.937 1.604h.005c6.634 0 12.032-5.395 12.034-12.03a11.777 11.777 0 00-3.489-8.502" />
  </svg>
);

const TRUST_POINTS = [
  { icon: Leaf, label: 'Made fresh daily' },
  { icon: ShieldCheck, label: 'Secure payments' },
  { icon: Truck, label: 'Pan-India delivery' },
  { icon: Headphones, label: 'Real human support' },
];

export function Footer() {
  const toast = useToast();
  const { categories, support } = useStoreConfig();

  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setSubscribing(true);
    try {
      const result = await catalogApi.subscribe(email.trim());
      toast.success(result.message);
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <img src="/logo-removebg-preview.png" alt="Joyous Food Factory" />
            </Link>
            <p className="footer__tagline">
              Crafting moments of pure joy through artisan flavours and Indian tradition. Made
              fresh in Hyderabad, delivered across India.
            </p>

            <div className="footer__socials">
              <a
                href="https://www.instagram.com/joyous_food_factory"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
              <a
                href={`https://wa.me/${support.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
              </a>
            </div>

            <div className="footer__newsletter">
              <p>Get first access to new flavours and seasonal offers.</p>
              <form className="footer__newsletter-form" onSubmit={subscribe}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address for newsletter"
                  required
                />
                <Button type="submit" variant="gold" loading={subscribing}>
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          <div>
            <h4 className="footer__heading">Shop</h4>
            <div className="footer__links">
              <Link to="/shop">All products</Link>
              {categories.map((category) => (
                <Link key={category.id} to={`/shop?category=${category.slug}`}>
                  {category.name}
                </Link>
              ))}
              <Link to="/offers">Offers &amp; coupons</Link>
              <Link to="/gifting">Corporate gifting</Link>
            </div>
          </div>

          <div>
            <h4 className="footer__heading">Help</h4>
            <div className="footer__links">
              <Link to="/track-order">Track your order</Link>
              <Link to="/account/orders">My orders</Link>
              <Link to="/shipping-policy">Shipping &amp; delivery</Link>
              <Link to="/returns-policy">Returns &amp; refunds</Link>
              <Link to="/contact">Contact us</Link>
              <Link to="/about">Our story</Link>
            </div>
          </div>

          <div>
            <h4 className="footer__heading">Contact</h4>
            <div className="footer__contact-item">
              <MapPin size={15} />
              <span>9th Gokul Plots, KPHB, Hyderabad, Telangana</span>
            </div>
            <a className="footer__contact-item" href={`tel:${support.phone}`}>
              <Phone size={15} />
              <span>{support.phone}</span>
            </a>
            <a className="footer__contact-item" href={`tel:${support.altPhone}`}>
              <Phone size={15} />
              <span>{support.altPhone} (alt)</span>
            </a>
            <a className="footer__contact-item" href={`mailto:${support.email}`}>
              <Mail size={15} />
              <span>{support.email}</span>
            </a>
            <div className="footer__contact-item">
              <Clock size={15} />
              <span>Mon–Sun, 9:00 AM – 6:00 PM</span>
            </div>
          </div>
        </div>

        <div className="footer__trust">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="footer__trust-item">
              <Icon size={16} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span className="footer__fssai">
            <ShieldCheck size={14} /> FSSAI Lic. No. 23626032002896
          </span>
          <div className="footer__legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
            <Link to="/returns-policy">Refund Policy</Link>
          </div>
          <p style={{ color: 'inherit', fontSize: 'inherit' }}>
            © {new Date().getFullYear()} Joyous Food Factory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { WhatsAppIcon };
