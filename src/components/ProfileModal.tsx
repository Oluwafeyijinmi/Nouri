import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  History, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Compass, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Truck, 
  ShoppingBag,
  RefreshCw,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, saveUserProfile, subscribeToUserOrders, UserProfile } from '../lib/db';
import { Order as OrderType, CartItem } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReorder: (items: CartItem[]) => void;
  activeUser: FirebaseUser | null;
}

type TabType = 'history' | 'profile';

export default function ProfileModal({ isOpen, onClose, onReorder, activeUser }: ProfileModalProps) {
  // Auth state
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('history');

  // Profile fields state
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    deliveryInstructions: '',
    deliveryTime: '4:30 PM - 6:00 PM',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Load profile when user changes
  useEffect(() => {
    if (activeUser) {
      getUserProfile(activeUser.uid).then((p) => {
        if (p) {
          setProfile(p);
        } else {
          // Initialize if empty
          setProfile({
            name: '',
            phone: '',
            address: '',
            landmark: '',
            deliveryInstructions: '',
            deliveryTime: '4:30 PM - 6:00 PM',
          });
        }
      });

      // Subscribe to live order updates
      setLoadingOrders(true);
      const unsubscribe = subscribeToUserOrders(activeUser.uid, (fetchedOrders) => {
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      });

      return () => unsubscribe();
    } else {
      setOrders([]);
    }
  }, [activeUser]);

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      const isOperationNotAllowed = err.code === 'auth/operation-not-allowed' ||
                                    (err.message && err.message.includes('operation-not-allowed'));
      if (isOperationNotAllowed) {
        setAuthError('Google Sign-In is not enabled in the Firebase Console. Go to Firebase Console -> Authentication -> Sign-in Method, and enable "Google".');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('The sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/blocked-by-popup-requestor') {
        setAuthError('The sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setAuthError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    setLoading(true);
    setSaveSuccess(false);

    try {
      await saveUserProfile(activeUser.uid, {
        ...profile,
        email: activeUser.email || 'guest@nouri.delivery'
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in transit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-sm animate-fadeIn"
      id="profile-modal-overlay"
    >
      <div 
        className="bg-bento-card-bg rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-bento-border transition-colors duration-300"
        id="profile-modal"
      >
        {/* Header */}
        <div className="bg-bento-cream-dark text-bento-cream-light p-5 flex items-center justify-between border-b border-bento-border transition-colors" id="profile-header">
          <div className="flex items-center gap-3" id="profile-header-title">
            <div className="bg-bento-olive p-2.5 rounded-2xl text-bento-olive-dark" id="profile-header-icon-bg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-xl font-black uppercase tracking-tight text-bento-cream-light">
                {activeUser ? 'My Nouri Account' : 'Welcome to Nouri'}
              </h2>
              <p className="text-xs text-bento-text-muted opacity-90">
                {activeUser ? `Logged in as: ${activeUser.email || 'Guest User'}` : 'Sign in to track orders & save delivery details'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-bento-text-muted hover:text-bento-cream-light hover:bg-bento-cream/10 transition-colors cursor-pointer"
            id="profile-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6" id="profile-modal-body">
          {!activeUser ? (
            /* Auth screen */
            <div className="max-w-md mx-auto py-8 px-4 space-y-8 flex flex-col items-center justify-center" id="auth-screen">
              <div className="text-center space-y-3" id="auth-intro">
                <span className="text-[10px] uppercase font-mono tracking-widest text-bento-olive-dark font-extrabold px-3 py-1 bg-bento-olive/20 rounded-full border border-bento-olive/20">
                  SECURE AUTHENTICATION
                </span>
                <h3 className="text-xl font-extrabold text-bento-text-primary tracking-tight">
                  Welcome to Nouri
                </h3>
                <p className="text-sm text-bento-text-secondary leading-relaxed max-w-sm mx-auto">
                  Sign in securely with Google to preserve your past orders, auto-fill your delivery coordinates, and pre-plan weekly meals.
                </p>
              </div>

              {authError && (
                <div className="w-full p-4 rounded-xl bg-red-50 text-red-700 text-xs flex flex-col gap-2 border border-red-100 animate-fadeIn" id="auth-error-box">
                  <div className="flex items-start gap-2">
                    <span className="font-bold">Error:</span>
                    <span>{authError}</span>
                  </div>
                </div>
              )}

              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-white border border-bento-border text-bento-text-primary hover:bg-bento-cream active:scale-[0.98] transition-all duration-300 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer shadow-sm"
                id="auth-google-btn"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-bento-olive-dark" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                )}
                <span>{loading ? 'Connecting...' : 'Sign In with Google'}</span>
              </button>

              <div className="text-[10px] text-bento-text-muted font-mono text-center max-w-[240px]" id="auth-secure-notice">
                Protected by Google Firebase. Nouri never stores your password or payment details.
              </div>
            </div>
          ) : (
            /* Logged in screens: Profile and Order History */
            <div className="space-y-6" id="dashboard-screen">
              {/* Tabs Switcher */}
              <div className="flex border-b border-bento-border pb-1 gap-2" id="dashboard-tabs">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'history' 
                      ? 'border-bento-olive-dark text-bento-text-primary' 
                      : 'border-transparent text-bento-text-muted hover:text-bento-text-secondary'
                  }`}
                  id="tab-history"
                >
                  <History className="w-4 h-4" />
                  Order History (Last 30)
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'profile' 
                      ? 'border-bento-olive-dark text-bento-text-primary' 
                      : 'border-transparent text-bento-text-muted hover:text-bento-text-secondary'
                  }`}
                  id="tab-profile"
                >
                  <User className="w-4 h-4" />
                  Delivery Coordinates
                </button>

                <div className="ml-auto">
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700 uppercase font-mono font-bold tracking-wider hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    id="dashboard-signout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </div>

              {activeTab === 'profile' ? (
                /* Profile Edit form */
                <form onSubmit={handleSaveProfile} className="space-y-4" id="profile-coordinates-form">
                  <div className="bg-bento-olive/5 border border-bento-olive/20 rounded-2xl p-4 text-xs text-bento-olive-dark leading-relaxed font-medium" id="profile-banner">
                    💡 **Smart Sync Active**: Saved delivery coordinates automatically pre-fill your checkout form so you can complete dinner bookings in one click!
                  </div>

                  {saveSuccess && (
                    <div className="p-3.5 rounded-xl bg-green-50 text-green-700 text-xs flex items-center gap-2 border border-green-100" id="profile-save-success">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      Coordinates updated successfully!
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="profile-fields-grid">
                    <div className="space-y-1" id="profile-field-name">
                      <label className="text-[10px] font-mono font-bold text-bento-text-primary uppercase tracking-wider block">Receiver Name</label>
                      <input 
                        type="text"
                        value={profile.name || ''}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full bg-bento-cream text-bento-text-primary border border-bento-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                      />
                    </div>

                    <div className="space-y-1" id="profile-field-phone">
                      <label className="text-[10px] font-mono font-bold text-bento-text-primary uppercase tracking-wider block">Phone Number</label>
                      <input 
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="e.g. +234 703 770 7699"
                        className="w-full bg-bento-cream text-bento-text-primary border border-bento-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                      />
                    </div>
                  </div>

                  <div className="space-y-1" id="profile-field-address">
                    <label className="text-[10px] font-mono font-bold text-bento-text-primary uppercase tracking-wider block">Delivery Street Address (Ibadan Only)</label>
                    <input 
                      type="text"
                      value={profile.address || ''}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Street No, Building Name, Estate or Area"
                      className="w-full bg-bento-cream text-bento-text-primary border border-bento-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="profile-fields-secondary">
                    <div className="space-y-1" id="profile-field-landmark">
                      <label className="text-[10px] font-mono font-bold text-bento-text-primary uppercase tracking-wider block">Nearest Landmark</label>
                      <input 
                        type="text"
                        value={profile.landmark || ''}
                        onChange={(e) => setProfile({ ...profile, landmark: e.target.value })}
                        placeholder="e.g. UI Gate, Bodija Market, Ventura"
                        className="w-full bg-bento-cream text-bento-text-primary border border-bento-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                      />
                    </div>

                    <div className="space-y-1" id="profile-field-time">
                      <label className="text-[10px] font-mono font-bold text-bento-text-primary uppercase tracking-wider block">Preferred Delivery Window</label>
                      <select 
                        value={profile.deliveryTime || '4:30 PM - 6:00 PM'}
                        onChange={(e) => setProfile({ ...profile, deliveryTime: e.target.value })}
                        className="w-full bg-bento-cream text-bento-text-primary border border-bento-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark cursor-pointer"
                      >
                        <option value="4:30 PM - 6:00 PM">4:30 PM - 6:00 PM (Early Dinner)</option>
                        <option value="6:00 PM - 7:30 PM">6:00 PM - 7:30 PM (Standard Dinner)</option>
                        <option value="7:30 PM - 9:00 PM">7:30 PM - 9:00 PM (Late Dinner)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1" id="profile-field-instructions">
                    <label className="text-[10px] font-mono font-bold text-bento-text-primary uppercase tracking-wider block">Driver Delivery Instructions</label>
                    <textarea 
                      value={profile.deliveryInstructions || ''}
                      onChange={(e) => setProfile({ ...profile, deliveryInstructions: e.target.value })}
                      placeholder="e.g. Leave with security guard, call when you reach Bodija police station..."
                      rows={2}
                      className="w-full bg-bento-cream text-bento-text-primary border border-bento-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-bento-text-primary text-bento-cream hover:bg-bento-olive-dark transition-all duration-300 text-xs font-black uppercase tracking-wider cursor-pointer"
                    id="profile-save-btn"
                  >
                    {loading ? 'Saving Coordinates...' : 'Save delivery coordinates'}
                  </button>
                </form>
              ) : (
                /* Order History Tab */
                <div className="space-y-4" id="order-history-tab">
                  {loadingOrders ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-bento-text-muted" id="orders-loading-state">
                      <RefreshCw className="w-7 h-7 animate-spin text-bento-olive-dark" />
                      <p className="text-xs font-bold uppercase tracking-wider font-mono">Loading Order History...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 bg-bento-cream border border-bento-border rounded-2xl space-y-3" id="orders-empty-state">
                      <div className="bg-bento-olive/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-bento-olive-dark">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-sans text-sm font-bold text-bento-text-primary uppercase tracking-tight">No order history found</h4>
                        <p className="text-xs text-bento-text-muted mt-1 max-w-sm mx-auto">You haven't checked out any dinners yet. Place an order to see it live-tracked here!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3" id="orders-list-block">
                      <p className="text-[10px] font-mono text-bento-text-muted uppercase tracking-wider">
                        Showing last {orders.length} orders (Max 30 days history)
                      </p>

                      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1" id="orders-scroll-container">
                        {orders.map((order) => {
                          const isExpanded = expandedOrder === order.id;
                          return (
                            <div 
                              key={order.id}
                              className="neomorphic-card rounded-2xl border border-bento-border/10 overflow-hidden transition-all duration-300 bg-white"
                              id={`order-card-record-${order.id}`}
                            >
                              {/* Order summary bar */}
                              <div 
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-bento-cream/20 transition-colors"
                                id={`order-summary-${order.id}`}
                              >
                                <div className="space-y-1.5" id={`order-id-meta-${order.id}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-black text-bento-text-primary">{order.id}</span>
                                    <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-bento-text-muted">
                                    <span>{order.createdAt}</span>
                                    <span>•</span>
                                    <span className="font-bold text-bento-text-secondary">
                                      ₦{order.total.toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 ml-auto" id={`order-summary-actions-${order.id}`}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onReorder(order.items);
                                      onClose();
                                    }}
                                    className="bg-bento-olive/15 text-bento-olive-dark hover:bg-bento-olive-dark hover:text-bento-cream px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                    id={`reorder-btn-${order.id}`}
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Reorder
                                  </button>

                                  <ChevronDown className={`w-4 h-4 text-bento-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              {/* Order details expansion */}
                              {isExpanded && (
                                <div className="p-4 border-t border-bento-border bg-bento-cream/15 space-y-4 text-xs animate-fadeIn" id={`order-details-${order.id}`}>
                                  {/* Delivery Target details */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-bento-border/30 text-bento-text-secondary" id="order-delivery-meta">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono text-bento-text-muted uppercase block">Delivery coordinates</span>
                                      <div className="font-medium flex items-start gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-bento-olive-dark mt-0.5 flex-shrink-0" />
                                        <div>
                                          <p className="font-bold text-bento-text-primary">{order.customer.name}</p>
                                          <p>{order.customer.address}</p>
                                          {order.customer.landmark && <p className="text-[10px] text-bento-text-muted">Landmark: {order.customer.landmark}</p>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono text-bento-text-muted uppercase block">Contact & instructions</span>
                                      <p className="flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5 text-bento-olive-dark" />
                                        {order.customer.phone}
                                      </p>
                                      {order.customer.deliveryInstructions && (
                                        <p className="text-[10px] italic text-bento-text-muted bg-bento-cream/40 p-1.5 rounded-lg border border-bento-border/10 mt-1">
                                          "{order.customer.deliveryInstructions}"
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Cart items list */}
                                  <div className="space-y-2" id="order-items-breakdown">
                                    <span className="text-[9px] font-mono text-bento-text-muted uppercase block">Purchased Dinner Items</span>
                                    <div className="space-y-2">
                                      {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-bento-border/10 text-xs">
                                          <div className="space-y-0.5">
                                            <span className="font-bold text-bento-text-primary">
                                              {item.quantity}x {item.menuItem.name}
                                            </span>
                                            {item.selectedSize && (
                                              <span className="text-[10px] text-bento-olive-dark bg-bento-olive/10 px-1.5 py-0.5 rounded ml-2 font-bold">
                                                {item.selectedSize.name}
                                              </span>
                                            )}
                                            {item.selectedExtras.length > 0 && (
                                              <p className="text-[10px] text-bento-text-muted font-mono">
                                                + Extras: {item.selectedExtras.map(e => e.name).join(', ')}
                                              </p>
                                            )}
                                          </div>
                                          <span className="font-mono text-bento-text-primary">
                                            ₦{((item.selectedSize ? item.selectedSize.price : item.menuItem.price) * item.quantity).toLocaleString()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Simulated status tracking visual timeline */}
                                  <div className="pt-2" id="order-timeline">
                                    <span className="text-[9px] font-mono text-bento-text-muted uppercase block mb-3">Live tracking visual timeline</span>
                                    <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-center relative pb-2">
                                      <div className={`space-y-1.5 ${order.status === 'Received' || order.status === 'Preparing' || order.status === 'In Transit' || order.status === 'Delivered' ? 'text-bento-olive-dark font-black' : 'text-bento-text-muted'}`}>
                                        <div className={`h-1.5 rounded-full ${order.status === 'Received' || order.status === 'Preparing' || order.status === 'In Transit' || order.status === 'Delivered' ? 'bg-orange-500' : 'bg-bento-border'}`}></div>
                                        <span>RECEIVED</span>
                                      </div>
                                      <div className={`space-y-1.5 ${order.status === 'Preparing' || order.status === 'In Transit' || order.status === 'Delivered' ? 'text-bento-olive-dark font-black' : 'text-bento-text-muted'}`}>
                                        <div className={`h-1.5 rounded-full ${order.status === 'Preparing' || order.status === 'In Transit' || order.status === 'Delivered' ? 'bg-blue-500' : 'bg-bento-border'}`}></div>
                                        <span>PREPARING</span>
                                      </div>
                                      <div className={`space-y-1.5 ${order.status === 'In Transit' || order.status === 'Delivered' ? 'text-bento-olive-dark font-black' : 'text-bento-text-muted'}`}>
                                        <div className={`h-1.5 rounded-full ${order.status === 'In Transit' || order.status === 'Delivered' ? 'bg-yellow-500' : 'bg-bento-border'}`}></div>
                                        <span>IN TRANSIT</span>
                                      </div>
                                      <div className={`space-y-1.5 ${order.status === 'Delivered' ? 'text-green-600 font-black' : 'text-bento-text-muted'}`}>
                                        <div className={`h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-green-600' : 'bg-bento-border'}`}></div>
                                        <span>DELIVERED</span>
                                      </div>
                                    </div>

                                    {/* Interactive Delivery Driver Tracker Map Simulation */}
                                    <div className="bg-bento-olive/5 border border-bento-olive-border/30 rounded-2xl p-3.5 space-y-3 mt-4 overflow-hidden relative" id={`order-live-map-tracker-${order.id}`}>
                                      <div className="flex items-center justify-between" id="driver-info-header">
                                        <div className="flex items-center gap-2" id="driver-avatar-info">
                                          <div className="w-8 h-8 rounded-full bg-bento-olive-dark text-bento-cream flex items-center justify-center font-bold text-xs shadow-sm">
                                            🧑‍✈️
                                          </div>
                                          <div>
                                            <h5 className="text-[11px] font-black text-bento-text-primary uppercase tracking-tight">Segun (Nouri Express)</h5>
                                            <p className="text-[9px] text-bento-text-muted">Riding Raleigh Delivery Cycle • Verified Carrier</p>
                                          </div>
                                        </div>
                                        <span className="bg-bento-olive/20 text-bento-olive-dark text-[9px] font-mono px-2 py-0.5 rounded-md font-bold">
                                          ETA: {order.status === 'Received' ? '45 mins' : order.status === 'Preparing' ? '30 mins' : order.status === 'In Transit' ? '12 mins' : 'Delivered'}
                                        </span>
                                      </div>

                                      {/* Simulated Road Route progress bar */}
                                      <div className="h-10 bg-bento-cream-dark/15 rounded-xl relative overflow-hidden border border-bento-border/40 flex items-center px-4" id="simulated-map-road">
                                        {/* Dotted center lines */}
                                        <div className="absolute inset-x-0 h-[1px] border-t border-dashed border-bento-border/50 top-1/2 -translate-y-1/2"></div>
                                        
                                        {/* Kitchen Landmark */}
                                        <span className="text-xs relative z-10" title="Kitchen">🍳</span>
                                        
                                        {/* Animated Driver Rider Cycle */}
                                        <div 
                                          className="absolute text-base transition-all duration-1000 ease-in-out"
                                          style={{
                                            left: order.status === 'Received' ? '12%' : order.status === 'Preparing' ? '38%' : order.status === 'In Transit' ? '72%' : '90%',
                                            transform: 'translateY(-2px)'
                                          }}
                                          id="driver-rider-bike"
                                        >
                                          🚴💨
                                        </div>

                                        {/* Destination Landmark */}
                                        <span className="text-xs relative z-10 ml-auto" title="Delivery Point">🏡</span>
                                      </div>

                                      <div className="text-[9px] text-bento-text-muted leading-relaxed flex flex-col sm:flex-row justify-between gap-1" id="driver-status-footnote">
                                        <span>Kitchen (Bodija)</span>
                                        <span className="font-bold text-bento-olive-dark text-center uppercase tracking-wider">
                                          {order.status === 'Received' && "Order Received, chef reviewing ingredients"}
                                          {order.status === 'Preparing' && "Segun is waiting in Bodija Kitchen while soup simmers"}
                                          {order.status === 'In Transit' && "Segun is paddling fast past Ring Road/UI Gate!"}
                                          {order.status === 'Delivered' && "Segun has handed over the warm dish. E gba fun wa! 🎉"}
                                        </span>
                                        <span>{order.customer.landmark || "Destination"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
