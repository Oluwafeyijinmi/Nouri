import React, { useState } from 'react';
import { X, Calendar, Plus, Trash2, CheckCircle2, ChevronRight, HelpCircle, Sparkles } from 'lucide-react';
import { MenuItem, SizeOption, CartItem } from '../types';
import { MENU_ITEMS } from '../data';

interface MealPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlannedWeekToCart: (plannedMeals: { day: string; item: MenuItem; selectedSize?: SizeOption; notes?: string }[]) => void;
  menuItems?: MenuItem[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export default function MealPlanner({ isOpen, onClose, onAddPlannedWeekToCart, menuItems }: MealPlannerProps) {
  const [selections, setSelections] = useState<Record<string, { itemId: string; sizeName: string; notes: string }>>({
    Monday: { itemId: '', sizeName: '', notes: '' },
    Tuesday: { itemId: '', sizeName: '', notes: '' },
    Wednesday: { itemId: '', sizeName: '', notes: '' },
    Thursday: { itemId: '', sizeName: '', notes: '' },
    Friday: { itemId: '', sizeName: '', notes: '' },
  });

  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState<boolean>(() => {
    return localStorage.getItem('nouri_subscription_active') === 'true';
  });

  if (!isOpen) return null;

  const itemsToUse = menuItems || [];

  // Filter menu items for dinnertime: Swallow or Rice are top picks, but Soup & Snacks are also available
  const dinnerOptions = itemsToUse.filter(item => item.category === 'rice' || item.category === 'swallow');
  const otherOptions = itemsToUse.filter(item => item.category === 'soup' || item.category === 'snack');

  const handleItemChange = (day: string, itemId: string) => {
    const item = itemsToUse.find(i => i.id === itemId);
    const defaultSize = item?.sizes && item.sizes.length > 0 ? item.sizes[0].name : '';
    
    setSelections(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        itemId,
        sizeName: defaultSize,
      }
    }));
  };

  const handleSizeChange = (day: string, sizeName: string) => {
    setSelections(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        sizeName
      }
    }));
  };

  const handleNotesChange = (day: string, notes: string) => {
    setSelections(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        notes
      }
    }));
  };

  const clearDay = (day: string) => {
    setSelections(prev => ({
      ...prev,
      [day]: { itemId: '', sizeName: '', notes: '' }
    }));
  };

  const hasAnySelection = DAYS_OF_WEEK.some(day => selections[day].itemId !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsToImport: { day: string; item: MenuItem; selectedSize?: SizeOption; notes?: string }[] = [];
    
    DAYS_OF_WEEK.forEach((day) => {
      const value = selections[day];
      if (value.itemId) {
        const item = itemsToUse.find(i => i.id === value.itemId);
        if (item) {
          const selectedSize = item.sizes?.find(s => s.name === value.sizeName) || undefined;
          itemsToImport.push({
            day,
            item,
            selectedSize,
            notes: value.notes || undefined,
          });
        }
      }
    });

    if (itemsToImport.length === 0) return;

    if (isSubscription) {
      localStorage.setItem('nouri_subscription_active', 'true');
      localStorage.setItem('nouri_promo_code', 'NOURI-PASS');
    } else {
      localStorage.removeItem('nouri_subscription_active');
    }

    onAddPlannedWeekToCart(itemsToImport);
    setSuccessMessage(isSubscription 
      ? `Successfully scheduled ${itemsToImport.length} meals and activated your Nouri Corporate Pass subscription! A 15% discount has been applied to your cart.`
      : `Successfully scheduled ${itemsToImport.length} meals! They have been added to your cart.`
    );
    
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" id="planner-backdrop">
      <div 
        className="bg-bento-card-bg rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-bento-border transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
        id="planner-modal"
      >
        {/* Header */}
        <div className="bg-bento-cream-dark text-bento-cream-light p-5 flex items-center justify-between border-b border-bento-border transition-colors" id="planner-header">
          <div className="flex items-center gap-3" id="planner-title-wrapper">
            <div className="bg-bento-olive p-2.5 rounded-2xl text-bento-olive-dark transition-colors" id="planner-icon-bg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-xl font-black uppercase tracking-tight text-bento-cream-light">Weekly Dinner Planner</h2>
              <p className="text-xs text-bento-text-muted opacity-90 transition-colors">Schedule your workweek meals (Mon-Fri) & checkout in one click</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-bento-text-muted hover:text-bento-cream-light hover:bg-bento-cream/10 transition-colors cursor-pointer"
            id="planner-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bento-cream transition-colors duration-300" id="planner-body">
          {successMessage ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4" id="planner-success-screen">
              <div className="w-16 h-16 bg-bento-olive text-bento-olive-dark rounded-full flex items-center justify-center border border-bento-olive-border transition-colors" id="success-icon-bg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="font-sans text-2xl font-black text-bento-text-primary uppercase tracking-tight transition-colors">Weekly Dinner Planned!</h3>
              <p className="text-bento-text-secondary max-w-md text-sm transition-colors">{successMessage}</p>
              <p className="text-xs text-bento-text-muted font-mono transition-colors">Simulating integration with your work calendar...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" id="planner-form">
              {/* Working Class Persona Help Card */}
              <div className="bg-bento-olive/50 border border-bento-olive-border rounded-2xl p-4 flex items-start gap-3 text-sm text-bento-olive-dark transition-colors" id="planner-helper-card">
                <HelpCircle className="w-5 h-5 text-bento-olive-dark shrink-0 mt-0.5" />
                <div id="planner-helper-text">
                  <span className="font-bold text-bento-olive-dark block">How does this help you?</span>
                  By scheduling dinners beforehand, you avoid the daily "What am I eating tonight?" fatigue. We package each day's meal separately, labeled for easy weekday heating.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="planner-grid">
                {/* Left Side: Days Selection List */}
                <div className="md:col-span-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0" id="planner-days-sidebar">
                  {DAYS_OF_WEEK.map((day) => {
                    const selectedItem = itemsToUse.find(i => i.id === selections[day].itemId);
                    const isConfigured = !!selectedItem;
                    const isActive = activeDay === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setActiveDay(day)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between shrink-0 md:shrink select-none cursor-pointer ${
                          isActive 
                            ? 'bg-bento-text-primary text-bento-cream border-bento-text-primary shadow-sm' 
                            : isConfigured
                              ? 'bg-bento-olive text-bento-olive-dark border-bento-olive-border'
                              : 'bg-bento-card-bg text-bento-text-secondary border-bento-border hover:bg-bento-gray'
                        }`}
                        id={`planner-day-btn-${day}`}
                      >
                        <div className="flex items-center gap-2.5" id={`day-btn-content-${day}`}>
                          <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isConfigured ? 'bg-bento-olive-dark' : 'bg-bento-border'}`} id={`day-dot-${day}`}></div>
                          <div>
                            <span className="font-bold block text-sm">{day}</span>
                            <span className="text-[11px] opacity-80 block truncate max-w-[120px] md:max-w-[160px]">
                              {isConfigured ? selectedItem.name : 'No meal planned'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 hidden md:block opacity-60 ${isActive ? 'text-bento-cream' : ''}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Right Side: Configuration Form for Selected Day */}
                <div className="md:col-span-8 bg-bento-card-bg border border-bento-border rounded-2xl p-5 space-y-4 shadow-sm transition-colors duration-300" id="planner-config-panel">
                  <div className="flex items-center justify-between border-b border-bento-gray pb-3 transition-colors" id="config-panel-header">
                    <h3 className="font-sans text-base font-bold text-bento-text-secondary transition-colors">
                      Configure dinner for <span className="text-bento-olive-dark font-black">{activeDay}</span>
                    </h3>
                    {selections[activeDay].itemId && (
                      <button
                        type="button"
                        onClick={() => clearDay(activeDay)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                        id="clear-day-btn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Day
                      </button>
                    )}
                  </div>

                  {/* 1. Dinner Item Selector */}
                  <div className="space-y-2" id="planner-food-selection">
                    <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Select Main Dish</label>
                    <select
                      value={selections[activeDay].itemId}
                      onChange={(e) => handleItemChange(activeDay, e.target.value)}
                      className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark transition-colors"
                      id="food-select-dropdown"
                    >
                      <option value="">-- No Meal Planned (Skip Day) --</option>
                      
                      <optgroup label="Rice Dishes">
                        {dinnerOptions.map(item => (
                          <option key={item.id} value={item.id}>{item.name} - ₦{item.price.toLocaleString()}</option>
                        ))}
                      </optgroup>

                      <optgroup label="Premium Litre Soups & Snacks">
                        {otherOptions.map(item => (
                          <option key={item.id} value={item.id}>{item.name} - starts at ₦{item.price.toLocaleString()}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* 2. Dynamic Size Selector */}
                  {(() => {
                    const selectedItem = itemsToUse.find(i => i.id === selections[activeDay].itemId);
                    if (!selectedItem?.sizes) return null;

                    return (
                      <div className="space-y-2" id="planner-size-selection">
                        <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Select Size</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" id="planner-sizes-grid">
                          {selectedItem.sizes.map((size) => {
                            const isSelected = selections[activeDay].sizeName === size.name;
                            return (
                              <button
                                key={size.name}
                                type="button"
                                onClick={() => handleSizeChange(activeDay, size.name)}
                                className={`p-2.5 text-xs text-center border rounded-2xl transition-all font-medium cursor-pointer ${
                                  isSelected 
                                    ? 'bg-bento-olive-dark text-bento-cream border-bento-olive-dark font-bold' 
                                    : 'bg-bento-gray text-bento-text-secondary border-bento-border hover:bg-bento-olive'
                                }`}
                                id={`size-opt-${size.name}`}
                              >
                                <span className="block truncate font-bold">{size.name}</span>
                                <span className="block text-[10px] opacity-85 mt-0.5">₦{size.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Delivery Notes */}
                  <div className="space-y-2" id="planner-delivery-notes">
                    <label className="block text-xs font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Special Delivery instructions for {activeDay}</label>
                    <textarea
                      value={selections[activeDay].notes}
                      onChange={(e) => handleNotesChange(activeDay, e.target.value)}
                      placeholder="e.g. Deliver to my office on Monday instead of home, call when outside..."
                      rows={2}
                      className="w-full bg-bento-card-bg text-bento-text-primary border border-bento-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark resize-none transition-colors"
                      id="day-notes-textarea"
                    />
                  </div>

                  {/* Quick Item Preview */}
                  {(() => {
                    const selectedItem = itemsToUse.find(i => i.id === selections[activeDay].itemId);
                    if (!selectedItem) return null;
                    return (
                      <div className="bg-bento-cream p-3 rounded-2xl flex items-center gap-3 border border-bento-border transition-colors" id="planner-day-preview">
                        <img 
                          src={selectedItem.image} 
                          alt={selectedItem.name} 
                          className="w-12 h-12 rounded-xl object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="text-[10px] font-bold text-bento-text-muted uppercase font-mono transition-colors">Menu preview</span>
                          <p className="text-xs text-bento-text-secondary line-clamp-1 font-medium transition-colors">{selectedItem.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Nouri Dinner Pass Subscription Toggle */}
              <div className="bg-bento-olive/15 border-2 border-dashed border-bento-olive-border/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300" id="subscription-toggle-box">
                <div className="flex gap-3 items-start text-left" id="sub-box-details">
                  <div className="bg-bento-olive/30 p-2.5 rounded-xl text-bento-olive-dark shrink-0" id="sub-percent-icon">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-bento-text-primary uppercase tracking-wider block">🎁 Save with Nouri Dinner Pass!</span>
                    <span className="text-[11px] text-bento-text-secondary block leading-relaxed max-w-xl">
                      Convert this weekly plan into a repeat subscription and get <strong className="text-bento-olive-dark font-black">15% off</strong> your entire dinner order instantly. No upfront costs, cancel anytime! We auto-apply the discount code <span className="font-mono bg-white px-1 py-0.5 rounded border border-bento-border text-bento-text-primary text-[10px] font-bold">NOURI-PASS</span>.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0" id="sub-toggle-label">
                  <input 
                    type="checkbox" 
                    checked={isSubscription}
                    onChange={(e) => setIsSubscription(e.target.checked)}
                    className="sr-only peer" 
                    id="sub-checkbox"
                  />
                  <div className="w-11 h-6 bg-bento-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bento-olive-dark"></div>
                  <span className="ml-2 text-xs font-bold text-bento-text-primary uppercase tracking-wide">
                    {isSubscription ? 'Active' : 'Off'}
                  </span>
                </label>
              </div>

              {/* Action Bar */}
              <div className="border-t border-bento-border pt-5 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors" id="planner-footer-actions">
                <div className="text-center sm:text-left" id="planner-status-summary">
                  <span className="text-xs text-bento-text-muted font-mono font-bold transition-colors">PLANNER STATUS</span>
                  <p className="text-sm font-bold text-bento-text-primary transition-colors">
                    {DAYS_OF_WEEK.filter(day => selections[day].itemId !== '').length} of 5 days scheduled
                  </p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto" id="planner-action-buttons">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none border border-bento-border text-bento-text-secondary px-5 py-2.5 rounded-2xl hover:bg-bento-gray text-sm font-bold cursor-pointer transition-colors"
                    id="planner-cancel-btn"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!hasAnySelection}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      hasAnySelection
                        ? 'bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream'
                        : 'bg-bento-gray text-bento-text-muted cursor-not-allowed shadow-none border border-bento-border'
                    }`}
                    id="planner-submit-btn"
                  >
                    <Plus className="w-4 h-4 text-bento-cream" />
                    <span>Add Week To Order</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
