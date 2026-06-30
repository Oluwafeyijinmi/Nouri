import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Clock, MapPin, Calendar, BookOpen, LogIn, User, Shield, Bell, X, Sparkles, Check, Trash2, Gift, MessageSquare, Sun, Moon } from 'lucide-react';
import { CartItem, Order, PushNotification } from '../types';
import { listenToNotifications, markNotificationAsRead, deleteNotification } from '../lib/notificationService';

interface HeaderProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onScrollToSection: (id: string) => void;
  onOpenPlanner: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  user: any; // Firebase user object
  orders?: Order[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({ 
  cart, 
  onOpenCart, 
  onScrollToSection, 
  onOpenPlanner,
  onOpenProfile,
  onOpenAdmin,
  isAdmin,
  user,
  orders = [],
  darkMode,
  onToggleDarkMode
}: HeaderProps) {
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Notification and badge animation states
  const [activeNotification, setActiveNotification] = useState<{
    orderId: string;
    status: string;
    message: string;
  } | null>(null);

  const [animateCart, setAnimateCart] = useState(false);
  const prevOrdersRef = useRef<Order[]>([]);
  const prevCartCountRef = useRef(0);

  // Push Notifications hub states
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isNotifTrayOpen, setIsNotifTrayOpen] = useState(false);
  const [livePushAlert, setLivePushAlert] = useState<PushNotification | null>(null);
  const notifTrayRef = useRef<HTMLDivElement>(null);

  // Close notification tray on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifTrayRef.current && !notifTrayRef.current.contains(event.target as Node)) {
        setIsNotifTrayOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to secure, real-time push notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = listenToNotifications(user.uid, (newList) => {
      setNotifications((prevList) => {
        // Trigger push chime sound and pop-up banner on new arrivals
        if (prevList.length > 0 && newList.length > prevList.length) {
          const newest = newList[0];
          // Check that it's a genuine new push alert we haven't seen in this browser instance
          if (newest && !prevList.some(n => n.id === newest.id)) {
            setLivePushAlert(newest);
            
            // Audio sound chime
            try {
              const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
              chime.volume = 0.4;
              chime.play();
            } catch (audioErr) {
              console.log("Audio feedback blocked:", audioErr);
            }

            // Auto-dismiss popup banner after 7 seconds
            const timer = setTimeout(() => {
              setLivePushAlert(null);
            }, 7000);
            return () => clearTimeout(timer);
          }
        }
        return newList;
      });
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
  };

  const handleClearAllNotifications = async () => {
    await Promise.all(notifications.map(n => deleteNotification(n.id)));
  };

  // Monitor order status updates
  useEffect(() => {
    if (!orders || orders.length === 0) {
      prevOrdersRef.current = [];
      return;
    }

    const prevOrders = prevOrdersRef.current;

    // Detect status updates
    orders.forEach((currentOrder) => {
      const matchingPrev = prevOrders.find((o) => o.id === currentOrder.id);
      
      if (matchingPrev) {
        // Order already existed, check if its status changed
        if (matchingPrev.status !== currentOrder.status) {
          let statusEmoji = '🍲';
          if (currentOrder.status === 'Preparing') statusEmoji = '🧑‍🍳';
          if (currentOrder.status === 'In Transit') statusEmoji = '🚴';
          if (currentOrder.status === 'Delivered') statusEmoji = '🎉';

          setActiveNotification({
            orderId: currentOrder.id,
            status: currentOrder.status,
            message: `Order ${currentOrder.id} status updated to ${currentOrder.status}! ${statusEmoji}`,
          });

          // Trigger cart button bounce animation on change
          setAnimateCart(true);
          const timer = setTimeout(() => setAnimateCart(false), 1500);
          return () => clearTimeout(timer);
        }
      } else {
        // This is a brand new order synced to Firestore
        if (prevOrders.length > 0) {
          setActiveNotification({
            orderId: currentOrder.id,
            status: currentOrder.status,
            message: `Simulated order ${currentOrder.id} successfully synced! 🍲`,
          });
          setAnimateCart(true);
          const timer = setTimeout(() => setAnimateCart(false), 1500);
          return () => clearTimeout(timer);
        }
      }
    });

    // Update the previous orders ref
    prevOrdersRef.current = orders;
  }, [orders]);

  // Monitor cart additions for animations
  useEffect(() => {
    if (totalCartItems > prevCartCountRef.current) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = totalCartItems;
  }, [totalCartItems]);

  // Filter and config for active non-delivered orders
  const activeOrders = orders.filter(o => o.status !== 'Delivered');
  const latestActiveOrder = activeOrders[0];

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'Received':
        return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Received', icon: '🍲' };
      case 'Preparing':
        return { bg: 'bg-blue-500', text: 'text-blue-500', label: 'Preparing', icon: '🧑‍🍳' };
      case 'In Transit':
        return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'In Transit', icon: '🚴' };
      default:
        return { bg: 'bg-gray-500', text: 'text-gray-500', label: status, icon: '📦' };
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-bento-cream border-b border-bento-border text-bento-text-secondary shadow-sm transition-all duration-300" id="app-header">
      {/* Top Banner: Delivery Indicator */}
      <div className="bg-bento-olive-dark text-bento-cream py-1.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 tracking-wide transition-colors duration-300" id="delivery-banner">
        <Clock className="w-4 h-4 animate-pulse text-bento-olive" />
        <span>Fresh Dinner Delivery Starts at <strong>4:30 PM</strong> Daily in Ibadan!</span>
        <span className="hidden sm:inline-block text-bento-olive opacity-50">•</span>
        <span className="hidden sm:inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-bento-olive opacity-80" />
          Proudly serving Bodija, Akobo, Oluyole & UI Environs
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 h-16 sm:h-20 md:h-24 lg:h-26 flex items-center justify-between transition-all duration-300" id="header-container">
        {/* Brand Logo & Slogan */}
        <div 
          className="flex flex-col cursor-pointer group" 
          onClick={() => onScrollToSection('hero')}
          id="brand-logo-container"
        >
          <div className="flex items-baseline gap-1" id="logo-main-row">
            <span className="font-sans text-3xl font-black text-bento-text-primary uppercase tracking-tight group-hover:text-bento-olive-dark transition-colors">
              Nouri
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-bento-olive-dark transition-colors" id="logo-dot"></span>
          </div>
          <span className="text-[10px] text-bento-text-muted tracking-wider uppercase font-mono font-bold -mt-0.5 block transition-colors">
            Made with care... Made for you...
          </span>
        </div>

        {/* Navigation Links - Centered */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-[11px] font-extrabold uppercase tracking-widest text-bento-text-primary mr-8" id="desktop-navigation">
          <button 
            onClick={() => onScrollToSection('menu')}
            className="hover:text-bento-olive-dark cursor-pointer transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-bento-text-primary after:transition-all hover:after:w-full"
            id="nav-menu"
          >
            Our Menu
          </button>
          <button 
            onClick={() => onScrollToSection('soups')}
            className="hover:text-bento-olive-dark cursor-pointer transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-bento-text-primary after:transition-all hover:after:w-full"
            id="nav-soups"
          >
            Soup Bowls (1L-5L)
          </button>
          <button 
            onClick={() => onScrollToSection('snacks')}
            className="hover:text-bento-olive-dark cursor-pointer transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-bento-text-primary after:transition-all hover:after:w-full"
            id="nav-snacks"
          >
            Premium Snacks
          </button>
          <button 
            onClick={onOpenPlanner}
            className="flex items-center gap-1.5 text-bento-olive-dark hover:text-bento-tan-dark cursor-pointer transition-colors font-black relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-bento-olive-dark after:transition-all hover:after:w-full"
            id="nav-planner"
          >
            <Calendar className="w-3.5 h-3.5" />
            Weekly Dinner Planner
          </button>
          <button 
            onClick={() => onScrollToSection('reviews')}
            className="hover:text-bento-olive-dark cursor-pointer transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-bento-text-primary after:transition-all hover:after:w-full"
            id="nav-reviews"
          >
            Reviews
          </button>
          <button 
            onClick={() => onScrollToSection('seo-audit')}
            className="flex items-center gap-1.5 text-bento-text-primary hover:text-bento-olive-dark cursor-pointer text-[10px] font-mono border-2 border-bento-border bg-white px-3 py-1 rounded-xl shadow-sm hover:shadow hover:bg-bento-cream transition-all"
            id="nav-seo"
          >
            <BookOpen className="w-3.5 h-3.5 text-bento-text-muted" />
            SEO Audit
          </button>
        </nav>

        {/* Cart & Planner CTA */}
        <div className="flex items-center gap-2 sm:gap-4" id="header-actions">
          
          {/* Admin Button */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-bento-olive text-bento-olive-dark hover:bg-opacity-80 transition-all cursor-pointer flex items-center gap-2 shadow-sm text-xs font-bold"
              title="Admin Panel"
            >
              <Shield className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider hidden sm:block">Admin</span>
            </button>
          )}

          {/* User Account / Profile Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-bento-border bg-bento-card-bg text-bento-text-secondary hover:bg-bento-gray transition-all cursor-pointer flex items-center gap-2 group shadow-sm text-xs font-bold"
              title="Profile & Order History"
              id="profile-toggle-btn"
            >
              <div className="w-5 h-5 rounded-full bg-bento-olive flex items-center justify-center text-bento-olive-dark text-[10px] font-extrabold uppercase">
                {user.email ? user.email.slice(0, 2) : 'ME'}
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider hidden sm:block">
                My Profile
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-bento-border bg-bento-card-bg text-bento-text-secondary hover:bg-bento-gray transition-all cursor-pointer flex items-center gap-2 group shadow-sm text-xs font-bold"
              title="Sign In / Register"
              id="profile-toggle-btn"
            >
              <LogIn className="w-4 h-4 text-bento-olive-dark group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-wider hidden sm:block">Sign In</span>
            </button>
          )}

          {/* Notification Bell with Badge & Dropdown Tray */}
          {user && (
            <div className="relative" ref={notifTrayRef} id="push-notification-bell-container">
              <button
                onClick={() => setIsNotifTrayOpen(!isNotifTrayOpen)}
                className={`p-2.5 rounded-2xl border border-bento-border bg-white text-bento-text-primary hover:bg-bento-cream transition-all cursor-pointer relative flex items-center justify-center`}
                title="Notifications"
                id="notification-hub-btn"
              >
                <Bell className="w-5 h-5 text-bento-text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Tray */}
              {isNotifTrayOpen && (
                <div 
                  className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border-2 border-bento-border rounded-2xl shadow-xl z-50 overflow-hidden font-sans"
                  id="notifications-tray-dropdown"
                >
                  {/* Tray Header */}
                  <div className="p-3.5 bg-bento-cream/60 border-b border-bento-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-bento-olive-dark" />
                      <span className="text-[10px] font-black text-bento-text-primary uppercase tracking-widest">Notification Center</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase font-mono">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-bento-olive-dark hover:underline cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleClearAllNotifications}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tray Body */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-bento-border/40">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-bento-text-muted">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
                        <p className="text-xs font-bold">No notifications yet</p>
                        <p className="text-[10px] font-medium mt-1">Status updates and promos will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3 flex gap-2.5 transition-colors hover:bg-bento-cream/20 ${!notif.read ? 'bg-bento-cream/30 font-semibold border-l-4 border-l-bento-olive-dark' : ''}`}
                        >
                          {/* Type Icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            notif.type === 'promo' ? 'bg-red-50 text-red-500' : 'bg-bento-olive/10 text-bento-olive-dark'
                          }`}>
                            {notif.type === 'promo' ? <Gift className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-bento-text-primary truncate">{notif.title}</h4>
                              <span className="text-[8px] font-mono text-bento-text-muted shrink-0">
                                {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-bento-text-secondary leading-normal mt-0.5 break-words">
                              {notif.body}
                            </p>
                            
                            {/* Action Buttons inside notification */}
                            <div className="flex items-center gap-3 mt-1.5">
                              {!notif.read && (
                                <button
                                  onClick={() => markNotificationAsRead(notif.id)}
                                  className="text-[8px] font-bold uppercase font-mono text-bento-olive-dark hover:underline flex items-center gap-0.5"
                                >
                                  <Check className="w-2.5 h-2.5" /> Read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                className="text-[8px] font-bold uppercase font-mono text-bento-text-muted hover:text-red-600 flex items-center gap-0.5"
                              >
                                <Trash2 className="w-2.5 h-2.5" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-2xl border border-bento-border bg-bento-card-bg text-bento-text-primary hover:bg-bento-cream transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            id="theme-toggle-btn"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="w-5 h-5 text-bento-text-primary" />
            )}
          </button>

          {/* Mobile Planner Trigger */}
          <button 
            onClick={onOpenPlanner}
            className="md:hidden p-2 text-bento-olive-dark hover:bg-bento-olive rounded-full transition-colors relative"
            title="Weekly Planner"
            id="mobile-planner-btn"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* Live Order Status tracker pill (visible on md+) */}
          {latestActiveOrder && (
            <div 
              onClick={onOpenProfile}
              className="hidden md:flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-bento-border bg-white text-xs font-bold hover:bg-bento-cream cursor-pointer select-none transition-all duration-300 shadow-sm"
              title="Click to view live order tracking timeline!"
              id="header-order-status-pill"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getStatusBadgeConfig(latestActiveOrder.status).bg} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusBadgeConfig(latestActiveOrder.status).bg}`}></span>
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-bento-text-primary font-black">
                {getStatusBadgeConfig(latestActiveOrder.status).icon} {getStatusBadgeConfig(latestActiveOrder.status).label}
              </span>
            </div>
          )}

          {/* Cart Icon with dynamic bounce and notification dropdown */}
          <div className="relative" id="cart-btn-container">
            {latestActiveOrder && (
              <span className="absolute -top-1 -left-1 flex h-3 w-3 z-20" id="order-status-dot-wrapper">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getStatusBadgeConfig(latestActiveOrder.status).bg} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusBadgeConfig(latestActiveOrder.status).bg} border border-white shadow-sm`}></span>
              </span>
            )}

            <button 
              onClick={() => {
                onOpenCart();
                setActiveNotification(null);
              }}
              className={`bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 relative cursor-pointer ${
                animateCart ? 'animate-bounce scale-105 shadow-md ring-2 ring-bento-olive' : ''
              }`}
              id="cart-toggle-btn"
            >
              <div className="relative" id="cart-icon-wrapper">
                <ShoppingBag className="w-4.5 h-4.5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-3.5 -right-3.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow" id="cart-badge-count">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">My Order</span>
            </button>

            {/* Dynamic Floating Toast for order status updates */}
            {activeNotification && (
              <div 
                className="absolute right-0 top-14 w-64 p-3.5 bg-white border border-bento-border rounded-2xl shadow-2xl z-50 animate-slideIn flex flex-col gap-2.5 border-l-4 border-l-bento-olive-dark"
                id="header-status-notification-toast"
              >
                <div className="flex justify-between items-start" id="toast-head">
                  <div className="flex items-center gap-1.5" id="toast-title-row">
                    <Bell className="w-4 h-4 text-bento-olive-dark animate-pulse" />
                    <span className="font-sans font-black text-[9px] uppercase tracking-wider text-bento-text-primary">Order Status Update</span>
                  </div>
                  <button 
                    onClick={() => setActiveNotification(null)}
                    className="p-1 rounded hover:bg-bento-cream text-bento-text-muted hover:text-bento-text-primary transition-all cursor-pointer"
                    id="toast-close-btn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <p className="text-xs font-bold text-bento-text-secondary leading-normal" id="toast-body-text">
                  {activeNotification.message}
                </p>

                <button
                  onClick={() => {
                    onOpenProfile();
                    setActiveNotification(null);
                  }}
                  className="bg-bento-olive/10 hover:bg-bento-olive-dark hover:text-bento-cream text-bento-olive-dark font-mono text-[10px] font-bold py-1.5 px-3 rounded-xl uppercase tracking-wider transition-all text-center cursor-pointer"
                  id="toast-timeline-link"
                >
                  Open Timeline
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Global Slide-In Push Notification Banner */}
      {livePushAlert && (
        <div 
          className="fixed top-6 right-6 max-w-sm w-full bg-white border-2 border-bento-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideIn border-l-4 border-l-bento-olive-dark p-4 flex gap-3.5"
          id="global-push-notification-toast"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            livePushAlert.type === 'promo' ? 'bg-red-50 text-red-500' : 'bg-bento-olive/15 text-bento-olive-dark'
          }`}>
            {livePushAlert.type === 'promo' ? <Gift className="w-5 h-5" /> : <Sparkles className="w-5 h-5 text-bento-olive-dark" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <span className="text-[9px] font-black text-bento-olive-dark uppercase tracking-widest font-mono">
                {livePushAlert.type === 'promo' ? '🎁 Premium Offer' : '🔔 Nouri Push Alert'}
              </span>
              <button 
                onClick={() => setLivePushAlert(null)}
                className="text-bento-text-muted hover:text-bento-text-primary p-0.5 hover:bg-bento-cream rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xs font-black text-bento-text-primary mt-1">{livePushAlert.title}</h3>
            <p className="text-[11px] text-bento-text-secondary mt-1 leading-normal">{livePushAlert.body}</p>
          </div>
        </div>
      )}
    </header>
  );
}
