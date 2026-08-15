import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StoreConfigProvider } from './context/StoreConfigContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header as Navbar, MobileNav } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import { Login, Register } from './pages/Auth';
import {
  AccountLayout,
  AccountProfile,
  AccountOrders,
  AccountOrderDetail,
  AccountAddresses,
  AccountCoupons,
  AccountNotifications,
  AccountSettings,
  WishlistPage,
} from './pages/Account';
import {
  About,
  Contact,
  Gifting,
  Offers,
  TrackOrder,
  ShippingPolicy,
  ReturnsPolicy,
  PrivacyPolicy,
  Terms,
  NotFound,
} from './pages/Static';

const MESSAGES = [
  '🚚 Free Shipping Above ₹999',
  '✨ Made Fresh Every Day',
  '🎁 Corporate Bulk Orders Available',
];

function AnnouncementBar() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => (i + 1) % MESSAGES.length); setVisible(true); }, 400);
    }, 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="announcement-bar">
      <span style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {MESSAGES[idx]}
      </span>
    </div>
  );
}

function ScrollProgress() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      setWidth((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return <div className="scroll-progress" style={{ width: `${width}%` }} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function AppShell() {
  return (
    <>
      <ScrollToTop />
      <ScrollProgress />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/products" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountProfile />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="orders/:id" element={<AccountOrderDetail />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="coupons" element={<AccountCoupons />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gifting" element={<Gifting />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/returns-policy" element={<ReturnsPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <a
        href="https://wa.me/919848574748"
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.123.553 4.197 1.603 6.04L0 24l6.108-1.604a11.803 11.803 0 005.937 1.604h.005c6.634 0 12.032-5.395 12.034-12.03a11.777 11.777 0 00-3.489-8.502" />
        </svg>
      </a>
      <Footer />
      <MobileNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreConfigProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <AppShell />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </StoreConfigProvider>
    </BrowserRouter>
  );
}

