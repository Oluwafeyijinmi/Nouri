/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import MealPlanner from './components/MealPlanner';
import SEOSection from './components/SEOSection';
import ReviewsAndFAQs from './components/ReviewsAndFAQs';
import ProfileModal from './components/ProfileModal';
import { MenuItem, SizeOption, ExtraOption, CartItem, Order } from './types';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';

import AdminDashboard from './components/AdminDashboard';
import { getAdminEmails, subscribeToMenu, subscribeToUserOrders } from './lib/db';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Toggle HTML dark class whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Listen to active user's orders in real-time
  useEffect(() => {
    if (activeUser) {
      const unsubscribe = subscribeToUserOrders(activeUser.uid, (orders) => {
        setUserOrders(orders);
      });
      return () => unsubscribe();
    } else {
      setUserOrders([]);
    }
  }, [activeUser]);

  // Listen to storefront menu items in real-time from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToMenu((items) => {
      setMenuItems(items);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setActiveUser(user);
      if (user && user.email) {
        try {
          const emails = await getAdminEmails();
          setIsAdmin(emails.includes(user.email));
        } catch(e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Register FCM / push notification tokens when activeUser changes
  useEffect(() => {
    if (activeUser) {
      import('./lib/notificationService').then(({ requestPushPermission }) => {
        requestPushPermission(activeUser.uid, activeUser.email);
      });
    }
  }, [activeUser]);

  // Re-populates cart with elements from a past order
  const handleReorder = (items: CartItem[]) => {
    setCart(items);
    setIsCartOpen(true);
  };

  // Smooth scroll helper
  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add standard menu item to cart
  const handleAddToCart = (item: MenuItem, selectedSize?: SizeOption, selectedExtras: ExtraOption[] = []) => {
    setCart((prevCart) => {
      // Calculate a deterministic unique cart ID depending on size and extras selected
      const sizeKey = selectedSize ? selectedSize.name : 'standard';
      const extrasKey = selectedExtras.map(e => e.id).sort().join('-');
      const cartItemId = `${item.id}_${sizeKey}_${extrasKey}`;

      const existingIndex = prevCart.findIndex(cartItem => cartItem.id === cartItemId);

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += 1;
        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            id: cartItemId,
            menuItem: item,
            selectedSize,
            selectedExtras,
            quantity: 1
          }
        ];
      }
    });

    setIsCartOpen(true);
  };

  // Add a fully planned week of meals directly to the cart
  const handleAddPlannedWeekToCart = (
    plannedMeals: { day: string; item: MenuItem; selectedSize?: SizeOption; notes?: string }[]
  ) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];

      plannedMeals.forEach(({ day, item, selectedSize, notes }) => {
        // Add planned meals with day tags to keep them distinct in the cart checkout receipt
        const sizeKey = selectedSize ? selectedSize.name : 'standard';
        const cartItemId = `${item.id}_${sizeKey}_planned_${day}`;

        const existingIndex = updatedCart.findIndex(cartItem => cartItem.id === cartItemId);

        if (existingIndex > -1) {
          updatedCart[existingIndex].quantity += 1;
        } else {
          updatedCart.push({
            id: cartItemId,
            menuItem: item,
            selectedSize,
            selectedExtras: [], // Standard planned meal has base extras initially
            quantity: 1,
            customNotes: notes,
            plannedDay: day
          });
        }
      });

      return updatedCart;
    });

    setIsCartOpen(true);
  };

  // Modify quantities inside the active drawer
  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map(cartItem => {
          if (cartItem.id === cartItemId) {
            const nextQty = cartItem.quantity + delta;
            return { ...cartItem, quantity: nextQty };
          }
          return cartItem;
        })
        .filter(cartItem => cartItem.quantity > 0);
    });
  };

  // Delete an item altogether
  const handleRemoveItem = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== cartItemId));
  };

  // Clear everything (called after successful simulated delivery tracker run)
  const handleClearCart = () => {
    setCart([]);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-bento-cream text-bento-text-secondary flex flex-col font-sans transition-colors duration-300" id="app-root">
      {/* 1. Header with cart state */}
      <Header 
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onScrollToSection={handleScrollToSection}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
        isAdmin={isAdmin}
        user={activeUser}
        orders={userOrders}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
      />

      {/* 2. Hero banner */}
      <Hero 
        onScrollToSection={handleScrollToSection}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        user={activeUser}
      />

      {/* 3. Catalog Section with search, categories, sizes, and extras */}
      <main className="flex-1" id="main-content">
        <MenuSection 
          onAddToCart={handleAddToCart} 
          menuItems={menuItems} 
          userOrderCount={userOrders.length}
        />
      </main>

      {/* 4. SEO Schema Metadata audit and education card */}
      <SEOSection />

      {/* 5. FAQs, Social reviews, and flyer-matching brand footer */}
      <ReviewsAndFAQs />

      {/* 6. Slide-out cart drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
        onOpenPlanner={() => setIsPlannerOpen(true)}
      />

      {/* 7. Weekly planner scheduler modal */}
      <MealPlanner 
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        onAddPlannedWeekToCart={handleAddPlannedWeekToCart}
        menuItems={menuItems}
      />

      {/* 8. Checkout Modal (includes live tracking system) */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onClearCart={handleClearCart}
      />

      {/* 9. Profile and Order History Portal Modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onReorder={handleReorder}
        activeUser={activeUser}
      />

      {/* 10. Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />
    </div>
  );
}
