import React from 'react';
import { ShoppingBag, Calendar, Clock, MapPin, CheckCircle, ArrowRight, User } from 'lucide-react';

interface HeroProps {
  onScrollToSection: (id: string) => void;
  onOpenPlanner: () => void;
  onOpenProfile: () => void;
  user: any; // Firebase user object
}

export default function Hero({ onScrollToSection, onOpenPlanner, onOpenProfile, user }: HeroProps) {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="hero">
      {/* Grid container mirroring the layout of the Bento theme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-auto" id="hero-bento-grid">
        
        {/* Box 1: Left Main Hero Banner */}
        <div className="lg:col-span-8 bg-bento-olive rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden border border-bento-olive-border/30 min-h-[380px] neomorphic-shadow" id="bento-box-main">
          {/* Background Decorative Large Typography */}
          <div className="absolute right-[-10px] bottom-[-30px] opacity-[0.07] font-black text-[120px] sm:text-[180px] leading-none text-bento-olive-dark select-none pointer-events-none font-sans">
            SOUP
          </div>

          <div className="relative z-10 space-y-4" id="main-bento-content">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bento-olive-dark text-bento-cream text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors" id="bento-badge-now-serving">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
              Now Serving Ibadan
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tighter text-bento-text-primary transition-colors" id="bento-main-heading">
              Skip the kitchen.<br />
              Not the meal.
            </h1>
            
            <p className="text-sm text-bento-olive-dark max-w-lg font-medium leading-relaxed opacity-95 transition-colors" id="bento-main-desc">
              You work hard all day. The last thing you need is kitchen stress. Wholesome Nigerian dinners (Swallows, Rice, and Soup Bowls) and crunchy snacks prepared fresh and delivered starting at <strong>4:30 PM</strong>.
            </p>
          </div>

          {/* Interactive CTAs inside the main box */}
          <div className="relative z-10 flex flex-wrap gap-3 mt-6 pt-4 border-t border-bento-olive-border/60" id="bento-main-actions">
            <button
              onClick={() => onScrollToSection('menu')}
              className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
              id="hero-primary-cta"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              Explore & Order Menu
            </button>

            <button
              onClick={onOpenPlanner}
              className="bg-bento-card-bg hover:bg-bento-gray text-bento-text-secondary font-bold border border-bento-olive-border px-6 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
              id="hero-secondary-cta"
            >
              <Calendar className="w-4.5 h-4.5 text-bento-olive-dark" />
              Pre-Plan Weekly Dinner
            </button>
          </div>
        </div>

        {/* Box 2: Soups By The Liter */}
        <button
          onClick={() => onScrollToSection('soups')}
          className="lg:col-span-4 bg-bento-tan rounded-3xl p-6 border border-bento-tan-border/40 flex flex-col justify-between text-left group cursor-pointer min-h-[180px] neomorphic-shadow"
          id="bento-box-soups"
        >
          <div className="flex justify-between items-start w-full" id="soups-bento-header">
            <h3 className="text-xl font-extrabold text-bento-tan-dark leading-tight font-sans transition-colors">
              Soups By<br />The Liter
            </h3>
            <span className="bg-bento-card-bg rounded-full p-2.5 shadow-sm group-hover:bg-bento-tan-dark group-hover:text-bento-cream transition-colors duration-300">
              <ArrowRight className="w-4.5 h-4.5 text-bento-tan-dark group-hover:text-bento-cream transition-colors" />
            </span>
          </div>

          <div className="space-y-3" id="soups-bento-footer">
            <p className="text-xs text-bento-tan-dark/80 font-medium transition-colors">Bulk bowls to feed your entire week.</p>
            <div className="flex flex-wrap gap-1.5" id="soup-size-tags">
              <span className="text-[10px] font-bold border border-bento-tan-dark px-2.5 py-1 rounded-full text-bento-tan-dark bg-bento-card-bg/40 transition-colors">1L Bowl</span>
              <span className="text-[10px] font-bold border border-bento-tan-dark px-2.5 py-1 rounded-full text-bento-tan-dark bg-bento-card-bg/40 transition-colors">3L Bowl</span>
              <span className="text-[10px] font-bold border border-bento-tan-dark px-2.5 py-1 rounded-full text-bento-tan-dark bg-bento-card-bg/40 transition-colors">5L Bowl</span>
            </div>
          </div>
        </button>

        {/* Box 3: Snacks Box */}
        <button
          onClick={() => onScrollToSection('snacks')}
          className="lg:col-span-4 bg-bento-gray rounded-3xl p-6 border border-bento-border/30 flex flex-col justify-between text-left group cursor-pointer min-h-[180px] neomorphic-shadow"
          id="bento-box-snacks"
        >
          <div className="flex justify-between items-start w-full" id="snacks-bento-header">
            <h3 className="text-xl font-extrabold text-bento-text-secondary leading-tight transition-colors">
              Crunchy<br />Snacks
            </h3>
            <span className="bg-bento-card-bg rounded-full p-2.5 shadow-sm group-hover:bg-bento-text-primary group-hover:text-bento-cream transition-colors duration-300">
              <ArrowRight className="w-4.5 h-4.5 text-bento-text-secondary group-hover:text-bento-cream transition-colors" />
            </span>
          </div>

          <div className="space-y-2" id="snacks-bento-footer">
            <p className="text-xs text-bento-text-secondary/80 font-medium leading-relaxed transition-colors">
              ChinChin • Plantain • Banana<br />
              Homemade, crispy, and perfect office fuel.
            </p>
          </div>
        </button>

        {/* Box 4: Timing & Production */}
        <div className="lg:col-span-4 bg-bento-text-secondary rounded-3xl p-6 text-bento-cream flex flex-col justify-between border border-bento-border/20 min-h-[180px] neomorphic-shadow" id="bento-box-timing">
          <div className="flex items-start justify-between" id="timing-bento-header">
            <span className="bg-bento-olive-dark text-bento-cream font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors">DAILY SCHEDULE</span>
            <Clock className="w-5 h-5 text-bento-olive" />
          </div>

          <div className="space-y-1.5" id="timing-bento-footer">
            <span className="text-[10px] font-bold uppercase tracking-wider text-bento-text-muted transition-colors">TIMING ASSURANCE</span>
            <h4 className="text-lg font-bold leading-tight text-bento-cream">Delivery starts daily at 4:30 PM</h4>
            <p className="text-[11px] opacity-80 font-light text-bento-cream">Cooked fresh in the morning, on your table by dinner.</p>
          </div>
        </div>

        {/* Box 5: Live Inventory Status */}
        <div className="lg:col-span-4 bg-bento-card-bg rounded-3xl p-6 border border-bento-border/40 flex flex-col justify-between min-h-[180px] neomorphic-shadow" id="bento-box-status">
          <div className="flex items-center justify-between" id="status-bento-header">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-tight text-bento-text-secondary transition-colors">Live Kitchen Status</span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-bento-gray text-bento-text-muted px-2 py-0.5 rounded transition-colors">AUTO REFRESH</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3" id="status-bento-grid">
            <div className="flex justify-between text-xs py-1 border-b border-bento-gray">
              <span className="text-bento-text-muted">Efo Riro</span>
              <span className="font-bold text-bento-olive-dark">Ready</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-bento-gray">
              <span className="text-bento-text-muted">Egusi Soup</span>
              <span className="font-bold text-bento-olive-dark">Ready</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-bento-text-muted">Chin Chin</span>
              <span className="font-bold text-green-500">Fresh</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-bento-text-muted">Chips</span>
              <span className="font-bold text-bento-tan-dark">Limited</span>
            </div>
          </div>
        </div>

        {/* Box 6: Dynamic Auth Box */}
        {!user ? (
          <div className="lg:col-span-12 bg-bento-tan/30 border border-bento-tan-border/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 neomorphic-shadow" id="hero-auth-prompt">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="bg-bento-tan p-3 rounded-2xl text-bento-tan-dark hidden sm:block">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-bento-text-primary text-base">Join the Nouri Family!</h3>
                <p className="text-xs text-bento-text-secondary">Sign up or sign in to save delivery coordinates, track live orders, and unlock weekly dinner planning.</p>
              </div>
            </div>
            <button
              onClick={onOpenProfile}
              className="w-full sm:w-auto bg-bento-tan-dark hover:bg-opacity-90 text-bento-cream font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 hover:scale-[1.01]"
            >
              Sign In / Sign Up
            </button>
          </div>
        ) : (
          <div className="lg:col-span-12 bg-bento-olive/10 border border-bento-olive-border/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 neomorphic-shadow" id="hero-auth-welcome">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="bg-bento-olive p-3 rounded-2xl text-bento-olive-dark hidden sm:block">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-bento-text-primary text-base">Welcome Back to Nouri!</h3>
                <p className="text-xs text-bento-text-secondary">Logged in as <span className="font-mono font-bold text-bento-olive-dark">{user.email}</span>. Click to view your past orders, delivery coordinates, or plan your week.</p>
              </div>
            </div>
            <button
              onClick={onOpenProfile}
              className="w-full sm:w-auto bg-bento-olive-dark hover:bg-opacity-90 text-bento-cream font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 hover:scale-[1.01]"
            >
              My Dashboard
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
