import React, { useState } from 'react';
import honeyDryFruitSingle from '../assets/Honey_Dry_fruit mix(singlre product).png';
import honeyDryFruitPack from '../assets/pac of 18 chocolates.jpeg';
import { Plus, Minus, ShoppingCart, ChevronRight, X, Star, Zap, Pencil, Check, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const domesticProducts = [
  { 
    id: 'dom-giftbox', 
    name: 'Special Gift Box', 
    pack: '36 Pieces (6 Flavours × 6 pcs)', 
    price: 999, 
    image: '/Gemini_Generated_Image_50m3lk50m3lk50m3.png', 
    tag: 'Free Shipping',
    freeShipping: true 
  },
  { id: 'dom-rose', name: 'Rose Flavour', pack: 'Pack of 1 × 25 pcs', price: 625, image: '/3/B (169) copy.jpg', tag: 'Bestseller' },
  { id: 'dom-choco', name: 'Chocolate Flavour', pack: 'Pack of 1 × 25 pcs', price: 625, image: '/1/B (71) copy.jpg', tag: 'Classic' },
  { id: 'dom-pista', name: 'Pista Flavour', pack: 'Pack of 1 × 25 pcs', price: 625, image: '/2/B (157) copy.jpg' },
  { id: 'dom-vanilla', name: 'Vanilla Flavour', pack: 'Pack of 1 × 25 pcs', price: 625, image: '/5/B (352) copy.jpg', tag: 'New' },
  { id: 'dom-kesar', name: 'Kesar Badam Flavour', pack: 'Pack of 1 × 25 pcs', price: 625, image: '/4/B (292) copy.jpg' },
  { id: 'dom-honey-single', name: 'Honey Dry Fruit Mix', pack: 'Single Piece', price: 25, image: honeyDryFruitSingle, tag: 'New' },
  { id: 'dom-honey-pack', name: 'Honey Dry Fruit Mix', pack: 'Pack of 18', price: 450, image: honeyDryFruitPack, tag: 'New' },
];


const commercialProducts = [
  { id: 'com-rose', name: 'Rose Flavour', pack: 'Pack of 1 × 50 pcs', price: 1200, image: '/3/B (169) copy.jpg', tag: 'Bulk Save' },
  { id: 'com-choco', name: 'Chocolate Flavour', pack: 'Pack of 1 × 50 pcs', price: 1200, image: '/1/B (71) copy.jpg', tag: 'Most Popular' },
  { id: 'com-pista', name: 'Pista Flavour', pack: 'Pack of 1 × 50 pcs', price: 1200, image: '/2/B (157) copy.jpg' },
  { id: 'com-vanilla', name: 'Vanilla Flavour', pack: 'Pack of 1 × 50 pcs', price: 1200, image: '/5/B (352) copy.jpg' },
  { id: 'com-kesar', name: 'Kesar Badam Flavour', pack: 'Pack of 1 × 50 pcs', price: 1200, image: '/4/B (292) copy.jpg' },
];

const Pricelist = () => {
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartCount, 
    isSyncing, 
    lastSynced 
  } = useCart();
  const [activeTab, setActiveTab] = useState('Domestic');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const getItemQuantity = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow digits and max 10 characters
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isCommercial = (id) => id.startsWith('com-');

  const getCommercialCount = () => {
    return cart
      .filter(item => isCommercial(item.id))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const isOrderValid = () => {
    const commercialCount = getCommercialCount();
    // Only apply 5-multiple rule for commercial products
    if (commercialCount > 0 && commercialCount % 5 !== 0) {
      return false;
    }
    return true;
  };

  const handleCheckout = () => {
    if (!isOrderValid()) {
      setCheckoutError(true);
      setTimeout(() => setCheckoutError(false), 3500);
      return;
    }

    // Verify there's no mix
    const hasDomestic = cart.some(item => !isCommercial(item.id));
    const hasCommercial = cart.some(item => isCommercial(item.id));
    if (hasDomestic && hasCommercial) {
      alert("You cannot mix Domestic and Commercial orders. Please clear your cart first.");
      return;
    }

    setCheckoutError(false);
    setIsModalOpen(true);
  };

  const handleFinalOrder = (e) => {
    e.preventDefault();
    if (cartCount === 0 || !isOrderValid()) return;
    
    // Validate 10-digit phone number
    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    // Smart Timestamp ID (Unique across all users)
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const orderRef = `#JFF-${month}${day}-${time}`;
    const orderType = activeTab === 'Domestic' ? 'DOMESTIC' : 'COMMERCIAL';
    const phoneNumber = "919848574748";

    let message = "----------------------------\n";
    message += `*NEW CUSTOMER ORDER [${orderRef}]*\n`;
    message += "----------------------------\n\n";
    
    message += `*ORDER TYPE:* ${orderType}\n`;
    message += `*NAME:* ${formData.name}\n`;
    message += `*MOBILE:* ${formData.phone}\n`;
    message += `*ADDRESS:* ${formData.address}\n\n`;

    message += `*ORDER SUMMARY:*\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* (${item.pack})\n`;
      message += `   Qty: ${item.quantity} | Subtotal: ₹${item.price * item.quantity}\n`;
    });

    message += `\n----------------------------\n`;
    message += `*GRAND TOTAL: ₹${cartTotal}*\n`;
    message += `*TOTAL ITEMS: ${cartCount}*\n`;
    message += `----------------------------\n\n`;

    message += `_Please confirm my order. Thank you!_\n\n`;
    message += `*Joyous Food Factory Online Store*\n`;
    message += `_Artisanal Quality • Pan India Delivery_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    setIsModalOpen(false);
  };

  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const allProducts = [...domesticProducts, ...commercialProducts];
  const getProduct = (id) => allProducts.find(p => p.id === id);

  const handleRemoveAll = (id) => {
    const qty = getItemQuantity(id);
    for (let i = 0; i < qty; i++) removeFromCart(id);
  };

  const handleEditSave = (product) => {
    const current = getItemQuantity(product.id);
    const diff = editQty - current;
    if (diff > 0) for (let i = 0; i < diff; i++) addToCart(product);
    else if (diff < 0) for (let i = 0; i < Math.abs(diff); i++) removeFromCart(product.id);
    setEditingId(null);
  };

  const isCommercialProd = (id) => id.startsWith('com-');

  const handleAddToCartWithCheck = (product) => {
    const hasDomestic = cart.some(item => !isCommercial(item.id));
    const hasCommercial = cart.some(item => isCommercial(item.id));
    const addingCommercial = isCommercial(product.id);

    if ((addingCommercial && hasDomestic) || (!addingCommercial && hasCommercial)) {
      setPendingProduct(product);
      setShowConflictModal(true);
      return;
    }

    addToCart(product);
  };

  const confirmSwitchCategory = () => {
    clearCart();
    if (pendingProduct) {
      addToCart(pendingProduct);
      setPendingProduct(null);
    }
    setShowConflictModal(false);
  };

  const ProductCard = ({ product }) => {
    const quantity = getItemQuantity(product.id);
    const isEditing = editingId === product.id;
    const commercial = isCommercial(product.id);

    return (
      <div className="premium-product-card fade-in">
        <div className="card-image-wrapper">
          <img src={product.image} alt={product.name} />
          {product.tag && (
            <div className={`product-badge ${product.tag.toLowerCase().replace(' ', '-')}`}>
              {product.tag === 'Bestseller' ? <Star size={10} fill="currentColor" /> : <Zap size={10} fill="currentColor" />}
              {product.tag}
            </div>
          )}
          <div className={`shipping-tag ${commercial || product.freeShipping ? 'free-shipping' : 'shipping-extra'}`}>
            {commercial || product.freeShipping ? '🚚 Free Shipping' : '📦 Shipping Extra'}
          </div>
        </div>
        <div className="card-info-content">
          <div className="title-area">
            <h3 className="card-title-text">{product.name}</h3>
            <p className="card-pack-info">{product.pack}</p>
          </div>

          <div className="price-action-area">
            <div className="price-stack">
              <span className="current-price">₹{product.price}</span>
            </div>

            <div className="action-container">
              {quantity === 0 ? (
                <button className="add-to-cart-btn" onClick={() => handleAddToCartWithCheck(product)}>ADD</button>
              ) : isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="quantity-control-pill">
                    <button onClick={() => setEditQty(q => Math.max(1, q - 1))} className="qty-minus"><Minus size={14} /></button>
                    <span className="qty-value">{editQty}</span>
                    <button onClick={() => setEditQty(q => q + 1)} className="qty-plus"><Plus size={14} /></button>
                  </div>
                  <button className="edit-save-btn" onClick={() => handleEditSave(product)} title="Save"><Check size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="quantity-control-pill">
                    <button onClick={() => removeFromCart(product.id)} className="qty-minus"><Minus size={14} /></button>
                    <span className="qty-value">{quantity}</span>
                    <button onClick={() => handleAddToCartWithCheck(product)} className="qty-plus"><Plus size={14} /></button>
                  </div>
                  <button className="edit-icon-btn" onClick={() => { setEditingId(product.id); setEditQty(quantity); }} title="Edit"><Pencil size={13} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pricelist-container">
      <div className="pricing-tabs">
        <button
          className={activeTab === 'Domestic' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('Domestic')}
        >
          <span className="tab-label">Domestic</span>
          <span className="tab-sub">For Home Collections</span>
        </button>
        <button
          className={activeTab === 'Commercial' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('Commercial')}
        >
          <span className="tab-label">Commercial</span>
          <span className="tab-sub">For Bulk Inquiries</span>
        </button>
      </div>

      {activeTab === 'Commercial' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '10px', background: 'rgba(214, 0, 141, 0.05)', borderRadius: '8px', color: 'var(--hero-bg)' }}>
            <span style={{ fontWeight: 'bold' }}>Note:</span> Minimum Order 250 / 500 / 750 / 1000 pcs
          </div>
          {cart.some(i => !i.id.startsWith('com-')) && (
            <div style={{ textAlign: 'center', marginBottom: '15px', color: '#d35400', fontSize: '0.9rem', fontWeight: '600' }} className="fade-in">
              ⚠️ Note: Adding commercial items will clear your domestic cart.
            </div>
          )}
        </>
      )}

      {activeTab === 'Domestic' && cart.some(i => i.id.startsWith('com-')) && (
        <div style={{ textAlign: 'center', marginBottom: '15px', color: '#d35400', fontSize: '0.9rem', fontWeight: '600' }} className="fade-in">
          ⚠️ Note: Adding domestic items will clear your commercial cart.
        </div>
      )}

      <div className="product-grid-layout">
        {(activeTab === 'Domestic' ? domesticProducts : commercialProducts).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="delivery-promise text-center">
        <p>✨ <b>Artisanal Quality</b> | 🚚 Pan India Delivery | 📦 Premium Packaging</p>
      </div>

      {/* Custom Error Toast */}
      {checkoutError && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--hero-bg)',
          color: 'var(--accent-gold)',
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 1100,
          fontWeight: 700,
          textAlign: 'center',
          animation: 'fade-in 0.3s ease-out',
          border: '1px solid var(--accent-gold)'
        }}>
          Minimum Order: 250 / 500 / 750 / 1000 pcs
        </div>
      )}

      {isModalOpen && !isOrderValid() && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--hero-bg)',
          color: 'var(--accent-gold)',
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 4000, 
          fontWeight: 700,
          textAlign: 'center',
          animation: 'fade-in 0.3s ease-out',
          border: '1px solid var(--accent-gold)'
        }}>
          Minimum Order Multiples: 5 units (e.g., 5, 10, 15...)
        </div>
      )}

      {/* Checkout Modal */}
      {isModalOpen && (
        <div className="checkout-modal-backdrop">
          <div className="checkout-modal-panel">
            <div className="panel-header">
              <h3>Confirm Your Order</h3>
              <button className="panel-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            {/* Order Items — editable */}
            <div className="modal-order-items">
              {cart.map(item => {
                const prod = getProduct(item.id);
                return (
                  <div key={item.id} className="modal-item-row">
                    <img src={prod?.image} alt={item.name} className="modal-item-img" />
                    <div className="modal-item-info">
                      <p className="modal-item-name">{item.name}</p>
                      <p className="modal-item-pack">{item.pack}</p>
                      <p className="modal-item-sub">₹{item.price * item.quantity}</p>
                    </div>
                    <div className="modal-qty-ctrl">
                      <button onClick={() => removeFromCart(item.id)} disabled={item.quantity === 0}><Minus size={13} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleAddToCartWithCheck(prod)}><Plus size={13} /></button>
                      <button className="modal-remove-btn" onClick={() => handleRemoveAll(item.id)} title="Remove"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleFinalOrder} className="checkout-form-stack">
              <div className="input-field">
                <label>Receiver's Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-field">
                <label>Contact Number (10 digits)</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 9876543210"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-field">
                <label>Delivery Address</label>
                <textarea
                  name="address"
                  required
                  rows="3"
                  placeholder="Street name, landmark, city, pincode"
                  value={formData.address}
                  onChange={handleInputChange}
                ></textarea>
              </div>

               <div className="order-brief">
                <div className="brief-line">
                  <span>Grand Total ({cartCount} items)</span>
                  <span className="brief-price">₹{cartTotal}</span>
                </div>
                {!isOrderValid() && (
                  <div style={{ marginTop: '10px', color: '#e74c3c', fontSize: '0.8rem', fontWeight: 800 }}>
                    ⚠️ Commercial orders must be in multiples of 5 units (250, 500, 750... pieces)
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="final-whatsapp-btn" 
                disabled={cartCount === 0 || !isOrderValid()} 
                style={{ opacity: (cartCount === 0 || !isOrderValid()) ? 0.4 : 1, cursor: (cartCount === 0 || !isOrderValid()) ? 'not-allowed' : 'pointer' }}
              >
                Confirm & Send to WhatsApp
              </button>
              <p className="privacy-note">We'll use these details to pre-fill your WhatsApp message.</p>
            </form>
          </div>
        </div>
      )}

      {/* Floating Cart Drawer */}
      {cartCount > 0 && !isModalOpen && (
        <div className={`floating-cart-bar ${isCartOpen ? 'cart-open' : ''}`}>
          {/* Cart Items Panel */}
          {isCartOpen && (
            <div className="cart-drawer-items">
              <div className="cart-drawer-header">
                <span className="cart-drawer-title">🛒 Your Cart</span>
                <button className="cart-drawer-close" onClick={() => setIsCartOpen(false)}><X size={16} /></button>
              </div>
              <div className="cart-items-list">
                {cart.map(item => {
                  const prod = getProduct(item.id);
                  const isEd = editingId === item.id;
                  return (
                    <div key={item.id} className="cart-item-row">
                      <img src={prod?.image} alt={item.name} className="cart-item-img" />
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-pack">{item.pack}</p>
                        <p className="cart-item-sub">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="cart-item-actions">
                        {isEd ? (
                          <div className="cart-qty-edit">
                            <button onClick={() => setEditQty(q => Math.max(1, q - 1))}><Minus size={12} /></button>
                            <span>{editQty}</span>
                            <button onClick={() => setEditQty(q => q + 1)}><Plus size={12} /></button>
                            <button className="cart-save-btn" onClick={() => handleEditSave(prod)}><Check size={12} /></button>
                          </div>
                        ) : (
                          <div className="cart-qty-edit">
                            <button onClick={() => removeFromCart(item.id)}><Minus size={12} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => handleAddToCartWithCheck(prod)}><Plus size={12} /></button>
                            <button className="cart-edit-btn" onClick={() => { setEditingId(item.id); setEditQty(item.quantity); }} title="Edit"><Pencil size={12} /></button>
                            <button className="cart-remove-btn" onClick={() => handleRemoveAll(item.id)} title="Remove"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bar */}
          <div className="cart-bar-inner">
            <div className="cart-summary-block" onClick={() => setIsCartOpen(o => !o)} style={{ cursor: 'pointer' }}>
              <div className="cart-icon-bg">
                <ShoppingCart size={18} />
                <span className="badge-count-dot">{cartCount}</span>
              </div>
              <div className="cart-meta">
                <span className="meta-items">{cartCount} item{cartCount > 1 ? 's' : ''} selected</span>
                <span className="meta-price">Total: ₹{cartTotal}</span>
                <div className="sync-status" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                  {isSyncing ? (
                    <span className="syncing-text" style={{ color: '#2979ff' }}>Syncing to Store...</span>
                  ) : (
                    <span>Last saved at {lastSynced}</span>
                  )}
                </div>
              </div>
              {isCartOpen ? <ChevronDown size={16} style={{ opacity: 0.6 }} /> : <ChevronUp size={16} style={{ opacity: 0.6 }} />}
            </div>
            <button className="proceed-checkout-btn" onClick={handleCheckout}>
              Checkout <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="checkout-modal-backdrop" style={{ zIndex: 4000 }}>
          <div className="checkout-modal-panel conflict-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="conflict-icon" style={{ color: '#d6008d', marginBottom: '20px' }}>
              <ShoppingCart size={48} strokeWidth={1.5} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ marginBottom: '15px' }}>Separate Order Required</h3>
            <p style={{ color: '#666', marginBottom: '25px', lineHeight: 1.5 }}>
              Your cart contains {cart.some(i => isCommercial(i.id)) ? 'Commercial' : 'Domestic'} items. 
              {pendingProduct && isCommercial(pendingProduct.id) ? ' Commercial' : ' Domestic'} orders must be placed separately. 
              Do you want to clear your current cart and start a new order?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="add-to-cart-btn" 
                style={{ flex: 1, padding: '12px', borderColor: '#ddd', color: '#666' }}
                onClick={() => setShowConflictModal(false)}
              >
                Cancel
              </button>
              <button 
                className="add-to-cart-btn" 
                style={{ flex: 2, padding: '12px', background: '#d6008d', color: 'white' }}
                onClick={confirmSwitchCategory}
              >
                Clear & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pricelist-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 15px 100px;
        }

        /* Tabs Refined */
        .pricing-tabs {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 50px;
        }

        .tab-btn {
          background: white;
          border: 1px solid #eee;
          padding: 12px 25px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          min-width: 180px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }

        .tab-btn.active {
          border-color: #d6008d;
          background: #fffafa;
          box-shadow: 0 8px 25px rgba(214, 0, 141, 0.1);
        }

        .tab-label {
          display: block;
          font-weight: 800;
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 2px;
        }

        .tab-btn.active .tab-label { color: #d6008d; }

        .tab-sub {
          font-size: 0.75rem;
          color: #888;
          font-weight: 500;
        }

        /* Product Grid */
        .product-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 25px;
        }

        /* Premium Card */
        .premium-product-card {
          background: white;
          border-radius: 18px;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.04);
          transition: all 0.4s ease;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .premium-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: rgba(214, 0, 141, 0.1);
        }

        .card-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 14px;
          overflow: hidden;
          background: #fdfdfd;
          margin-bottom: 15px;
          position: relative;
        }

        .card-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .premium-product-card:hover img {
          transform: scale(1.08);
        }

        .product-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 2;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .product-badge.bestseller { background: #ffd700; color: #000; }
        .product-badge.new { background: #00c853; color: #fff; }
        .product-badge.bulk-save { background: #2979ff; color: #fff; }
        .product-badge.most-popular { background: #d6008d; color: #fff; }
        .product-badge.classic { background: #333; color: #fff; }
        .product-badge.free-shipping { background: #d6008d; color: #fff; }


        .shipping-tag {
          position: absolute;
          bottom: 8px;
          right: 8px;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 700;
          z-index: 2;
          letter-spacing: 0.3px;
        }
        .shipping-tag.shipping-extra { background: rgba(255,255,255,0.92); color: #c0392b; border: 1px solid rgba(192,57,43,0.3); }
        .shipping-tag.free-shipping { background: rgba(255,255,255,0.92); color: #27ae60; border: 1px solid rgba(39,174,96,0.3); }

        .edit-icon-btn {
          background: #f5f5f5;
          border: 1px solid #ddd;
          color: #555;
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .edit-icon-btn:hover { background: #d6008d; color: white; border-color: #d6008d; }

        .edit-save-btn {
          background: #27ae60;
          border: none;
          color: white;
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .card-info-content {
          padding: 0 4px 4px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-title-text {
          font-size: 1rem;
          font-weight: 800;
          color: #222;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .card-pack-info {
          font-size: 0.8rem;
          color: #777;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .price-action-area {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .current-price {
          font-size: 1.15rem;
          font-weight: 900;
          color: #111;
        }

        /* Add to Cart Premium button */
        .add-to-cart-btn {
          background: #fff;
          color: #d6008d;
          border: 1px solid #d6008d;
          padding: 8px 24px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-to-cart-btn:hover {
          background: #d6008d;
          color: white;
          box-shadow: 0 4px 12px rgba(214, 0, 141, 0.2);
        }

        .quantity-control-pill {
          background: #d6008d;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 7px 12px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(214, 0, 141, 0.2);
        }

        .quantity-control-pill button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          padding: 2px;
          transition: transform 0.2s;
        }

        .quantity-control-pill button:active { transform: scale(0.8); }

        .qty-value {
          font-weight: 800;
          font-size: 0.95rem;
          min-width: 18px;
          text-align: center;
        }

        .delivery-promise {
          margin-top: 60px;
          color: #666;
          font-size: 0.95rem;
        }

        /* Checkout Modal */
        .checkout-modal-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 15px;
          backdrop-filter: blur(8px);
        }

        .checkout-modal-panel {
          background: white;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 24px;
          padding: 32px 32px 40px;
          position: relative;
          box-shadow: 0 30px 70px rgba(0,0,0,0.5);
        }

        .checkout-modal-panel::-webkit-scrollbar { width: 4px; }
        .checkout-modal-panel::-webkit-scrollbar-thumb { background: #eee; border-radius: 4px; }

        /* Modal order items */
        .modal-order-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .modal-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fafafa;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid #f0f0f0;
        }

        .modal-item-img {
          width: 54px;
          height: 54px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .modal-item-info {
          flex: 1;
          min-width: 0;
        }

        .modal-item-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .modal-item-pack {
          font-size: 0.7rem;
          color: #999;
          margin: 0 0 3px;
        }

        .modal-item-sub {
          font-size: 0.85rem;
          font-weight: 800;
          color: #d6008d;
          margin: 0;
        }

        .modal-qty-ctrl {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .modal-qty-ctrl button {
          background: #f0f0f0;
          border: none;
          color: #333;
          width: 26px; height: 26px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .modal-qty-ctrl button:hover { background: #e0e0e0; }
        .modal-qty-ctrl button:disabled { opacity: 0.3; cursor: not-allowed; }

        .modal-qty-ctrl span {
          font-size: 0.85rem;
          font-weight: 800;
          min-width: 22px;
          text-align: center;
          color: #1a1a1a;
        }

        .modal-remove-btn { background: rgba(231,76,60,0.12) !important; color: #e74c3c !important; }
        .modal-remove-btn:hover { background: #e74c3c !important; color: white !important; }

        .panel-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 30px;
        }

        .panel-header h3 {
           font-size: 1.6rem;
           font-family: var(--font-display);
           color: #1a1a1a;
           margin: 0;
        }

        .panel-close {
           background: #f5f5f5;
           border: none;
           width: 36px; height: 36px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           color: #666;
        }

        .checkout-form-stack {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-field label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 1px;
        }

        .input-field input, .input-field textarea {
          padding: 14px 18px;
          border: 1px solid #eee;
          background: #fafafa;
          border-radius: 14px;
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .input-field input:focus, .input-field textarea:focus {
           background: #fff;
           border-color: #d6008d;
           outline: none;
           box-shadow: 0 0 0 4px rgba(214, 0, 141, 0.05);
        }

        .order-brief {
           background: #fff5f9;
           padding: 20px;
           border-radius: 16px;
           margin: 10px 0;
        }

        .brief-line {
           display: flex;
           justify-content: space-between;
           font-weight: 700;
           color: #d6008d;
        }

        .brief-price { font-size: 1.3rem; font-weight: 900; }

        .final-whatsapp-btn {
          background: #d6008d;
          color: white;
          border: none;
          padding: 18px;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1.05rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .final-whatsapp-btn:hover {
           background: #b00075;
           transform: translateY(-3px);
           box-shadow: 0 12px 25px rgba(214, 0, 141, 0.3);
        }

        .privacy-note {
           font-size: 0.75rem;
           color: #999;
           text-align: center;
        }

        /* Floating Cart Bar */
        .floating-cart-bar {
          position: fixed;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 600px;
          background: #1a1a1a;
          color: white;
          border-radius: 24px;
          z-index: 2500;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          animation: floatIn 0.5s cubic-bezier(0, 0.55, 0.45, 1);
          overflow: hidden;
          transition: border-radius 0.3s ease;
        }

        .floating-cart-bar.cart-open {
          border-radius: 20px;
        }

        .cart-bar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 12px 12px 16px;
        }

        .cart-summary-block {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .cart-icon-bg {
           background: #d6008d;
           width: 40px; height: 40px;
           border-radius: 50%;
           display: flex; align-items: center; justify-content: center;
           position: relative;
           flex-shrink: 0;
        }

        .badge-count-dot {
           position: absolute;
           top: -2px; right: -2px;
           background: #fff;
           color: #d6008d;
           width: 18px; height: 18px;
           border-radius: 50%;
           font-size: 0.65rem;
           font-weight: 900;
           display: flex; align-items: center; justify-content: center;
        }

        .cart-meta {
           display: flex;
           flex-direction: column;
        }

        .meta-items { font-size: 0.75rem; opacity: 0.6; }
        .meta-price { font-size: 1rem; font-weight: 800; }

        .proceed-checkout-btn {
          background: #d6008d;
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 100px;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .proceed-checkout-btn:hover { background: #fa00a5; }

        /* Cart Drawer */
        .cart-drawer-items {
          border-bottom: 1px solid rgba(255,255,255,0.08);
          max-height: 340px;
          overflow-y: auto;
          padding: 0 16px 8px;
        }

        .cart-drawer-items::-webkit-scrollbar { width: 4px; }
        .cart-drawer-items::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

        .cart-drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0 10px;
          position: sticky;
          top: 0;
          background: #1a1a1a;
          z-index: 1;
        }

        .cart-drawer-title {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
        }

        .cart-drawer-close {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 8px;
        }

        .cart-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 10px 12px;
        }

        .cart-item-img {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .cart-item-info {
          flex: 1;
          min-width: 0;
        }

        .cart-item-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 0 2px;
        }

        .cart-item-pack {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.45);
          margin: 0 0 3px;
        }

        .cart-item-sub {
          font-size: 0.82rem;
          font-weight: 800;
          color: #d6008d;
          margin: 0;
        }

        .cart-item-actions { flex-shrink: 0; }

        .cart-qty-edit {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cart-qty-edit button {
          background: rgba(255,255,255,0.12);
          border: none;
          color: white;
          width: 24px; height: 24px;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cart-qty-edit button:hover { background: rgba(255,255,255,0.22); }

        .cart-qty-edit span {
          font-size: 0.82rem;
          font-weight: 800;
          min-width: 20px;
          text-align: center;
          color: white;
        }

        .cart-edit-btn { background: rgba(214,0,141,0.3) !important; }
        .cart-edit-btn:hover { background: #d6008d !important; }
        .cart-save-btn { background: rgba(39,174,96,0.4) !important; }
        .cart-save-btn:hover { background: #27ae60 !important; }
        .cart-remove-btn { background: rgba(231,76,60,0.3) !important; }
        .cart-remove-btn:hover { background: #e74c3c !important; }

        @keyframes floatIn {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .pricing-tabs { 
            background: #f0f0f0; 
            padding: 4px; 
            border-radius: 100px; 
            width: fit-content; 
            margin-left: auto; 
            margin-right: auto;
            display: flex;
            flex-direction: row;
            gap: 2px;
          }
          
          .tab-btn { 
            padding: 8px 16px; 
            min-width: 120px; 
            border: none; 
            border-radius: 100px;
            background: transparent;
            box-shadow: none;
            text-align: center;
          }
          
          .tab-btn.active { background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          .tab-label { font-size: 0.85rem; }
          .tab-sub { display: none; }

          .product-grid-layout { grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 5px; }
          .premium-product-card { padding: 10px; border-radius: 12px; }
          .card-image-wrapper { margin-bottom: 8px; border-radius: 8px; }
          .product-badge { top: 5px; left: 5px; padding: 3px 8px; font-size: 0.6rem; }
          
          .card-title-text { font-size: 0.8rem; height: 2.2rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .card-pack-info { font-size: 0.65rem; margin-bottom: 6px; }
          .current-price { font-size: 0.95rem; }
          
          .add-to-cart-btn { padding: 6px 12px; font-size: 0.7rem; border-radius: 8px; width: 100%; border-width: 1px; }
          .quantity-control-pill { padding: 5px 8px; gap: 8px; border-radius: 8px; width: 100%; justify-content: space-between; }
          
          .floating-cart-bar { bottom: 15px; width: 95%; }
          .cart-bar-inner { padding: 8px 8px 8px 12px; }
          .cart-icon-bg { width: 36px; height: 36px; }
          .meta-items { font-size: 0.7rem; }
          .meta-price { font-size: 0.9rem; }
          .proceed-checkout-btn { padding: 8px 14px; font-size: 0.78rem; }
          .cart-drawer-items { max-height: 260px; }
          .cart-item-img { width: 42px; height: 42px; }

          .checkout-modal-backdrop { align-items: flex-end; padding: 0; }
          .checkout-modal-panel { 
            padding: 25px 20px 40px; 
            width: 100%; 
            border-radius: 24px 24px 0 0; 
            animation: slideFromBottom 0.4s cubic-bezier(0, 0.55, 0.45, 1);
          }
          
          @keyframes slideFromBottom {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  );
};

export default Pricelist;
