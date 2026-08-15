import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  ChevronDown,
  Package,
  LogOut,
  MapPin,
  Bell,
  Phone,
} from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Drawer } from '../ui/Modal';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useStoreConfig } from '../../context/StoreConfigContext';

const STATIC_LINKS = [
  { label: 'Best Sellers', to: '/shop?bestSeller=true' },
  { label: 'New Arrivals', to: '/shop?newArrival=true' },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const { categories, support } = useStoreConfig();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes every transient surface.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [accountOpen]);

  const categoryLinks = categories
    .filter((cat) => cat.id !== 'all' && cat.slug !== 'all')
    .slice(0, 4)
    .map((category) => ({
      label: category.name,
      to: `/shop?category=${category.slug}`,
    }));

  const navLinks = [...categoryLinks, ...STATIC_LINKS];

  const isLinkActive = (to) => {
    const current = location.pathname + location.search;
    if (to === '/shop') {
      return current === '/shop';
    }
    return current === to;
  };

  return (
    <>
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="container header__inner">
          <button
            type="button"
            className="header__menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="header__logo" aria-label="Joyous Food Factory — home">
            <img src="/logo-removebg-preview.png" alt="Joyous Food Factory" />
          </Link>

          <div className="header__search">
            <SearchBar />
          </div>

          <div className="header__actions">
            <button
              type="button"
              className="icon-btn header__search-btn"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <div className="header__account" ref={accountRef}>
              <button
                type="button"
                className="icon-btn header__account-btn"
                onClick={() =>
                  isAuthenticated ? setAccountOpen((v) => !v) : navigate('/login')
                }
                aria-label={isAuthenticated ? 'Your account' : 'Sign in'}
                aria-expanded={accountOpen}
              >
                <User size={20} />
                <span className="header__account-label">
                  {isAuthenticated ? user.name.split(' ')[0] : 'Sign in'}
                  {isAuthenticated && <ChevronDown size={13} />}
                </span>
              </button>

              {accountOpen && isAuthenticated && (
                <div className="header__dropdown">
                  <div className="header__dropdown-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/account" className="header__dropdown-item">
                    <User size={15} /> My profile
                  </Link>
                  <Link to="/account/orders" className="header__dropdown-item">
                    <Package size={15} /> My orders
                  </Link>
                  <Link to="/account/addresses" className="header__dropdown-item">
                    <MapPin size={15} /> Saved addresses
                  </Link>
                  <Link to="/account/notifications" className="header__dropdown-item">
                    <Bell size={15} /> Notifications
                  </Link>
                  <hr className="divider" style={{ margin: '6px 0' }} />
                  <button
                    type="button"
                    className="header__dropdown-item header__dropdown-item--danger"
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>

            <Link to="/wishlist" className="icon-btn header__wishlist" aria-label="Wishlist">
              <Heart size={20} />
              {wishlist.count > 0 && <span className="icon-btn__badge">{wishlist.count}</span>}
            </Link>

            <Link to="/cart" className="icon-btn" aria-label={`Cart, ${cart.itemCount} items`}>
              <ShoppingBag size={20} />
              {cart.itemCount > 0 && <span className="icon-btn__badge">{cart.itemCount}</span>}
            </Link>
          </div>
        </div>

        <nav className="header__nav" aria-label="Product categories">
          <div className="container header__nav-inner">
            <Link
              to="/shop"
              className={`header__nav-link ${isLinkActive('/shop') ? 'is-active' : ''}`}
            >
              All Products
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`header__nav-link ${isLinkActive(link.to) ? 'is-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/gifting"
              className={`header__nav-link header__nav-link--accent ${
                isLinkActive('/gifting') ? 'is-active' : ''
              }`}
            >
              Corporate Gifting
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Mobile search sheet ── */}
      {mobileSearchOpen && (
        <div className="mobile-search">
          <div className="mobile-search__bar">
            <SearchBar autoFocus variant="mobile" onNavigate={() => setMobileSearchOpen(false)} />
            <button
              type="button"
              className="mobile-search__close"
              onClick={() => setMobileSearchOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        {isAuthenticated ? (
          <Link to="/account" className="mobile-menu__user">
            <span className="mobile-menu__avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span>
              <strong>{user.name}</strong>
              <small>View your account</small>
            </span>
          </Link>
        ) : (
          <div className="mobile-menu__auth">
            <Link to="/login" className="btn btn--primary btn--block">
              Sign in
            </Link>
            <Link to="/register" className="btn btn--outline btn--block">
              Create account
            </Link>
          </div>
        )}

        <nav className="mobile-menu__section">
          <h4>Shop by category</h4>
          {categories.map((category) => (
            <Link key={category.id} to={`/shop?category=${category.slug}`} className="mobile-menu__link">
              {category.name}
              <span>{category.productCount}</span>
            </Link>
          ))}
        </nav>

        <nav className="mobile-menu__section">
          <h4>Discover</h4>
          <Link to="/shop" className="mobile-menu__link">All products</Link>
          <Link to="/shop?bestSeller=true" className="mobile-menu__link">Best sellers</Link>
          <Link to="/shop?newArrival=true" className="mobile-menu__link">New arrivals</Link>
          <Link to="/offers" className="mobile-menu__link">Offers &amp; coupons</Link>
          <Link to="/gifting" className="mobile-menu__link">Corporate gifting</Link>
        </nav>

        <nav className="mobile-menu__section">
          <h4>Your account</h4>
          <Link to="/account/orders" className="mobile-menu__link">My orders</Link>
          <Link to="/track-order" className="mobile-menu__link">Track an order</Link>
          <Link to="/wishlist" className="mobile-menu__link">Wishlist</Link>
        </nav>

        <nav className="mobile-menu__section">
          <h4>About</h4>
          <Link to="/about" className="mobile-menu__link">Our story</Link>
          <Link to="/contact" className="mobile-menu__link">Contact us</Link>
          <Link to="/shipping-policy" className="mobile-menu__link">Shipping &amp; delivery</Link>
          <Link to="/returns-policy" className="mobile-menu__link">Returns &amp; refunds</Link>
        </nav>

        <a href={`tel:${support.phone}`} className="mobile-menu__call">
          <Phone size={16} /> {support.phone}
        </a>
      </Drawer>
    </>
  );
}


/** Bottom tab bar — thumb-reachable navigation on phones. */
export function MobileNav() {
  const cart = useCart();
  const wishlist = useWishlist();
  const { isAuthenticated } = useAuth();

  const tabs = [
    { to: '/', label: 'Home', icon: null, end: true },
    { to: '/shop', label: 'Shop', icon: Search },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, count: wishlist.count },
    { to: '/cart', label: 'Cart', icon: ShoppingBag, count: cart.itemCount },
    { to: isAuthenticated ? '/account' : '/login', label: 'Account', icon: User },
  ];

  return (
    <nav className="mobile-nav" aria-label="Primary">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `mobile-nav__tab ${isActive ? 'is-active' : ''}`}
        >
          <span className="mobile-nav__icon">
            {tab.icon ? (
              <tab.icon size={20} />
            ) : (
              <img src="/logo-removebg-preview.png" alt="" className="mobile-nav__logo" />
            )}
            {tab.count > 0 && <span className="mobile-nav__badge">{tab.count}</span>}
          </span>
          <span className="mobile-nav__label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
