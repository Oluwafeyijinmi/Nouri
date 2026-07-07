import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, Check, HelpCircle, Phone, CreditCard, ChevronRight, MessageSquare, ExternalLink, RefreshCw, AlertCircle, Users, Share2, Copy, Sparkles, CheckCircle, Lock } from 'lucide-react';
import { CartItem, CustomerDetails, Order, PromoCode } from '../types';
import { auth } from '../lib/firebase';
import { getUserProfile, saveOrder, saveUserProfile, subscribeToOrder, cancelOrderInDb, subscribeToPromos, incrementPromoUsage } from '../lib/db';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClearCart: () => void;
}

type CheckoutStage = 'details' | 'payment' | 'tracking';
type TrafficLevel = 'smooth' | 'moderate' | 'heavy';

export default function CheckoutModal({ isOpen, onClose, cart, onClearCart }: CheckoutModalProps) {
  const [stage, setStage] = useState<CheckoutStage>('details');
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerDetails>({
    name: '',
    email: 'michaiahomolaso@gmail.com', // Pre-fill with user email from metadata
    phone: '',
    address: '',
    landmark: '',
    deliveryInstructions: '',
    deliveryTime: '4:30 PM - 6:00 PM',
  });

  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Nomba Payment Simulator States
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [simStep, setSimStep] = useState<'method' | 'card' | 'pin' | 'otp' | 'success'>('method');
  const [simCardNum, setSimCardNum] = useState('5123 4567 8901 2346');
  const [simExpiry, setSimExpiry] = useState('12/29');
  const [simCvv, setSimCvv] = useState('123');
  const [simPin, setSimPin] = useState('1234');
  const [simOtp, setSimOtp] = useState('123456');
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const [trackerStep, setTrackerStep] = useState<number>(0);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Group Bill Splitting States
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [groupMembers, setGroupMembers] = useState<string[]>(['Me (Host)']);
  const [newMemberName, setNewMemberName] = useState('');
  const [itemAssignments, setItemAssignments] = useState<Record<string, string>>({}); // cartItemId -> Member Name

  // Copy success indicator states
  const [copiedMemberIdx, setCopiedMemberIdx] = useState<number | null>(null);
  const [copiedGroupText, setCopiedGroupText] = useState(false);

  // Traffic Estimator State
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>('moderate');

  // Active Promo Code State
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [activePromo, setActivePromo] = useState<string>(() => {
    const isSubActive = localStorage.getItem('nouri_subscription_active') === 'true';
    if (isSubActive) return 'NOURI-PASS';
    return localStorage.getItem('nouri_promo_code') || '';
  });

  useEffect(() => {
    const unsubscribe = subscribeToPromos((fetchedPromos) => {
      setPromos(fetchedPromos);
    });
    return unsubscribe;
  }, []);

  // Keep promo code synced on open
  useEffect(() => {
    if (isOpen) {
      const isSubActive = localStorage.getItem('nouri_subscription_active') === 'true';
      if (isSubActive) {
        setActivePromo('NOURI-PASS');
      } else {
        setActivePromo(localStorage.getItem('nouri_promo_code') || '');
      }
    }
  }, [isOpen]);

  // Pre-assign all items to Host initially when cart/modal opens
  useEffect(() => {
    if (isOpen && cart.length > 0) {
      const initialAssignments: Record<string, string> = {};
      cart.forEach((item) => {
        initialAssignments[item.id] = 'Me (Host)';
      });
      setItemAssignments(initialAssignments);
    }
  }, [isOpen, cart]);

  // Auto-fill user profile coordinates from Firestore on modal open
  useEffect(() => {
    if (isOpen) {
      const user = auth.currentUser;
      if (user) {
        getUserProfile(user.uid).then((p) => {
          if (p) {
            setFormData((prev) => ({
              ...prev,
              name: p.name || prev.name,
              email: user.email || prev.email,
              phone: p.phone || prev.phone,
              address: p.address || prev.address,
              landmark: p.landmark || prev.landmark || '',
              deliveryInstructions: p.deliveryInstructions || prev.deliveryInstructions || '',
              deliveryTime: p.deliveryTime || prev.deliveryTime,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              email: user.email || prev.email,
            }));
          }
        });
      }
    }
  }, [isOpen]);

  // Subscribe to real order status if logged in
  useEffect(() => {
    if (stage === 'tracking' && createdOrder && auth.currentUser) {
      const unsubscribe = subscribeToOrder(createdOrder.id, (order) => {
        if (order) {
          setCreatedOrder(order);
          const statuses = ['Received', 'Preparing', 'In Transit', 'Delivered'];
          const idx = statuses.indexOf(order.status);
          if (idx !== -1) {
            setTrackerStep(idx);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [stage, createdOrder?.id]);

  const getMemberTotal = (member: string) => {
    const memberItems = cart.filter(item => itemAssignments[item.id] === member);
    const memberSubtotal = memberItems.reduce((sum, item) => {
      const price = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
      const extras = item.selectedExtras.reduce((s, e) => s + e.price, 0);
      return sum + (price + extras) * item.quantity;
    }, 0);
    // Pro-rate the total discount among members
    const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 1;
    const memberDiscountedSubtotal = Math.round(memberSubtotal * ratio);
    const memberDeliveryShare = Math.round(1000 / groupMembers.length);
    return memberDiscountedSubtotal + memberDeliveryShare;
  };

  const handleCopyMemberText = (member: string, memberTotal: number, idx: number) => {
    const text = `🍲 Nouri Dinner Split for ${member}:\n- Share: ₦${memberTotal.toLocaleString()}\n- Bank: Wema Bank\n- Acc No: 0123456789\n- Acc Name: Nouri Kitchens`;
    navigator.clipboard.writeText(text);
    setCopiedMemberIdx(idx);
    setTimeout(() => setCopiedMemberIdx(null), 2000);
  };

  const handleCopyGroupText = () => {
    let breakdown = `🍲 *Nouri Group Dinner Split Details* 🍲\n`;
    breakdown += `------------------------------------\n`;
    
    groupMembers.forEach((member) => {
      const memberItems = cart.filter(item => itemAssignments[item.id] === member);
      const memberSubtotal = memberItems.reduce((sum, item) => {
        const price = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
        const extras = item.selectedExtras.reduce((s, e) => s + e.price, 0);
        return sum + (price + extras) * item.quantity;
      }, 0);
      // Apply relative discount ratio if discount is active
      const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 1;
      const memberDiscountedSubtotal = Math.round(memberSubtotal * ratio);
      const memberDeliveryShare = Math.round(1000 / groupMembers.length);
      const memberTotal = memberDiscountedSubtotal + memberDeliveryShare;

      breakdown += `👤 *${member}*: ₦${memberTotal.toLocaleString()}\n`;
      memberItems.forEach(item => {
        breakdown += `   - ${item.quantity}x ${item.menuItem.name}\n`;
      });
      breakdown += `\n`;
    });

    breakdown += `------------------------------------\n`;
    breakdown += `🏦 *Payment Details* 🏦\n`;
    breakdown += `Bank: Wema Bank\n`;
    breakdown += `Account Number: 0123456789\n`;
    breakdown += `Account Name: Nouri Kitchens\n`;
    breakdown += `_Send receipt once transfer is done!_`;

    navigator.clipboard.writeText(breakdown);
    setCopiedGroupText(true);
    setTimeout(() => setCopiedGroupText(false), 2500);
  };

  const getCancellationDetails = () => {
    if (!createdOrder) return { fee: 0, refund: 0, pct: 0 };
    const orderTotal = createdOrder.total;
    let fee = 0;
    let pct = 0;
    if (trackerStep === 0) {
      // Received status
      fee = 1000; // ₦1,000 flat administrative fee
      pct = Math.round((fee / orderTotal) * 100);
    } else if (trackerStep === 1) {
      // Preparing status
      fee = Math.round(orderTotal * 0.5); // 50% prep & ingredient fee
      pct = 50;
    } else {
      // In Transit or Delivered (trackerStep >= 2)
      fee = orderTotal; // 100% cancellation fee (no refund)
      pct = 100;
    }
    const refund = Math.max(0, orderTotal - fee);
    return { fee, refund, pct };
  };

  const handleCancelOrder = async () => {
    if (!createdOrder) return;
    setIsCancelling(true);
    const { fee, refund } = getCancellationDetails();

    const updatedOrder: Order = {
      ...createdOrder,
      status: 'Cancelled',
      cancellationFee: fee,
      refundAmount: refund,
      cancelledAt: new Date().toLocaleTimeString(),
    };

    const user = auth.currentUser;
    if (user) {
      try {
        await cancelOrderInDb(createdOrder.id, fee, refund);
      } catch (err) {
        console.error("Error updating order as Cancelled in database: ", err);
      }
    }

    setCreatedOrder(updatedOrder);
    setShowCancelConfirm(false);
    setIsCancelling(false);
  };

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
    const extrasTotal = item.selectedExtras.reduce((sum, ext) => sum + ext.price, 0);
    return acc + (itemPrice + extrasTotal) * item.quantity;
  }, 0);
  const deliveryFee = 1000;
  
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
  const totalAmount = subtotal - discount + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null); // Clear error on edit
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      setFormError("Please fill in all required fields marked with *");
      return;
    }

    setIsCreatingCheckout(true);
    setFormError(null);

    const orderRef = `NOURI-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: orderRef,
      items: [...cart],
      customer: { ...formData },
      total: totalAmount,
      createdAt: new Date().toLocaleTimeString(),
      status: 'Received',
    };

    try {
      console.log("[Nomba] Requesting checkout order reference:", orderRef);
      const response = await fetch("/api/nomba/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: totalAmount,
          orderReference: orderRef,
          customerEmail: formData.email || "michaiahomolaso@gmail.com",
          callbackUrl: `${window.location.origin}/order-success`,
          description: `Nouri Kitchens Ibadan Delivery Order Ref: ${orderRef}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment gateway. Please check your network or try again.");
      }

      console.log("[Nomba] Checkout link successfully generated:", data.checkoutLink);

      // Save order to Firestore as Received so it tracks seamlessly
      const user = auth.currentUser;
      if (user) {
        await saveOrder(user.uid, newOrder).catch((err) => console.error("Error saving order: ", err));
        if (activePromo) {
          await incrementPromoUsage(activePromo).catch((err) => console.error("Error incrementing promo usage: ", err));
        }
        await saveUserProfile(user.uid, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          landmark: formData.landmark || '',
          deliveryInstructions: formData.deliveryInstructions || '',
          deliveryTime: formData.deliveryTime,
          email: user.email || 'guest@nouri.delivery'
        }).catch((err) => console.error("Error auto-saving coordinates: ", err));
      }

      setCreatedOrder(newOrder);
      setCheckoutUrl(data.checkoutLink);
      setStage('payment');
      setFormError(null);

      const isSim = data.isSimulator || data.checkoutLink === "#simulator";
      setIsSimulatorMode(isSim);
      if (isSim) {
        setSimStep('method');
        setSimError(null);
      } else {
        // Attempt auto-opening checkout link in a new tab
        try {
          window.open(data.checkoutLink, '_blank');
        } catch (popupErr) {
          console.warn("Popup block prevented auto-redirect. Fallback to manual launch action.", popupErr);
        }
      }

    } catch (err: any) {
      console.error("[Nomba] Checkout initiation error:", err);
      setFormError(err.message || "An unexpected error occurred while contacting Nomba payment servers.");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!createdOrder) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      console.log("[Nomba] Triggering verification check for:", createdOrder.id);
      const response = await fetch(`/api/nomba/verify-payment/${createdOrder.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "We could not verify your payment at this moment. If you have completed the transfer, please try again in a few seconds.");
      }

      console.log("[Nomba] Verification API results:", data);
      
      // Successfully verified
      setStage('tracking');
      setFormError(null);

    } catch (err: any) {
      console.error("[Nomba] Verification error:", err);
      setVerificationError(err.message || "Unable to confirm payment. Please complete payment or try again.");
    } finally {
      setIsVerifying(false);
    }
  };


  const handleFinishDemo = () => {
    onClearCart();
    setStage('details');
    setTrackerStep(0);
    setCreatedOrder(null);
    onClose();
  };

  // Generate WhatsApp redirect text for high-fidelity communication link
  const getWhatsAppLink = () => {
    if (!createdOrder) return '';
    const itemsText = createdOrder.items.map(item => {
      const sizeText = item.selectedSize ? ` (${item.selectedSize.name})` : '';
      return `- ${item.quantity}x ${item.menuItem.name}${sizeText}`;
    }).join('%0A');
    const text = `Hello Nouri! 🍲%0AI just placed a *demonstration order* on your app.%0A%0A*Order ID:* ${createdOrder.id}%0A*Name:* ${createdOrder.customer.name}%0A*Delivery Address:* ${createdOrder.customer.address}%0A*Time Window:* ${createdOrder.customer.deliveryTime}%0A%0A*Scheduled Items:*%0A${itemsText}%0A%0A*Total Value:* ₦${createdOrder.total.toLocaleString()}%0A%0AThank you!`;
    return `https://wa.me/2347054626118?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" id="checkout-backdrop">
      <div 
        className="bg-bento-card-bg rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-bento-border transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
        id="checkout-modal"
      >
        {/* Header */}
        <div className="bg-bento-cream-dark text-bento-cream-light p-5 flex items-center justify-between border-b border-bento-border transition-colors" id="checkout-header">
          <div className="flex items-center gap-2.5" id="checkout-header-title">
            <Truck className="w-5 h-5 text-bento-olive" />
            <div>
              <h2 className="font-sans text-lg font-black uppercase tracking-tight text-bento-cream-light">
                {stage === 'details' ? 'Delivery Configuration' : stage === 'payment' ? 'Secure Payment' : 'Simulated Delivery Tracker'}
              </h2>
              <p className="text-[11px] text-bento-text-muted opacity-90 transition-colors">
                {stage === 'details' ? 'Where should we deliver your hot dinner?' : stage === 'payment' ? `Order Reference: ${createdOrder?.id}` : `Order ID: ${createdOrder?.id}`}
              </p>
            </div>
          </div>
          {(stage === 'details' || stage === 'payment') && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl text-bento-text-muted hover:text-bento-cream-light hover:bg-bento-cream/10 transition-colors cursor-pointer"
              id="checkout-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-bento-cream transition-colors duration-300" id="checkout-body">
          
          {stage === 'details' && (
            <form onSubmit={handlePlaceOrder} className="space-y-5" id="details-form">
              {/* Note about simulated payment */}
              <div className="bg-bento-olive/10 border border-bento-olive-border/30 rounded-2xl p-4 flex gap-3 text-xs text-bento-olive-dark font-semibold transition-colors" id="simulation-notice">
                <CreditCard className="w-4 h-4 shrink-0 mt-0.5 text-bento-olive-dark" />
                <div>
                  <strong>NOMBA SECURE CHECKOUT:</strong> Enter your real delivery coordinates below. Placing this order will generate a secure online transaction page powered by the Nomba payment gateway.
                </div>
              </div>

              {/* Form Validation Error Banner */}
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl flex items-center gap-2 text-xs font-bold" id="form-error-banner">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="form-fields-grid">
                
                {/* Name */}
                <div className="space-y-1" id="field-name-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Tolulope Alao"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                    id="checkout-input-name"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1" id="field-phone-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">WhatsApp/Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. +234 805 123 4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                    id="checkout-input-phone"
                  />
                  <span className="text-[10px] text-bento-text-muted block font-light transition-colors">Riders will call this number on arrival.</span>
                </div>

                {/* Email */}
                <div className="space-y-1 sm:col-span-2" id="field-email-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. test@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                    id="checkout-input-email"
                  />
                </div>

                {/* Delivery Address */}
                <div className="space-y-1 sm:col-span-2" id="field-address-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Delivery Address in Ibadan *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="e.g. Flat 3, Heritage Court, Awolowo Ave, Bodija"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                    id="checkout-input-address"
                  />
                </div>

                {/* Near Landmark */}
                <div className="space-y-1" id="field-landmark-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Nearest Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    placeholder="e.g. Opposite Bovas Filling Station"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                    id="checkout-input-landmark"
                  />
                </div>

                {/* Delivery Slot */}
                <div className="space-y-1" id="field-delivery-slot-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Preferred Delivery Window *</label>
                  <select
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                    id="checkout-select-timeslot"
                  >
                    <option value="4:30 PM - 6:00 PM">4:30 PM - 6:00 PM (Late afternoon)</option>
                    <option value="6:00 PM - 7:30 PM">6:00 PM - 7:30 PM (Evening prime)</option>
                    <option value="7:30 PM - 9:00 PM">7:30 PM - 9:00 PM (Night cap)</option>
                  </select>
                </div>

                {/* Special Instructions */}
                <div className="space-y-1 sm:col-span-2" id="field-instructions-container">
                  <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Special Delivery Instructions</label>
                  <textarea
                    name="deliveryInstructions"
                    placeholder="e.g. Please leave with the gatekeeper, ring bell twice, etc..."
                    rows={2}
                    value={formData.deliveryInstructions}
                    onChange={handleInputChange}
                    className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark resize-none transition-colors"
                    id="checkout-textarea-instructions"
                  />
                </div>
              </div>

              {/* Group Order Splitting Section */}
              <div className="bg-bento-olive/10 border-2 border-dashed border-bento-olive-border/30 rounded-2xl p-5 space-y-4 transition-all duration-300" id="checkout-group-order-section">
                <div className="flex items-center justify-between" id="group-header">
                  <div className="flex items-center gap-2.5" id="group-title-row">
                    <div className="bg-bento-olive/30 p-2 rounded-xl text-bento-olive-dark">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-bento-text-primary uppercase tracking-wider block">👥 Group Dinner & Bill Splitter</span>
                      <span className="text-[10px] text-bento-text-secondary">Ordering together at the office or home? Split the food and delivery costs automatically!</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none" id="group-toggle-label">
                    <input 
                      type="checkbox" 
                      checked={isGroupOrder}
                      onChange={(e) => setIsGroupOrder(e.target.checked)}
                      className="sr-only peer" 
                      id="group-checkbox"
                    />
                    <div className="w-11 h-6 bg-bento-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bento-olive-dark"></div>
                    <span className="ml-2 text-xs font-bold text-bento-text-primary uppercase tracking-wide">
                      {isGroupOrder ? 'On' : 'Off'}
                    </span>
                  </label>
                </div>

                {isGroupOrder && (
                  <div className="space-y-4 pt-3 border-t border-bento-border/40 animate-fadeIn" id="group-body">
                    {/* Member names management */}
                    <div className="space-y-2" id="group-members-entry">
                      <label className="block text-[11px] font-black text-bento-text-muted uppercase tracking-wider">Group Members</label>
                      <div className="flex gap-2" id="member-add-row">
                        <input 
                          type="text"
                          placeholder="e.g. Lekan, Chioma, Tobi"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const name = newMemberName.trim();
                              if (name && !groupMembers.includes(name)) {
                                setGroupMembers([...groupMembers, name]);
                                setNewMemberName('');
                              }
                            }
                          }}
                          className="flex-1 bg-white border border-bento-border rounded-xl px-3.5 py-2 text-xs text-bento-text-primary focus:outline-none focus:ring-1 focus:ring-bento-olive-dark font-medium"
                          id="group-member-input"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const name = newMemberName.trim();
                            if (name && !groupMembers.includes(name)) {
                              setGroupMembers([...groupMembers, name]);
                              setNewMemberName('');
                            }
                          }}
                          className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                          id="group-add-member-btn"
                        >
                          Add Friend
                        </button>
                      </div>

                      {/* Display Member Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1" id="group-members-chips">
                        {groupMembers.map((member, idx) => (
                          <div 
                            key={member}
                            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                              member === 'Me (Host)' 
                                ? 'bg-bento-text-primary text-bento-cream border-bento-text-primary'
                                : 'bg-white text-bento-text-primary border-bento-border'
                            }`}
                            id={`member-chip-${idx}`}
                          >
                            <span>{member}</span>
                            {member !== 'Me (Host)' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupMembers(groupMembers.filter(m => m !== member));
                                  // Reset item assignments for this deleted person back to host
                                  const updatedAssignments = { ...itemAssignments };
                                  Object.keys(updatedAssignments).forEach((itemId) => {
                                    if (updatedAssignments[itemId] === member) {
                                      updatedAssignments[itemId] = 'Me (Host)';
                                    }
                                  });
                                  setItemAssignments(updatedAssignments);
                                }}
                                className="text-bento-text-muted hover:text-red-500 font-extrabold ml-1 cursor-pointer"
                                id={`delete-member-btn-${idx}`}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cart item assignment selectors */}
                    <div className="space-y-2.5 bg-white/50 border border-bento-border/50 p-3.5 rounded-2xl" id="item-assignment-panel">
                      <label className="block text-[11px] font-black text-bento-text-muted uppercase tracking-wider">Assign Food Items</label>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1" id="assignment-list">
                        {cart.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-bento-border text-xs"
                            id={`assign-row-${item.id}`}
                          >
                            <div className="flex items-center gap-2" id="assign-item-info">
                              <img 
                                src={item.menuItem.image} 
                                alt={item.menuItem.name} 
                                className="w-8 h-8 rounded-lg object-cover border border-bento-border"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-bento-text-primary block line-clamp-1">{item.menuItem.name}</span>
                                <span className="text-[10px] text-bento-text-secondary font-semibold font-mono">
                                  {item.quantity}x • ₦{((item.selectedSize ? item.selectedSize.price : item.menuItem.price) + item.selectedExtras.reduce((s, e) => s + e.price, 0)).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <select
                              value={itemAssignments[item.id] || 'Me (Host)'}
                              onChange={(e) => {
                                setItemAssignments({
                                  ...itemAssignments,
                                  [item.id]: e.target.value
                                });
                              }}
                              className="bg-bento-cream text-bento-text-primary border border-bento-border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-bento-olive-dark"
                              id={`select-assign-${item.id}`}
                            >
                              {groupMembers.map((member) => (
                                <option key={member} value={member}>{member}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Cost breakdown per person */}
                    <div className="bg-bento-cream/60 border border-bento-border p-3.5 rounded-2xl space-y-3" id="split-breakdown-card">
                      <div className="flex items-center justify-between border-b border-bento-border/50 pb-2" id="split-header">
                        <span className="text-[11px] font-black text-bento-text-muted uppercase tracking-wider">Oya Split Calculations</span>
                        <button
                          type="button"
                          onClick={handleCopyGroupText}
                          className="text-[10px] bg-white border border-bento-border hover:bg-bento-gray text-bento-text-primary font-black px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          id="copy-group-split-btn"
                        >
                          <Share2 className="w-3 h-3 text-bento-olive-dark" />
                          <span>{copiedGroupText ? 'Copied Share Summary!' : 'Copy WhatsApp Split Text'}</span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs" id="members-owes-list">
                        {groupMembers.map((member, idx) => {
                          const memberTotal = getMemberTotal(member);
                          return (
                            <div key={member} className="flex justify-between items-center bg-white/40 p-2 rounded-xl border border-bento-border/35" id={`member-owes-${idx}`}>
                              <div>
                                <span className="font-bold text-bento-text-primary">{member} owes:</span>
                                <span className="text-[10px] text-bento-text-secondary block">
                                  Food + ₦{Math.round(1000 / groupMembers.length).toLocaleString()} dispatch share
                                </span>
                              </div>
                              <div className="flex items-center gap-2" id={`member-owes-actions-${idx}`}>
                                <span className="font-black text-bento-text-primary">₦{memberTotal.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyMemberText(member, memberTotal, idx)}
                                  className="p-1 rounded-lg border border-bento-border/50 hover:bg-bento-gray text-bento-text-secondary cursor-pointer transition-colors"
                                  title={`Copy transfer message for ${member}`}
                                  id={`copy-member-btn-${idx}`}
                                >
                                  {copiedMemberIdx === idx ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-bento-tan/30 border border-bento-tan-border/40 p-2.5 rounded-xl text-[10px] text-bento-tan-dark font-semibold leading-relaxed flex items-start gap-2" id="group-split-disclaimer">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bento-tan-dark" />
                        <div>
                          <strong>Group Payment Instructions:</strong> Split payments can be transferred into our merchant bank account: <strong className="underline text-bento-text-primary">Wema Bank • Nouri Kitchens • 0123456789</strong>. Send your group payment screenshot via WhatsApp!
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Summary Breakdown */}
              <div className="bg-bento-card-bg border border-bento-border rounded-2xl p-4 space-y-2 text-sm transition-colors duration-300" id="checkout-cost-card">
                <span className="text-xs text-bento-text-muted font-mono font-bold uppercase transition-colors">Cost Breakdown</span>
                <div className="flex justify-between" id="summary-subtotal">
                  <span className="text-bento-text-muted font-medium transition-colors">Selected Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                  <span className="font-bold text-bento-text-secondary transition-colors">₦{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600" id="summary-discount">
                    <span className="font-medium">Applied Discount ({activePromo})</span>
                    <span className="font-bold">-₦{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-bento-text-muted border-b border-bento-cream pb-2 transition-colors" id="summary-shipping">
                  <span>Ibadan Motorcycle Dispatch Flat-rate</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-bento-text-primary pt-1 transition-colors" id="summary-total">
                  <span>Total Simulated Cost</span>
                  <span className="text-lg font-black text-bento-olive-dark transition-colors">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3" id="details-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/3 border border-bento-border text-bento-text-secondary font-bold py-3 rounded-2xl hover:bg-bento-gray transition-colors text-sm cursor-pointer"
                  id="checkout-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCheckout}
                  className="w-full sm:w-2/3 bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  id="checkout-submit-btn"
                >
                  {isCreatingCheckout ? (
                    <RefreshCw className="w-4 h-4 text-bento-cream animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-bento-cream" />
                  )}
                  <span>{isCreatingCheckout ? 'Connecting Nomba...' : 'Proceed to Checkout'}</span>
                </button>
              </div>
            </form>
          )}

          {stage === 'payment' && (
            <div className="space-y-6 py-4 text-center flex flex-col items-center justify-center animate-fadeIn" id="nomba-payment-screen">
              {isSimulatorMode ? (
                /* --- NOMBA SANDBOX SIMULATOR WIDGET --- */
                <div className="bg-white border border-gray-200 rounded-3xl p-5 w-full max-w-md mx-auto space-y-4 shadow-xl text-left relative overflow-hidden" id="nomba-simulator-container">
                  {/* Yellow/Black Nomba simulated header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-amber-400 rounded-lg flex items-center justify-center font-extrabold text-[10px] text-black">
                        n
                      </div>
                      <span className="font-sans text-xs font-black uppercase tracking-wider text-black">nomba secure</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-sans font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>SECURED
                    </span>
                  </div>

                  {simStep === 'method' && (
                    <div className="space-y-4 animate-fadeIn" id="sim-method-view">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Merchant: Nouri Kitchens</p>
                        <h4 className="text-sm font-bold text-gray-800">Select payment method:</h4>
                        <p className="text-xl font-black text-amber-600">₦{totalAmount.toLocaleString()}</p>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSimStep('card');
                            setSimCardNum('5123 4567 8901 2346');
                            setSimExpiry('12/29');
                            setSimCvv('123');
                            setSimError(null);
                          }}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/10 transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-black text-xs text-gray-800 block">Pay with Card</span>
                              <span className="text-[10px] text-gray-400">Mastercard, Visa, Verve</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSimStep('success');
                          }}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/10 transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                              <RefreshCw className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-black text-xs text-gray-800 block">Pay with Bank Transfer</span>
                              <span className="text-[10px] text-gray-400">Transfer instantly using standard settlement account</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 'card' && (
                    <div className="space-y-4 animate-fadeIn" id="sim-card-view">
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <span className="text-xs font-black text-gray-800 uppercase">Card Payment</span>
                        <p className="text-sm font-extrabold text-amber-600">₦{totalAmount.toLocaleString()}</p>
                      </div>

                      {simError && (
                        <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{simError}</span>
                        </div>
                      )}

                      <div className="space-y-3.5">
                        {/* Card number */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Card Number</label>
                          <input
                            type="text"
                            placeholder="5123 4567 8901 2346"
                            value={simCardNum}
                            onChange={(e) => {
                              // format as 4-4-4-4
                              let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              let formatted = '';
                              for (let i = 0; i < val.length && i < 16; i++) {
                                if (i > 0 && i % 4 === 0) formatted += ' ';
                                formatted += val[i];
                              }
                              setSimCardNum(formatted);
                              if (simError) setSimError(null);
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Expiry and CVV */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="12/29"
                              value={simExpiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
                                let formatted = '';
                                if (val.length > 0) {
                                  formatted += val.substring(0, 2);
                                  if (val.length > 2) {
                                    formatted += '/' + val.substring(2, 4);
                                  }
                                }
                                setSimExpiry(formatted);
                                if (simError) setSimError(null);
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-amber-500 text-center"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">CVV</label>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="123"
                              value={simCvv}
                              onChange={(e) => {
                                setSimCvv(e.target.value.replace(/[^0-9]/gi, ''));
                                if (simError) setSimError(null);
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-amber-500 text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Security note */}
                      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-[10px] text-gray-500 font-medium flex items-start gap-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
                        <span>All transactions are secured using standard 256-bit encryption. Payment details are pre-filled for secure evaluation.</span>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSimStep('method')}
                          className="w-1/3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-500 text-center transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={simLoading}
                          onClick={() => {
                            const rawCard = simCardNum.replace(/\s+/g, '');
                            if (rawCard.length !== 16) {
                              setSimError("Please enter a valid 16-digit card number");
                              return;
                            }
                            if (simExpiry.length !== 5) {
                              setSimError("Please enter a valid expiry date (MM/YY)");
                              return;
                            }
                            if (simCvv.length !== 3) {
                              setSimError("Please enter a valid 3-digit CVV");
                              return;
                            }

                            setSimLoading(true);
                            setTimeout(() => {
                              setSimLoading(false);
                              setSimStep('pin');
                              setSimPin('1234');
                              setSimError(null);
                            }, 1200);
                          }}
                          className="w-2/3 bg-black hover:bg-gray-800 text-amber-400 font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {simLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Pay ₦{totalAmount.toLocaleString()}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 'pin' && (
                    <div className="space-y-4 animate-fadeIn text-center py-2" id="sim-pin-view">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">SECURE AUTHORIZATION</span>
                        <h4 className="text-sm font-bold text-gray-800">Enter Your Card PIN</h4>
                        <p className="text-xs text-gray-500">Please provide your 4-digit card PIN to authorize payment</p>
                      </div>

                      {simError && (
                        <div className="bg-red-50 text-red-600 border border-red-100 p-2 rounded-xl text-[10.5px] font-semibold">
                          {simError}
                        </div>
                      )}

                      <div className="flex justify-center gap-2 pt-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <div 
                            key={idx} 
                            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-colors ${
                              simPin.length > idx ? 'border-amber-500 bg-amber-50/10 text-gray-800' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {simPin.length > idx ? '•' : ''}
                          </div>
                        ))}
                      </div>

                      {/* Secret text field to capture PIN */}
                      <input
                        type="password"
                        maxLength={4}
                        autoFocus
                        value={simPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/gi, '');
                          setSimPin(val);
                          if (simError) setSimError(null);
                        }}
                        className="opacity-0 absolute -z-50"
                      />

                      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-[10px] text-gray-500 text-center font-medium">
                        🛡️ <span>Secure transaction verified. Click submit or enter PIN to proceed.</span>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSimStep('card')}
                          className="w-1/3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-500 text-center cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={simLoading || simPin.length < 4}
                          onClick={() => {
                            setSimLoading(true);
                            setTimeout(() => {
                              setSimLoading(false);
                              setSimStep('otp');
                              setSimOtp('123456');
                              setSimError(null);
                            }, 1200);
                          }}
                          className="w-2/3 bg-black hover:bg-gray-800 text-amber-400 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {simLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Submit PIN</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 'otp' && (
                    <div className="space-y-4 animate-fadeIn text-center py-2" id="sim-otp-view">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">SMS ONE-TIME PASSWORD</span>
                        <h4 className="text-sm font-bold text-gray-800">Verify OTP Code</h4>
                        <p className="text-xs text-gray-500 leading-normal">
                          Enter the pre-filled verification code sent to your registered number to complete authorization.
                        </p>
                      </div>

                      {simError && (
                        <div className="bg-red-50 text-red-600 border border-red-100 p-2 rounded-xl text-[10.5px] font-semibold">
                          {simError}
                        </div>
                      )}

                      <div className="max-w-xs mx-auto space-y-2.5">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter OTP (123456)"
                          value={simOtp}
                          onChange={(e) => {
                            setSimOtp(e.target.value.replace(/[^0-9]/gi, ''));
                            if (simError) setSimError(null);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-center text-sm font-bold tracking-[0.25em] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-[10px] text-gray-500 text-center font-medium">
                        🔒 <span>Confirming secure identity factor verification.</span>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSimStep('pin')}
                          className="w-1/3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-500 text-center cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={simLoading || simOtp.length < 6}
                          onClick={() => {
                            setSimLoading(true);
                            setTimeout(() => {
                              setSimLoading(false);
                              setSimStep('success');
                              setSimError(null);
                            }, 1200);
                          }}
                          className="w-2/3 bg-black hover:bg-gray-800 text-amber-400 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {simLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Verify Code</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 'success' && (
                    <div className="space-y-4 animate-fadeIn text-center py-4" id="sim-success-view">
                      <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-inner animate-bounce">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-gray-800 uppercase tracking-tight">Payment Successful!</h4>
                        <p className="text-xs text-gray-500">
                          Your Nomba payment of <strong>₦{totalAmount.toLocaleString()}</strong> has completed successfully.
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-3 text-left space-y-1.5 border border-gray-100">
                        <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Receipt Details:</span>
                        <div className="text-[10px] text-gray-600 space-y-1 font-semibold">
                          <div className="flex justify-between">
                            <span>Order Reference:</span>
                            <span className="font-mono text-gray-900">{createdOrder?.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount Paid:</span>
                            <span className="font-mono text-gray-900">₦{totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Authorized Bank:</span>
                            <span>Nomba Merchant Gateway</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStage('tracking');
                            onClearCart();
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Proceed to Live Delivery Tracker</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* --- STANDARD MODE (IF REAL KEY SET) --- */
                <div className="bg-bento-card-bg border border-bento-border rounded-3xl p-6 w-full max-w-md mx-auto space-y-4 shadow-md">
                  <div className="w-16 h-16 bg-bento-olive/10 rounded-full flex items-center justify-center text-bento-olive-dark mx-auto animate-pulse">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-bento-olive-dark font-mono font-bold uppercase tracking-wider block">NOMBA PAYMENTS GATEWAY</span>
                    <h3 className="text-base font-black text-bento-text-primary uppercase tracking-tight">Complete Your Payment</h3>
                    <p className="text-xl font-extrabold text-bento-olive-dark">₦{totalAmount.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-bento-text-secondary leading-relaxed font-medium">
                    We have generated a secure payment session on the Nomba gateway for your Nouri dinner delivery order <strong>{createdOrder?.id}</strong>.
                  </p>

                  {verificationError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 text-left">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <a
                      href={checkoutUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold py-3 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Proceed to Nomba Checkout</span>
                    </a>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-left flex items-start gap-2" id="nomba-secured-info">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-gray-800 font-bold uppercase tracking-wider block">🔒 Secured Integration</span>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          Your transaction is routed through Nomba's official secure portal. Follow the gateway instructions to authorize payment.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      disabled={isVerifying}
                      className="w-full border border-bento-border bg-white hover:bg-bento-gray text-bento-text-primary font-bold py-2.5 px-4 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <span>{isVerifying ? 'Verifying payment status...' : 'Verify My Payment'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'tracking' && (
            /* --- TRACKER SCREEN --- */
            createdOrder?.status === 'Cancelled' ? (
              <div className="space-y-6 py-4 animate-fadeIn" id="cancelled-screen">
                {/* Cancelled Banner */}
                <div className="bg-red-50/70 border border-red-200 rounded-3xl p-6 text-center space-y-3.5" id="cancelled-banner">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto" id="cancelled-icon-circle">
                    <X className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-red-500 font-mono font-bold uppercase tracking-wider block">Status Code: CANCELLED</span>
                    <h3 className="text-base font-black text-bento-text-primary uppercase tracking-tight">Your dinner order was cancelled</h3>
                  </div>
                  <p className="text-xs text-bento-text-secondary leading-relaxed max-w-md mx-auto font-medium">
                    We've cancelled your Nouri dinner order. Because local fresh ingredients and motorcycle dispatch preparations had already begun, a cancellation fee was assessed in accordance with our Ibadan kitchen policy.
                  </p>
                </div>

                {/* Refund & Fee Details Card */}
                <div className="bg-bento-card-bg border border-bento-border rounded-3xl p-5 space-y-4 shadow-sm" id="cancellation-financial-card">
                  <span className="text-xs text-bento-text-muted font-mono font-bold uppercase tracking-wider block border-b border-bento-border/40 pb-2">Cancellation Invoice Receipt</span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-bento-text-secondary">
                      <span>Original Dinner Subtotal:</span>
                      <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-bento-text-secondary">
                      <span>Dispatch Rider Booking:</span>
                      <span className="font-semibold">₦{deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-bold bg-red-50 p-2.5 rounded-xl">
                      <span>Cancellation Penalty Fee:</span>
                      <span>₦{createdOrder.cancellationFee?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-black border-t border-dashed border-bento-border pt-2.5 text-sm">
                      <span>Refund Issued:</span>
                      <span>₦{createdOrder.refundAmount?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                  <div className="bg-bento-cream border border-bento-border/60 p-3 rounded-2xl text-[10.5px] text-bento-text-secondary leading-relaxed">
                    ℹ️ <strong>Refund Processing Notice:</strong> A refund of <strong>₦{createdOrder.refundAmount?.toLocaleString() || '0'}</strong> has been processed to your payment source. If you had applied any coupon codes (such as <em>{activePromo}</em>), they have been unlocked for reuse on your next order.
                  </div>
                </div>

                {/* Return button */}
                <div className="pt-2" id="cancelled-actions">
                  <button
                    onClick={handleFinishDemo}
                    className="w-full bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="cancelled-return-btn"
                  >
                    <RefreshCw className="w-4 h-4 text-bento-cream" />
                    <span>Return to Dining Menu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-2" id="tracking-screen">
                {/* Stepper Status Visual */}
              <div className="bg-bento-card-bg border border-bento-border rounded-3xl p-5 shadow-sm space-y-6 transition-colors duration-300" id="stepper-board">
                <div className="flex items-center gap-3.5" id="stepper-header">
                  <div className="bg-bento-olive p-2.5 rounded-full text-bento-olive-dark animate-bounce border border-bento-olive-border transition-colors" id="stepper-icon-bg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-bento-olive-dark font-mono font-bold uppercase transition-colors">LIVE DELIVERY STATUS</span>
                    <h3 className="font-sans text-base font-black text-bento-text-primary uppercase tracking-tight transition-colors" id="live-step-heading">
                      {trackerStep === 0 && "Order Received & Verified"}
                      {trackerStep === 1 && "Preparing Your Wholesome Dinner"}
                      {trackerStep === 2 && "Rider Dispatched in Ibadan Traffic"}
                      {trackerStep === 3 && "Delivered & Received! Enjoy!"}
                    </h3>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="relative pl-6 space-y-8" id="stepper-lines">
                  {/* Vertical connecting line */}
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-bento-cream transition-colors" id="stepper-guide-line">
                    <div 
                      className="w-full bg-bento-olive-dark transition-all duration-1000" 
                      style={{ height: `${(trackerStep / 3) * 100}%` }}
                      id="stepper-active-line"
                    />
                  </div>

                  {/* Step 0 */}
                  <div className="relative flex gap-4 text-sm" id="step-row-0">
                    <div className={`w-5.5 h-5.5 rounded-full absolute -left-5 flex items-center justify-center transition-colors border-2 ${
                      trackerStep >= 0 ? 'bg-bento-olive-dark border-bento-olive-dark text-bento-cream' : 'bg-bento-card-bg border-bento-border text-bento-text-muted'
                    }`} id="step-dot-0">
                      {trackerStep > 0 ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-bento-cream" />}
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${trackerStep >= 0 ? 'text-bento-text-primary' : 'text-bento-text-muted'}`}>1. Order Synced to Nouri Kitchen</h4>
                      <p className="text-xs text-bento-text-muted font-light mt-0.5 transition-colors">Checked order ID, confirmed delivery time: {formData.deliveryTime}.</p>
                    </div>
                  </div>

                  {/* Step 1 */}
                  <div className="relative flex gap-4 text-sm" id="step-row-1">
                    <div className={`w-5.5 h-5.5 rounded-full absolute -left-5 flex items-center justify-center transition-colors border-2 ${
                      trackerStep >= 1 ? 'bg-bento-olive-dark border-bento-olive-dark text-bento-cream' : 'bg-bento-card-bg border-bento-border text-bento-text-muted'
                    }`} id="step-dot-1">
                      {trackerStep > 1 ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-bento-cream animate-ping" />}
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${trackerStep >= 1 ? 'text-bento-text-primary' : 'text-bento-text-muted'}`}>2. Chef Preparing and Packaging</h4>
                      <p className="text-xs text-bento-text-muted font-light mt-0.5 transition-colors">Soup litres poured into high-grade bowls. Swallows molded with love. Packed in thermodynamic bag.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex gap-4 text-sm" id="step-row-2">
                    <div className={`w-5.5 h-5.5 rounded-full absolute -left-5 flex items-center justify-center transition-colors border-2 ${
                      trackerStep >= 2 ? 'bg-bento-olive-dark border-bento-olive-dark text-bento-cream' : 'bg-bento-card-bg border-bento-border text-bento-text-muted'
                    }`} id="step-dot-2">
                      {trackerStep > 2 ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-bento-cream" />}
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${trackerStep >= 2 ? 'text-bento-text-primary' : 'text-bento-text-muted'}`}>3. Rider Dispatched (Ibadan Roads)</h4>
                      <p className="text-xs text-bento-text-muted font-light mt-0.5 transition-colors">Rider is navigating through Bodija/Akobo road toward {formData.address}. Almost there!</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex gap-4 text-sm" id="step-row-3">
                    <div className={`w-5.5 h-5.5 rounded-full absolute -left-5 flex items-center justify-center transition-colors border-2 ${
                      trackerStep >= 3 ? 'bg-green-600 border-green-600 text-bento-cream' : 'bg-bento-card-bg border-bento-border text-bento-text-muted'
                    }`} id="step-dot-3">
                      {trackerStep >= 3 ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-bento-cream" />}
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${trackerStep >= 3 ? 'text-green-600 dark:text-green-400' : 'text-bento-text-muted'}`}>4. Dinner Arrived Safely</h4>
                      <p className="text-xs text-bento-text-muted font-light mt-0.5 transition-colors">Delivered at {formData.address}. Thank you for choosing Nouri!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Live Ibadan Road Traffic Map */}
              {trackerStep >= 2 && (
                <div className="bg-bento-card-bg border border-bento-border rounded-3xl p-5 shadow-sm space-y-4 transition-colors animate-fadeIn" id="live-map-card">
                  <div className="flex items-center justify-between border-b border-bento-border/50 pb-2.5" id="map-header">
                    <div className="flex items-center gap-2" id="map-header-title">
                      <MapPin className="w-4 h-4 text-bento-olive-dark animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-bento-text-primary">📍 Live Ibadan Traffic Map</span>
                    </div>
                    <span className="bg-bento-olive/20 text-bento-olive-dark text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-bento-olive-border/10">
                      Rider: Kazeem "Supa"
                    </span>
                  </div>

                  {/* Traffic Level Selector Controls */}
                  <div className="space-y-1.5" id="map-controls">
                    <span className="block text-[10px] font-black text-bento-olive-dark uppercase tracking-wider">Ibadan Traffic Conditions</span>
                    <div className="grid grid-cols-3 gap-2" id="traffic-buttons-grid">
                      <button
                        type="button"
                        onClick={() => setTrafficLevel('smooth')}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          trafficLevel === 'smooth'
                            ? 'bg-green-100 border-green-300 text-green-700 font-extrabold shadow-sm scale-[1.02]'
                            : 'bg-white border-bento-border text-bento-text-secondary hover:bg-bento-gray'
                        }`}
                        id="traffic-smooth-btn"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span>Smooth (15m)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrafficLevel('moderate')}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          trafficLevel === 'moderate'
                            ? 'bg-amber-100 border-amber-300 text-amber-700 font-extrabold shadow-sm scale-[1.02]'
                            : 'bg-white border-bento-border text-bento-text-secondary hover:bg-bento-gray'
                        }`}
                        id="traffic-moderate-btn"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Moderate (35m)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrafficLevel('heavy')}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          trafficLevel === 'heavy'
                            ? 'bg-red-100 border-red-300 text-red-700 font-extrabold shadow-sm scale-[1.02]'
                            : 'bg-white border-bento-border text-bento-text-secondary hover:bg-bento-gray'
                        }`}
                        id="traffic-heavy-btn"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <span>Gridlock (55m)</span>
                      </button>
                    </div>
                  </div>

                  {/* The Visual Road Map Path */}
                  <div className="bg-bento-cream border border-bento-border/70 p-4 rounded-2xl relative overflow-hidden" id="map-visual-path">
                    {/* Horizontal Line */}
                    <div className="absolute left-6 right-6 top-[28px] h-1 bg-bento-border rounded-full animate-pulse" id="map-line-bg">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          trafficLevel === 'smooth' ? 'bg-green-500 w-[70%]' :
                          trafficLevel === 'moderate' ? 'bg-amber-500 w-[45%]' : 'bg-red-500 w-[20%]'
                        }`}
                        id="map-line-fill"
                      />
                    </div>

                    {/* Nodes along the path */}
                    <div className="flex justify-between items-center relative z-10 animate-fadeIn" id="map-nodes">
                      {/* Node 1: Bodija Kitchen */}
                      <div className="flex flex-col items-center text-center space-y-1" id="node-bodija">
                        <div className="w-7 h-7 rounded-full bg-bento-text-primary text-bento-cream flex items-center justify-center font-black text-[9px] border-2 border-white shadow-md">
                          🍳
                        </div>
                        <span className="text-[9px] font-bold text-bento-text-primary font-mono">Bodija</span>
                      </div>

                      {/* Node 2: Mokola Overpass */}
                      <div className="flex flex-col items-center text-center space-y-1" id="node-mokola">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[9px] border-2 border-white shadow-md transition-colors ${
                          trafficLevel !== 'heavy' ? 'bg-bento-olive-dark text-white' : 'bg-white text-bento-text-muted border-bento-border'
                        }`}>
                          {trafficLevel === 'heavy' ? '🛑' : '🌉'}
                        </div>
                        <span className="text-[9px] font-bold text-bento-text-secondary font-mono">Mokola</span>
                      </div>

                      {/* Node 3: Awolowo Ave */}
                      <div className="flex flex-col items-center text-center space-y-1" id="node-awolowo">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[9px] border-2 border-white shadow-md transition-colors ${
                          trafficLevel === 'smooth' ? 'bg-bento-olive-dark text-white' : 'bg-white text-bento-text-muted border-bento-border'
                        }`}>
                          🛣️
                        </div>
                        <span className="text-[9px] font-bold text-bento-text-secondary font-mono">Awolowo</span>
                      </div>

                      {/* Node 4: Destination */}
                      <div className="flex flex-col items-center text-center space-y-1" id="node-destination">
                        <div className="w-7 h-7 rounded-full bg-bento-cream-dark text-bento-cream-light flex items-center justify-center font-black text-[9px] border-2 border-white shadow-md">
                          🏠
                        </div>
                        <span className="text-[9px] font-bold text-bento-text-primary truncate max-w-[55px] font-mono">
                          {formData.landmark || 'Home'}
                        </span>
                      </div>
                    </div>

                    {/* Motorcycle Rider Icon overlay */}
                    <div 
                      className="absolute top-[12px] -ml-4 transition-all duration-1000 ease-in-out"
                      style={{
                        left: 
                          trafficLevel === 'smooth' ? '70%' :
                          trafficLevel === 'moderate' ? '45%' : '20%'
                      }}
                      id="motorcycle-rider-overlay"
                    >
                      <div className="bg-bento-olive p-1.5 rounded-full border-2 border-white shadow-lg text-bento-olive-dark flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5 animate-bounce" />
                      </div>
                    </div>
                  </div>

                  {/* Landmark Commentary */}
                  <div className="bg-white/75 border border-bento-border p-3.5 rounded-2xl space-y-1 text-xs" id="map-commentary">
                    <span className="text-[10px] text-bento-text-muted font-bold uppercase tracking-wider block font-mono">Chef's Traffic Dispatch Bulletin</span>
                    <p className="text-bento-text-secondary font-medium leading-relaxed italic" id="commentary-text">
                      {trafficLevel === 'smooth' && "“The road through Bodija Secretariat and Ring road is surprisingly clear tonight! Kazeem is flying. Rider is cruising past UI Gate as we speak. Eat your swallow fresh! Estimated delivery: 12-15 mins.”"}
                      {trafficLevel === 'moderate' && "“Mokola Overpass has its typical 5:30 PM corporate crawl. Kazeem took a quick detour past Agodi Gardens to bypass the hold-up. Your soup is tightly insulated and hot. Estimated delivery: 25-30 mins.”"}
                      {trafficLevel === 'heavy' && "“Oti o! Sango and Akobo roundabout is completely blocked by tankers. It is a crazy gridlock today! But don't worry, Kazeem is a veteran — he is carefully splitting lanes to keep your swallow piping hot. Hang in there! Estimated delivery: 45-50 mins.”"}
                    </p>
                  </div>

                  {/* Rider Profile Card */}
                  <div className="flex items-center justify-between bg-white border border-bento-border/60 p-2.5 rounded-2xl text-xs" id="map-rider-profile">
                    <div className="flex items-center gap-2" id="rider-info-left">
                      <div className="w-9 h-9 rounded-full bg-bento-olive/30 text-bento-olive-dark flex items-center justify-center font-bold font-sans text-xs border border-bento-olive-border/30">
                        KO
                      </div>
                      <div>
                        <span className="font-bold text-bento-text-primary block">Kazeem \"Supa\" Olaiya</span>
                        <span className="text-[10px] text-bento-text-muted font-mono font-bold block">Bike: TVS Star IB-204-NG</span>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/234123456789?text=Hello%20Kazeem,%20I'm%20tracking%20my%20Nouri%20order%20${createdOrder?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-bento-cream text-bento-text-primary border border-bento-border hover:bg-bento-gray font-bold py-1.5 px-3 rounded-xl text-[11px] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      id="ring-rider-btn"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Ring Rider</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Action Board (WhatsApp CTA) */}
              <div className="bg-bento-olive/50 border border-bento-olive-border rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-sm text-bento-text-secondary justify-between transition-colors duration-300" id="whatsapp-callout-card">
                <div className="space-y-1 text-center sm:text-left" id="whatsapp-meta-text">
                  <span className="font-bold text-bento-olive-dark block flex items-center justify-center sm:justify-start gap-1 transition-colors">
                    <MessageSquare className="w-4 h-4 text-green-600 animate-pulse" /> Need real service or custom sizing?
                  </span>
                  <p className="text-xs text-bento-text-secondary font-medium transition-colors">Contact Nouri directly to arrange bulk prep or real delivery.</p>
                </div>
                <a 
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4.5 rounded-2xl transition-all text-xs flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  id="whatsapp-redirect-link"
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Invoice Panel */}
              <div className="bg-bento-card-bg border border-bento-border rounded-2xl p-5 space-y-3.5 text-xs font-mono text-bento-text-secondary shadow-sm transition-colors duration-300" id="invoice-receipt-panel">
                <span className="block font-bold text-center text-bento-text-primary uppercase border-b border-bento-cream pb-2 transition-colors">Nouri Demonstration Receipt</span>
                
                <div className="flex justify-between" id="invoice-meta-row">
                  <span>DATE: 2026-06-25</span>
                  <span>ID: {createdOrder?.id}</span>
                </div>

                <div className="border-t border-dashed border-bento-border py-2.5 space-y-1.5" id="invoice-items">
                  {createdOrder?.items.map(item => {
                    const price = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
                    const exPrice = item.selectedExtras.reduce((sum, e) => sum + e.price, 0);
                    return (
                      <div key={item.id} className="flex justify-between text-bento-text-primary" id={`invoice-item-${item.id}`}>
                        <span>{item.quantity}x {item.menuItem.name} {item.selectedSize ? `(${item.selectedSize.name})` : ''}</span>
                        <span>₦{((price + exPrice) * item.quantity).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-dashed border-bento-border pt-2 space-y-1" id="invoice-totals">
                  <div className="flex justify-between" id="invoice-subtotal">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between" id="invoice-shipping">
                    <span>Motorcycle Dispatch</span>
                    <span>₦{deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-bento-text-primary border-t border-bento-border pt-1.5 transition-colors" id="invoice-total">
                    <span>Demo Total Paid</span>
                    <span>₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Cancel Order Section */}
              {trackerStep < 3 && (
                <div className="pt-2" id="cancel-order-button-container">
                  {showCancelConfirm ? (
                    <div className="bg-red-50 border border-red-200 rounded-3xl p-5 space-y-4 animate-fadeIn" id="cancel-confirm-box">
                      <div className="text-xs space-y-2" id="cancel-confirm-text">
                        <span className="font-black text-red-700 uppercase tracking-wide block">⚠️ Confirm Dinner Cancellation</span>
                        <p className="text-bento-text-secondary leading-relaxed font-semibold">
                          Nouri cooks fresh on-demand. Cancellation terms for your active status 
                          (<span className="text-bento-text-primary underline">
                            {trackerStep === 0 && "Received"}
                            {trackerStep === 1 && "Preparing"}
                            {trackerStep >= 2 && "Dispatched"}
                          </span>):
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-bento-text-muted pl-1 font-medium">
                          <li>Cancellation Fee: <strong className="text-red-600 font-extrabold">₦{getCancellationDetails().fee.toLocaleString()}</strong> ({getCancellationDetails().pct}% fee)</li>
                          <li>Refund Issued: <strong className="text-green-600 font-extrabold">₦{getCancellationDetails().refund.toLocaleString()}</strong></li>
                        </ul>
                      </div>
                      <div className="flex gap-2 pt-1" id="cancel-action-buttons">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 bg-white hover:bg-bento-gray text-bento-text-primary font-bold py-3 px-4 rounded-2xl border border-bento-border text-xs cursor-pointer transition-all"
                          id="keep-order-btn"
                        >
                          Keep My Dinner
                        </button>
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={handleCancelOrder}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs cursor-pointer transition-all disabled:opacity-50"
                          id="confirm-cancel-btn"
                        >
                          {isCancelling ? 'Cancelling...' : `Cancel Order`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full bg-red-50/50 hover:bg-red-100/60 border border-red-200/50 text-red-600 font-bold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                      id="show-cancel-dialog-btn"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Cancel Dinner Order</span>
                    </button>
                  )}
                </div>
              )}

              {/* Return to Browsing Button */}
              <div className="pt-2" id="tracking-actions">
                <button
                  onClick={handleFinishDemo}
                  className="w-full bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  id="finish-demo-btn"
                >
                  <RefreshCw className="w-4 h-4 text-bento-cream" />
                  <span>Reset Demo & Return to Menu</span>
                </button>
              </div>
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
}
