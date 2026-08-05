import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Instagram, Phone, Mail, MapPin, ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { cartCount } = useCart()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setIsMenuOpen(false) }, [location])

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ]

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to='/' className="navbar-logo-link">
          <img src="/logo-removebg-preview.png" alt='Joyous Food Factory' className="navbar-logo-img" />
        </Link>

        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          <Link to="/products" className="nav-cart-btn" aria-label="Cart">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>

        <div className="mobile-actions">
          <Link to="/products" className="nav-cart-btn" aria-label="Cart">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, backdropFilter: 'blur(4px)' }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-inner">
          <button
            onClick={() => setIsMenuOpen(false)}
            style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>

          <div className="mobile-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mobile-menu-footer">
            <div className="mobile-contact-info">
              <p><MapPin size={14} /> KPHB, Hyderabad</p>
              <p><Phone size={14} /> +91 98485 74748</p>
              <p><Mail size={14} /> joyousfoodshyd@gmail.com</p>
            </div>
            <div className="mobile-socials">
              <a href="https://www.instagram.com/joyous_food_factory" target="_blank" rel="noopener noreferrer" className="social-icon"><Instagram size={16} /></a>
              <a href="https://wa.me/919848574748" className="social-icon"><Phone size={16} /></a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
