import React from 'react'
import FlavorsStrip from '../components/FlavorsStrip'
import signatureProduct from '../assets/signature product.png'
import honeyDryFruitSingle from '../assets/Honey_Dry_fruit mix(singlre product).png'
import honeyDryFruitPack from '../assets/pac of 18 chocolates.jpeg'

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="diagonal-texture"></div>
        <div className="container hero-grid">
          <div className="hero-text fade-in">
            <div className="gold-rule"></div>
            <span className="label-caps italic-accent">Est. 2020</span>
            <h1 className="hero-h1">Blending Tradition <br /> with <span className="italic-accent">Modern Elegance</span></h1>
            <p className="hero-p">Artisanal Chocolate Beedas — where the age-old magic of Indian pan meets the richness of premium chocolate. Made fresh, delivered across India.</p>
            <div className="hero-actions">
              <a href="/products" className="gold-button">Explore Our Flavours</a>
              <a href="/gifting" className="outline-button">Corporate Gifting Enquiry</a>
            </div>
          </div>
          <div className="hero-image-container fade-in">
            <div className="hero-imgs-stack">
              <img src={signatureProduct} alt="Signature Product" className="hero-img hero-img-back float-anim" />
              <img src={honeyDryFruitPack} alt="Honey Dry Fruit Mix Pack of 18" className="hero-img hero-img-front float-anim-delay" />
            </div>
          </div>
        </div>
      </section>

      {/* Flavors Strip Section */}
      <section className="flavors-strip-container" style={{ paddingTop: '80px', backgroundColor: 'var(--section-bg)' }}>
        <div className="container text-center">
          <h2 className="section-title">Our Signature Chocolate Beeda Flavours</h2>
          <p className="page-subtitle" style={{ marginBottom: '40px', opacity: 0.7 }}>Each piece made fresh — packed with tradition, bursting with flavour.</p>
        </div>
        <FlavorsStrip />
        <div className="container text-center" style={{ marginTop: '30px' }}>
          <p className="italic-accent">✦ Flavours are Customizable for Bulk & Corporate Orders</p>
        </div>
      </section>

      {/* Legacy Section */}
      <section className="legacy section">
        <div className="container legacy-grid">
          <div className="legacy-text">
            <span className="label-caps">OUR STORY</span>
            <h2 className="section-title">A Legacy of Taste, Reimagined</h2>
            <p>At Silver Bites, we believe that some of India's finest flavours deserve a modern stage. Our Chocolate Beeda is born from that belief — taking the beloved tradition of sweet pan and wrapping it in the finest chocolate shell.</p>
            <p>Every bite carries the warmth of rose petals, the crunch of fresh pistachios, the aroma of saffron, and the richness of premium chocolate — all blended to perfection, every single day, right here in India.</p>
            <a href="/about" className="learn-more">Read Our Full Story →</a>
          </div>
          <div className="legacy-image-frame">
            <img
              src="/assets/legacy-product.png"
              alt="Cut open chocolate beeda"
              className="legacy-img"
            />
            <div className="gold-border-accent"></div>
          </div>
        </div>
      </section>

      {/* Honey Dry Fruit Mix Section */}
      <section className="honey-section section" style={{ backgroundColor: 'white' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <span className="label-caps">NEW ARRIVAL</span>
            <h2 className="section-title">Honey Dry Fruit Mix</h2>
            <p className="page-subtitle">A rich blend of premium dry fruits coated in pure honey — available in two variants.</p>
          </div>
          <div className="honey-grid">
            <div className="honey-card">
              <img src={honeyDryFruitSingle} alt="Honey Dry Fruit Mix Single" />
              <div className="honey-card-info">
                <h3>Single Piece</h3>
                <span className="honey-price">₹25</span>
              </div>
            </div>
            <div className="honey-card">
              <img src={honeyDryFruitPack} alt="Honey Dry Fruit Mix Pack of 18" />
              <div className="honey-card-info">
                <h3>Pack of 18</h3>
                <span className="honey-price">₹450</span>
              </div>
            </div>
          </div>
          <div className="text-center" style={{ marginTop: '30px' }}>
            <a href="/products" className="gold-button">Order Now</a>
          </div>
        </div>
      </section>

      {/* Auto-scrolling Gallery Section */}
      <section className="signature-gallery section" style={{ paddingBottom: 0, backgroundColor: 'white' }}>
        <div className="container text-center" style={{ marginBottom: '60px' }}>
          <span className="label-caps">OUR SIGNATURE FLAVOURS</span>
          <h2 className="section-title">Visual Symphony of Taste</h2>
          <p className="page-subtitle">A glimpse into our world of handcrafted artisanal chocolate beedas.</p>
        </div>

        <div className="marquee-wrapper">
          <div className="marquee-content">
            {/* Double the images for seamless loop */}
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <div className="marquee-item"><img src="/2/B (130) copy.jpg" alt="Rose" /></div>
                <div className="marquee-item"><img src="/1/B (71) copy.jpg" alt="Chocolate" /></div>
                <div className="marquee-item"><img src="/4/B (268) copy.jpg" alt="Pista" /></div>
                <div className="marquee-item"><img src="/5/B (352) copy.jpg" alt="Vanilla" /></div>
                <div className="marquee-item"><img src="/4/B (292) copy.jpg" alt="Kesar" /></div>
                <div className="marquee-item"><img src="/Combo/B (382) copy.jpg" alt="Combo" /></div>
                <div className="marquee-item"><img src="/5/B (344) copy.jpg" alt="Mango" /></div>
                <div className="marquee-item"><img src="/1/B (76) copy.jpg" alt="Detail" /></div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose section" style={{ backgroundColor: 'white' }}>
        <div className="container">
          <header className="text-center fade-in">
            <h2 className="section-title">Why India Loves Silver Bites</h2>
          </header>

          <div className="tiles-grid">
            <div className="tile fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="tile-icon">🌿</span>
              <h3>Premium Ingredients</h3>
              <p>Real saffron, fresh pistachios, pure rose gulkand — nothing artificial.</p>
            </div>
            <div className="tile fade-in" style={{ animationDelay: '0.2s' }}>
              <span className="tile-icon">🎁</span>
              <h3>Gift-Ready Packaging</h3>
              <p>Elegant boxes perfect for weddings, festivals, and corporate gifting.</p>
            </div>
            <div className="tile fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="tile-icon">⚙️</span>
              <h3>Fully Customizable</h3>
              <p>Choose your flavours, box size, and branding for bulk orders.</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero {
          height: 100vh;
          min-height: 800px;
          background-color: var(--hero-bg);
          display: flex;
          align-items: center;
          position: relative;
          color: var(--text-primary);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .gold-rule {
          width: 60px;
          height: 2px;
          background: var(--accent-gold);
          margin-bottom: 2rem;
        }

        .hero-h1 {
          font-size: 4.5rem;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 2rem;
        }

        .hero-p {
          font-size: 1.2rem;
          max-width: 500px;
          margin-bottom: 3rem;
          opacity: 0.9;
        }

        .hero-actions {
          display: flex;
          gap: 20px;
        }

        .hero-imgs-stack {
          position: relative;
          width: 100%;
          height: 420px;
        }

        .hero-img-back {
          position: absolute;
          width: 75%;
          top: 0;
          right: 0;
          filter: drop-shadow(0 20px 50px rgba(214, 0, 141, 0.4));
        }

        .hero-img-front {
          position: absolute;
          width: 55%;
          bottom: 0;
          left: 0;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.3));
        }

        .float-anim-delay {
          animation: float 4s ease-in-out infinite;
          animation-delay: 1s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .legacy { background-color: var(--section-bg); }

        .legacy-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 100px;
          align-items: center;
        }

        .legacy-text {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-title {
           font-size: 3rem;
           margin-bottom: 1.5rem;
           color: var(--hero-bg);
        }

        .learn-more {
          color: var(--accent-gold);
          text-decoration: none;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9rem;
          margin-top: 10px;
        }

        .legacy-image-frame {
          position: relative;
          padding: 20px;
        }

        .legacy-img {
          border-radius: 12px;
          box-shadow: 0 20px 60px var(--shadow-color);
        }

        .gold-border-accent {
          position: absolute;
          top: 0; left: 0;
          width: 60px; height: 60px;
          border-top: 3px solid var(--accent-gold);
          border-left: 3px solid var(--accent-gold);
        }

        .honey-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          max-width: 700px;
          margin: 0 auto;
        }

        .honey-card {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          background: white;
        }

        .honey-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .honey-card img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          display: block;
        }

        .honey-card-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: white;
        }

        .honey-card-info h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .honey-price {
          font-size: 1.1rem;
          font-weight: 900;
          color: var(--accent-gold);
        }

        @media (max-width: 480px) {
          .honey-grid { grid-template-columns: 1fr; max-width: 320px; }
        }

        .marquee-wrapper {
          overflow: hidden;
          width: 100%;
          position: relative;
          background: #fff;
          padding: 40px 0;
        }

        .marquee-content {
          display: flex;
          width: max-content;
          animation: marquee-scroll 40s linear infinite;
        }

        .marquee-item {
          flex-shrink: 0;
          width: 350px;
          height: 350px;
          margin-right: 20px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .marquee-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .marquee-wrapper:hover .marquee-content {
          animation-play-state: paused;
        }

        .marquee-item:hover img {
          transform: scale(1.1);
        }

        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 10px)); }
        }

        @media (max-width: 768px) {
          .marquee-item { width: 250px; height: 250px; margin-right: 15px; }
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-50% - 7.5px)); }
          }
        }

        @media (max-width: 992px) {
          .hero-grid, .legacy-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .hero { height: auto; padding: 140px 0 80px; }
          .hero-h1 { font-size: 3rem; margin-bottom: 1.5rem; }
          .hero-p { font-size: 1.1rem; margin-bottom: 2.5rem; }
          .hero-actions { justify-content: center; }
          .gold-rule { margin: 0 auto 1.5rem; }
          .legacy-image-frame { order: -1; }
          .section-title { font-size: 2.5rem; }
        }

        @media (max-width: 480px) {
           .hero-h1 { font-size: 2.5rem; }
           .hero-actions { flex-direction: column; gap: 15px; }
           .hero-actions .gold-button, .hero-actions .outline-button { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default Home
