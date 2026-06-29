import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { CartItem, PromoCode } from '../types';
import { subscribeToPromos } from '../lib/db';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  onOpenPlanner: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onOpenPlanner
}: CartDrawerProps) {
  const [promos, setPromos] = React.useState<PromoCode[]>([]);
  const [promoInput, setPromoInput] = React.useState('');
  const [promoError, setPromoError] = React.useState('');
  const [activePromo, setActivePromo] = React.useState<string>(() => {
    const isSubActive = localStorage.getItem('nouri_subscription_active') === 'true';
    if (isSubActive) return 'NOURI-PASS';
    return localStorage.getItem('nouri_promo_code') || '';
  });

  React.useEffect(() => {
    const unsubscribe = subscribeToPromos((fetchedPromos) => {
      setPromos(fetchedPromos);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const isSubActive = localStorage.getItem('nouri_subscription_active') === 'true';
      if (isSubActive) {
        setActivePromo('NOURI-PASS');
      } else {
        const storedPromo = localStorage.getItem('nouri_promo_code');
        setActivePromo(storedPromo || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
    const extrasTotal = item.selectedExtras.reduce((sum, ext) => sum + ext.price, 0);
    return acc + (itemPrice + extrasTotal) * item.quantity;
  }, 0);

  const getPromoDiscount = () => {
    if (!activePromo) return 0;
    const code = activePromo.toUpperCase().trim();
    const match = promos.find(p => p.code === code && p.isActive);
    if (!match) {
      if (code === 'NOURI-PASS') return Math.round(subtotal * 0.15);
      if (code === 'WELCOME10') return Math.round(subtotal * 0.10);
      if (code === 'BODIJATECH') return Math.min(1500, subtotal);
      return 0;
    }
    if (match.discountType === 'percentage') {
      return Math.round(subtotal * (match.discountValue / 100));
    } else {
      return Math.min(match.discountValue, subtotal);
    }
  };

  const discount = getPromoDiscount();
  const totalValue = subtotal - discount + 1000;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        id="cart-backdrop"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10" id="cart-drawer-slide-wrapper">
        <div className="w-screen max-w-md bg-bento-card-bg flex flex-col shadow-2xl h-full border-l border-bento-border transition-colors duration-300" id="cart-panel">
          {/* Header */}
          <div className="p-5 border-b border-bento-border bg-bento-cream-dark text-bento-cream-light flex items-center justify-between transition-colors" id="cart-header">
            <div className="flex items-center gap-2.5" id="cart-header-title">
              <ShoppingBag className="w-5 h-5 text-bento-olive" />
              <h2 className="font-sans text-lg font-black uppercase tracking-tight text-bento-cream-light">My Dinner Cart</h2>
              <span className="bg-bento-olive/20 text-bento-olive text-xs font-mono px-2 py-0.5 rounded-full border border-bento-olive/20" id="cart-items-count">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-xl text-bento-text-muted hover:text-bento-cream-light hover:bg-bento-cream/10 transition-all cursor-pointer"
              id="cart-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bento-cream transition-colors duration-300" id="cart-scroll-body">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-5" id="cart-empty-state">
                <ShoppingBag className="w-12 h-12 text-bento-text-muted mx-auto" />
                <div className="space-y-1.5" id="cart-empty-text">
                  <h3 className="font-sans text-base sm:text-lg font-bold text-bento-text-primary transition-colors">Your dinner cart is empty</h3>
                  <p className="text-xs text-bento-text-muted max-w-[280px] mx-auto leading-relaxed transition-colors">
                    Choose from our delicious rice, swallow, and soup offerings to feed you after a long day.
                  </p>
                </div>

                {/* Working Class CTA */}
                <div className="bg-bento-olive/50 border border-bento-olive-border rounded-2xl p-4 text-left max-w-sm mx-auto space-y-2.5 transition-colors" id="cart-empty-planner-cta">
                  <div className="flex gap-2 items-start" id="planner-cta-header">
                    <Clock className="w-4 h-4 text-bento-olive-dark shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-bento-olive-dark uppercase tracking-wider block">No time to order daily?</span>
                  </div>
                  <p className="text-xs text-bento-olive-dark leading-relaxed opacity-90">
                    Use our **Weekly Dinner Planner** to schedule your meals for Monday to Friday in one go!
                  </p>
                  <button 
                    onClick={() => {
                      onClose();
                      onOpenPlanner();
                    }}
                    className="w-full bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream text-xs font-bold py-2.5 rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                    id="cart-empty-planner-btn"
                  >
                    <span>Open Weekly Planner</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3" id="cart-items-list">
                {cart.map((item) => {
                  const basePrice = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
                  const extrasPrice = item.selectedExtras.reduce((sum, ext) => sum + ext.price, 0);
                  const itemTotal = (basePrice + extrasPrice) * item.quantity;

                  return (
                    <div 
                      key={item.id}
                      className="border border-bento-border rounded-2xl p-3.5 flex gap-3.5 bg-bento-card-bg relative group transition-colors duration-300"
                      id={`cart-row-${item.id}`}
                    >
                      {/* Thumbnail */}
                      <img 
                        src={item.menuItem.image} 
                        alt={item.menuItem.name} 
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-bento-border" 
                        referrerPolicy="no-referrer"
                      />

                      {/* Info & Modifiers */}
                      <div className="flex-1 space-y-1.5" id={`cart-row-info-${item.id}`}>
                        <div className="flex justify-between items-start gap-2" id="cart-row-title-row">
                          <div>
                            <h4 className="text-sm font-bold text-bento-text-primary line-clamp-1 transition-colors">{item.menuItem.name}</h4>
                            
                            {/* Day indicator if planned */}
                            {item.plannedDay && (
                              <span className="inline-block bg-bento-olive text-bento-olive-dark border border-bento-olive-border/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 transition-colors" id="planner-day-badge">
                                Scheduled for {item.plannedDay}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-bento-text-muted hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                            title="Remove item"
                            id="remove-item-btn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Size/Volume specifications */}
                        {item.selectedSize && (
                          <div className="text-[11px] text-bento-tan-dark font-bold transition-colors" id="size-spec">
                            Size: <span className="bg-bento-tan border border-bento-tan-border px-1.5 py-0.5 rounded-md text-[10px]">{item.selectedSize.name}</span>
                          </div>
                        )}

                        {/* Extras selected */}
                        {item.selectedExtras.length > 0 && (
                          <div className="text-[10px] text-bento-text-secondary space-y-0.5 transition-colors" id="extras-spec-list">
                            <span className="block font-bold">Extras:</span>
                            <div className="flex flex-wrap gap-1" id="extras-chips">
                              {item.selectedExtras.map(ext => (
                                <span key={ext.id} className="bg-bento-cream border border-bento-border text-bento-text-secondary px-1.5 py-0.5 rounded-md text-[9px] transition-colors" id={`ext-chip-${ext.id}`}>
                                  {ext.name} (+₦{ext.price})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {item.customNotes && (
                          <div className="text-[10px] italic text-bento-text-muted line-clamp-1 transition-colors" id="custom-notes-spec">
                            Note: "{item.customNotes}"
                          </div>
                        )}

                        {/* Controls & Price Row */}
                        <div className="flex justify-between items-center pt-2" id="controls-row">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-bento-border rounded-xl bg-bento-cream overflow-hidden shadow-sm transition-colors" id="quantity-adjuster">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-bento-gray text-bento-text-secondary transition-colors cursor-pointer"
                              id="qty-decrement"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-bento-text-primary font-mono transition-colors" id="qty-value">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-bento-gray text-bento-text-secondary transition-colors cursor-pointer"
                              id="qty-increment"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Line total price */}
                          <span className="text-sm font-bold text-bento-text-primary transition-colors">
                            ₦{itemTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Area with Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-bento-border bg-bento-card-bg transition-colors duration-300" id="cart-footer">
              <div className="space-y-3.5" id="cart-footer-summary">
                
                {/* Promo Code Input Card */}
                <div className="bg-bento-cream border border-bento-border p-3 rounded-2xl space-y-2 transition-all" id="promo-section">
                  <div className="flex items-center justify-between" id="promo-header">
                    <span className="text-[10px] font-black uppercase tracking-wider text-bento-text-muted font-mono">Promo Code</span>
                    {!activePromo && (
                      <button 
                        onClick={() => {
                          setPromoInput('WELCOME10');
                          setPromoError('');
                        }}
                        className="text-[10px] text-bento-olive-dark font-black uppercase hover:underline cursor-pointer"
                        id="auto-fill-promo-btn"
                      >
                        Try WELCOME10
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2" id="promo-input-row">
                    <input 
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError('');
                      }}
                      disabled={!!activePromo}
                      className="flex-1 bg-white border border-bento-border rounded-xl px-3 py-1.5 text-xs text-bento-text-primary uppercase focus:outline-none focus:border-bento-text-primary disabled:bg-bento-cream/50 disabled:text-bento-text-muted font-mono font-bold"
                      id="promo-text-input"
                    />
                    {activePromo ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActivePromo('');
                          localStorage.removeItem('nouri_promo_code');
                          localStorage.removeItem('nouri_subscription_active');
                        }}
                        className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors"
                        id="promo-remove-btn"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const code = promoInput.toUpperCase().trim();
                          const match = promos.find(p => p.code === code && p.isActive);
                          if (match) {
                            setActivePromo(code);
                            localStorage.setItem('nouri_promo_code', code);
                            setPromoInput('');
                            setPromoError('');
                          } else if (['WELCOME10', 'NOURI-PASS', 'BODIJATECH'].includes(code)) {
                            setActivePromo(code);
                            localStorage.setItem('nouri_promo_code', code);
                            setPromoInput('');
                            setPromoError('');
                          } else {
                            setPromoError('Invalid or inactive promo code.');
                          }
                        }}
                        className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer transition-colors"
                        id="promo-apply-btn"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {promoError && (
                    <span className="text-[10px] font-bold text-red-500 block" id="promo-error-text">{promoError}</span>
                  )}
                  {activePromo && (
                    <span className="text-[10px] font-bold text-green-600 block flex items-center gap-1" id="promo-success-text">
                      ✓ Code <span className="font-mono bg-green-50 px-1 py-0.5 rounded border border-green-200">{activePromo}</span> active!
                    </span>
                  )}
                </div>

                {/* Cost Row */}
                <div className="flex justify-between text-sm" id="subtotal-row">
                  <span className="text-bento-text-muted font-medium transition-colors">Subtotal</span>
                  <span className="font-bold text-bento-text-secondary transition-colors">₦{subtotal.toLocaleString()}</span>
                </div>

                {/* Discount Row (if applicable) */}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600" id="discount-row">
                    <span className="font-medium transition-colors">Applied Discount ({activePromo})</span>
                    <span className="font-black transition-colors">-₦{discount.toLocaleString()}</span>
                  </div>
                )}
                
                {/* Delivery cost */}
                <div className="flex justify-between text-sm" id="delivery-row">
                  <span className="text-bento-text-muted font-medium transition-colors">Estimated Delivery</span>
                  <span className="text-bento-olive-dark font-bold transition-colors">₦1,000 (Ibadan Flat-rate)</span>
                </div>

                {/* Total Row */}
                <div className="flex justify-between text-base border-t border-dashed border-bento-border pt-3 transition-colors" id="total-row">
                  <span className="font-bold text-bento-text-primary transition-colors">Total Order Value</span>
                  <span className="font-black text-lg text-bento-text-primary transition-colors">₦{totalValue.toLocaleString()}</span>
                </div>

                {/* Security and Demo note */}
                <div className="bg-bento-tan text-[10px] text-bento-tan-dark p-2.5 rounded-xl border border-bento-tan-border leading-relaxed font-semibold transition-colors" id="demo-disclaimer-card">
                  <strong>Simulated Demo:</strong> No actual monetary transaction takes place here. Proceeding opens a delivery and tracking simulation.
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={onProceedToCheckout}
                  className="w-full bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream text-sm font-bold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                  id="checkout-trigger-btn"
                >
                  <span>Proceed to Simulated Delivery</span>
                  <ArrowRight className="w-4 h-4 text-bento-cream" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
