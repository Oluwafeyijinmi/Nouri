import React, { useState, useMemo } from 'react';
import { Search, Info, Plus, ChevronRight, Check, Star, Filter, Sparkles, RefreshCw, ThumbsUp, CheckCircle, HelpCircle } from 'lucide-react';
import { MenuItem, FoodCategory, SizeOption, ExtraOption } from '../types';
import { MENU_ITEMS, STANDARD_EXTRAS } from '../data';

interface MenuSectionProps {
  onAddToCart: (item: MenuItem, selectedSize?: SizeOption, selectedExtras?: ExtraOption[]) => void;
  menuItems?: MenuItem[];
  userOrderCount?: number;
}

export default function MenuSection({ onAddToCart, menuItems, userOrderCount = 0 }: MenuSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // AI Diet & Mood Recommender States
  const [showRecommender, setShowRecommender] = useState(false);
  const [userMood, setUserMood] = useState('Tired');
  const [maxBudget, setMaxBudget] = useState('5000');
  const [dietPreference, setDietPreference] = useState('Anything goes');
  const [isGeneratingRec, setIsGeneratingRec] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recAddedToCart, setRecAddedToCart] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<{
    recommendedItemId: string;
    selectedSizeName?: string;
    selectedExtrasNames?: string[];
    reasoning: string;
    proverb: string;
  } | null>(null);
  
  const itemsToUse = useMemo(() => {
    return menuItems || [];
  }, [menuItems]);

  // Track size configuration and extra configuration per item ID directly inside cards for instant feedback
  const [itemConfigurations, setItemConfigurations] = useState<Record<string, {
    size: SizeOption | undefined;
    extras: ExtraOption[];
  }>>({});

  // Gather all unique tags from menu items for horizontal tag filtration
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    itemsToUse.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [itemsToUse]);

  // Filter items
  const filteredItems = useMemo(() => {
    return itemsToUse.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [itemsToUse, searchTerm, activeCategory, selectedTag]);

  // Handle configuration changes
  const handleSelectSize = (itemId: string, size: SizeOption) => {
    setItemConfigurations(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId] || { size: undefined, extras: [] },
        size
      }
    }));
  };

  const handleToggleExtra = (itemId: string, extra: ExtraOption) => {
    setItemConfigurations(prev => {
      const config = prev[itemId] || { size: undefined, extras: [] };
      const exists = config.extras.some(e => e.id === extra.id);
      const newExtras = exists 
        ? config.extras.filter(e => e.id !== extra.id)
        : [...config.extras, extra];

      return {
        ...prev,
        [itemId]: {
          ...config,
          extras: newExtras
        }
      };
    });
  };

  const handleGenerateRecommendation = async () => {
    setIsGeneratingRec(true);
    setRecError(null);
    setRecommendationResult(null);
    setRecAddedToCart(false);

    try {
      const response = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood: userMood,
          budget: maxBudget === 'Unlimited' ? undefined : parseInt(maxBudget, 10),
          preference: dietPreference,
          items: itemsToUse,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendation');
      }

      setRecommendationResult(data);
    } catch (err: any) {
      console.error(err);
      setRecError(err.message || 'Failed to connect to Nouri AI Chef. Please try again!');
    } finally {
      setIsGeneratingRec(false);
    }
  };

  const handleAddRecToCart = () => {
    if (!recommendationResult) return;
    const item = itemsToUse.find(it => it.id === recommendationResult.recommendedItemId);
    if (!item) return;

    // Resolve size option
    let selectedSize: SizeOption | undefined = undefined;
    if (recommendationResult.selectedSizeName && item.sizes) {
      selectedSize = item.sizes.find(
        s => s.name.toLowerCase() === recommendationResult.selectedSizeName?.toLowerCase()
      );
    }
    // Default to first size if multiple exist and none resolved
    if (!selectedSize && item.sizes && item.sizes.length > 0) {
      selectedSize = item.sizes[0];
    }

    // Resolve extras
    const selectedExtras: ExtraOption[] = [];
    if (recommendationResult.selectedExtrasNames && item.extras) {
      recommendationResult.selectedExtrasNames.forEach(extraName => {
        const found = item.extras?.find(
          e => e.name.toLowerCase().includes(extraName.toLowerCase())
        );
        if (found) {
          selectedExtras.push(found);
        }
      });
    }

    onAddToCart(item, selectedSize, selectedExtras);
    setRecAddedToCart(true);
  };

  const getConfiguration = (item: MenuItem) => {
    const config = itemConfigurations[item.id];
    const defaultSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined;
    return {
      size: config?.size || defaultSize,
      extras: config?.extras || []
    };
  };

  return (
    <section className="py-16 bg-bento-cream text-bento-text-secondary transition-colors duration-300" id="menu">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="menu-container">
        
        {/* Title Block */}
        <div className="text-center space-y-3 max-w-3xl mx-auto" id="menu-title-block">
          <span className="text-xs uppercase font-mono tracking-widest text-bento-olive-dark font-bold block" id="menu-subtitle">
            Wholesome Dinners & Snacks
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-black text-bento-text-primary uppercase tracking-tight transition-colors" id="menu-heading">
            Our Rich Culinary Catalog
          </h2>
          <div className="h-1 w-16 bg-bento-olive-dark mx-auto rounded-full transition-colors" id="menu-heading-bar"></div>
          <p className="text-sm sm:text-base text-bento-text-muted font-medium transition-colors" id="menu-meta-description">
            Specifically prepared to nourish and satisfy the busy working class of Ibadan. 
            Select single portions, order premium soups by litres to stock your fridge, or choose crispy office snacks!
          </p>
        </div>

        {/* AI Diet & Mood Recommender Widget */}
        <div className="max-w-3xl mx-auto" id="ai-recommender-outer-container">
          <div className="bg-gradient-to-br from-bento-olive/10 to-bento-tan/20 border border-bento-olive-border/30 rounded-3xl p-5 sm:p-6 shadow-sm transition-all duration-300 relative overflow-hidden" id="ai-recommender-card">
            {/* Background design accents */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-bento-olive/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10" id="ai-recommender-header-row">
              <div className="space-y-1.5" id="ai-recommender-header-text">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bento-olive/20 text-bento-olive-dark text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Chef Gemini AI
                </span>
                <h3 className="text-lg font-black text-bento-text-primary tracking-tight font-sans">
                  Stressed, tired, or need a wholesome boost?
                </h3>
                <p className="text-xs text-bento-text-muted font-medium">
                  Let our AI chef curate the ultimate nourishing dinner customized to your budget and vibe!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecommender(!showRecommender);
                  // Auto-generate on first toggle open
                  if (!showRecommender && !recommendationResult) {
                    setTimeout(() => handleGenerateRecommendation(), 100);
                  }
                }}
                className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream px-4.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider select-none cursor-pointer transition-all flex items-center gap-2 shrink-0 shadow-sm"
                id="toggle-recommender-btn"
              >
                <Sparkles className="w-4 h-4" />
                <span>{showRecommender ? "Hide AI Chef" : "✨ Consult AI Chef"}</span>
              </button>
            </div>

            {/* Collapsible Content */}
            {showRecommender && (
              <div className="mt-6 pt-5 border-t border-bento-border/50 space-y-6 animate-slideIn relative z-10" id="recommender-drawer-content">
                {/* Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="recommender-inputs-grid">
                  {/* Mood Selector */}
                  <div className="space-y-1.5" id="mood-selector-col">
                    <label className="block text-[10px] font-bold text-bento-text-muted uppercase tracking-wider font-mono">My Current Mood</label>
                    <select
                      value={userMood}
                      onChange={(e) => setUserMood(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bento-border bg-white text-xs text-bento-text-primary focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                      id="rec-mood-select"
                    >
                      <option value="Tired">🥱 Tired & Exhausted</option>
                      <option value="Hungry">💪 Extremely Starving</option>
                      <option value="Light">🥗 Feeling Light / Snacky</option>
                      <option value="Stressed">🤯 Stressed after Ring Road Traffic</option>
                      <option value="Cozy">💖 Craving Warm Comfort</option>
                    </select>
                  </div>

                  {/* Budget Selector */}
                  <div className="space-y-1.5" id="budget-selector-col">
                    <label className="block text-[10px] font-bold text-bento-text-muted uppercase tracking-wider font-mono">My Meal Budget</label>
                    <select
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bento-border bg-white text-xs text-bento-text-primary focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                      id="rec-budget-select"
                    >
                      <option value="3000">₦3,000 (Budget bite)</option>
                      <option value="5000">₦5,000 (Standard feeding)</option>
                      <option value="8000">₦8,000 (Premium feast)</option>
                      <option value="Unlimited">🌟 No Limit (Spoil me)</option>
                    </select>
                  </div>

                  {/* Preference Selector */}
                  <div className="space-y-1.5" id="preference-selector-col">
                    <label className="block text-[10px] font-bold text-bento-text-muted uppercase tracking-wider font-mono">Flavor Focus</label>
                    <select
                      value={dietPreference}
                      onChange={(e) => setDietPreference(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-bento-border bg-white text-xs text-bento-text-primary focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                      id="rec-pref-select"
                    >
                      <option value="Anything goes">🍲 Anything goes</option>
                      <option value="Spicy and rich">🔥 Spicy & Rich Yoruba Spices</option>
                      <option value="Comforting Swallow">🥣 Solid Swallow & Soup</option>
                      <option value="Light snacks and drinks">🥤 Light Nibbles & Sides</option>
                      <option value="Meat lovers">🥩 Rich Assorted Meat focus</option>
                    </select>
                  </div>
                </div>

                {/* Generate Action Button */}
                <div className="flex justify-center" id="rec-cta-row">
                  <button
                    type="button"
                    onClick={handleGenerateRecommendation}
                    disabled={isGeneratingRec}
                    className="bg-bento-olive-dark hover:bg-opacity-95 text-bento-cream px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest select-none cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
                    id="rec-cook-btn"
                  >
                    {isGeneratingRec ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Cooking up a Choice...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Cook Up A Recommendation</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Banner */}
                {recError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-2xl text-center" id="rec-error-alert">
                    {recError}
                  </div>
                )}

                {/* Result Block */}
                {recommendationResult && (
                  <div className="p-5 bg-white border border-bento-border rounded-2xl space-y-4 animate-fadeIn" id="rec-result-card">
                    {/* Chef Advice Quote */}
                    <div className="space-y-2 relative" id="rec-chef-advice">
                      <div className="text-[10px] font-black uppercase tracking-widest text-bento-olive-dark font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-bento-olive" />
                        Chef's Golden Recommendation:
                      </div>
                      <p className="text-sm font-bold text-bento-text-secondary leading-relaxed italic pr-6">
                        "{recommendationResult.reasoning}"
                      </p>
                      
                      {/* Proverb card */}
                      <div className="bg-bento-cream/50 border border-bento-border/50 rounded-xl p-3 text-[11px] text-bento-text-muted leading-relaxed font-semibold italic flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <span>
                          <strong>Yoruba Proverb:</strong> {recommendationResult.proverb}
                        </span>
                      </div>
                    </div>

                    {/* Target Product Quick Preview Card */}
                    {(() => {
                      const item = itemsToUse.find(it => it.id === recommendationResult.recommendedItemId);
                      if (!item) {
                        return (
                          <div className="text-xs text-bento-text-muted italic">
                            Wait, it looks like Chef Gemini recommended an item that was deleted from the menu! Let's click cook again.
                          </div>
                        );
                      }

                      // Work out the price
                      let displayPrice = item.price;
                      if (recommendationResult.selectedSizeName && item.sizes) {
                        const s = item.sizes.find(sz => sz.name.toLowerCase() === recommendationResult.selectedSizeName?.toLowerCase());
                        if (s) displayPrice = s.price;
                      }

                      return (
                        <div className="p-3 bg-bento-cream/30 border border-bento-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2" id="rec-product-quickview">
                          <div className="flex items-center gap-3" id="quickview-info">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-bento-border"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="text-xs font-black text-bento-text-primary uppercase tracking-tight">{item.name}</h4>
                              <p className="text-[10px] text-bento-text-muted line-clamp-1">{item.description}</p>
                              
                              {/* Extra specs */}
                              <div className="flex flex-wrap gap-1 mt-1" id="quickview-chips">
                                {recommendationResult.selectedSizeName && (
                                  <span className="bg-bento-tan/30 border border-bento-tan-border/40 text-[9px] text-bento-tan-dark font-mono font-bold px-1.5 py-0.5 rounded">
                                    Size: {recommendationResult.selectedSizeName}
                                  </span>
                                )}
                                {recommendationResult.selectedExtrasNames && recommendationResult.selectedExtrasNames.length > 0 && (
                                  <span className="bg-bento-olive/10 border border-bento-olive-border/20 text-[9px] text-bento-olive-dark font-mono font-bold px-1.5 py-0.5 rounded">
                                    + {recommendationResult.selectedExtrasNames.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0" id="quickview-price-action">
                            <span className="text-sm font-black text-bento-text-primary font-mono shrink-0">
                              ₦{displayPrice.toLocaleString()}
                            </span>

                            {recAddedToCart ? (
                              <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Added!
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleAddRecToCart}
                                className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1 select-none"
                                id="add-rec-to-cart-btn"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Categories, Search, Tag Filter panel */}
        <div className="neomorphic-card p-4 sm:p-6 space-y-5" id="menu-control-panel">
          {/* Search and category filter row */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between" id="search-cat-row">
            {/* Search Input */}
            <div className="relative flex-1" id="search-box-wrapper">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-bento-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search Swallow, Rice, Soup Litres, Snacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-bento-border rounded-2xl bg-bento-cream text-bento-text-primary focus:bg-bento-card-bg focus:outline-none focus:ring-2 focus:ring-bento-olive-dark text-sm transition-colors duration-300"
                id="menu-search-input"
              />
            </div>

            {/* Category selection row */}
            <div className="flex flex-wrap gap-2 items-center" id="categories-filter-wrapper">
              {([
                { key: 'all', label: 'All Items' },
                { key: 'swallow', label: 'Swallow & Soup' },
                { key: 'rice', label: 'Rice Classics' },
                { key: 'soup', label: 'Soup Litres (Meal Prep)' },
                { key: 'snack', label: 'Snacks (Sizes)' }
              ] as const).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setSelectedTag(null); // Reset tag filter on category change
                  }}
                  className={`px-4.5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border transition-all cursor-pointer ${
                    activeCategory === cat.key
                      ? 'bg-bento-text-primary text-bento-cream border-bento-text-primary shadow-sm'
                      : 'bg-bento-card-bg text-bento-text-secondary border-bento-border hover:bg-bento-gray'
                  }`}
                  id={`cat-btn-${cat.key}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" id="tags-scroller">
            <span className="text-xs text-bento-text-muted flex items-center gap-1 font-mono shrink-0 mr-1">
              <Filter className="w-3 h-3" /> Filter Faves:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 text-xs rounded-full border shrink-0 transition-all cursor-pointer ${
                selectedTag === null
                  ? 'bg-bento-olive text-bento-olive-dark border-bento-olive-border font-bold'
                  : 'bg-bento-card-bg text-bento-text-muted border-bento-border hover:bg-bento-gray'
              }`}
              id="tag-btn-all"
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 text-xs rounded-full border shrink-0 transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-bento-olive text-bento-olive-dark border-bento-olive-border font-bold'
                    : 'bg-bento-card-bg text-bento-text-muted border-bento-border hover:bg-bento-gray'
                }`}
                id={`tag-btn-${tag}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic section headers */}
        <div id="soups" /> {/* Scroll anchor */}
        <div id="snacks" /> {/* Scroll anchor */}

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-bento-card-bg rounded-3xl border border-bento-border max-w-xl mx-auto space-y-3 transition-colors duration-300" id="menu-empty-state">
            <Info className="w-10 h-10 text-bento-text-muted mx-auto" />
            <h3 className="font-sans text-lg font-bold text-bento-text-secondary transition-colors">No dishes match your filters</h3>
            <p className="text-xs text-bento-text-muted max-w-md mx-auto px-4">
              Try removing some search keywords, changing categories, or selecting "All Tags" above to browse the full catalog!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="menu-items-grid">
            {filteredItems.map((item) => {
              const { size, extras } = getConfiguration(item);
              const currentPrice = size ? size.price : item.price;
              const extrasTotal = extras.reduce((sum, ext) => sum + ext.price, 0);
              const totalAmount = currentPrice + extrasTotal;

              return (
                <div 
                  key={item.id} 
                  className="neomorphic-card overflow-hidden flex flex-col group relative"
                  id={`food-card-${item.id}`}
                >
                  {/* Popular Indicator badge */}
                  {item.isPopular && (
                    <div className="absolute top-3 left-3 z-10 bg-bento-tan text-bento-tan-dark border border-bento-tan-border text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm transition-colors" id="card-popular-badge">
                      <Star className="w-3 h-3 fill-current text-bento-tan-dark" />
                      <span>WORKING CLASS FAVORITE</span>
                    </div>
                  )}

                  {/* Food Photo */}
                  <div className="relative h-48 overflow-hidden bg-bento-gray" id={`card-photo-wrapper-${item.id}`}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      id={`card-img-${item.id}`}
                    />
                    <div className="absolute top-3 right-3 bg-bento-text-primary/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-bento-cream font-bold text-xs sm:text-sm shadow-sm transition-colors" id={`card-price-badge-${item.id}`}>
                      ₦{totalAmount.toLocaleString()}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col space-y-4" id={`card-body-${item.id}`}>
                    {/* Name, Category, Tags & Description */}
                    <div className="space-y-2 flex-1" id="card-header-block">
                      <div className="flex flex-wrap gap-1" id="card-tags-list">
                        {item.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-bento-olive-dark uppercase tracking-wider bg-bento-olive border border-bento-olive-border/30 px-2 py-0.5 rounded transition-colors" id={`tag-${item.id}-${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className="text-base font-bold text-bento-text-primary group-hover:text-bento-olive-dark transition-colors line-clamp-1" id={`card-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="text-xs text-bento-text-muted leading-relaxed font-light line-clamp-2 transition-colors" id={`card-desc-${item.id}`}>
                        {item.description}
                      </p>
                      
                      {/* Premium Nutrition Transparency */}
                      {userOrderCount >= 5 && item.nutrition && (
                        <div className="mt-2 p-2 bg-bento-olive/5 border border-bento-olive-border/30 rounded-lg animate-fadeIn" id={`card-nutrition-${item.id}`}>
                          <p className="text-[9px] font-mono text-bento-olive-dark font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Nouri Premium Insight
                          </p>
                          <p className="text-[10px] text-bento-text-muted leading-relaxed">
                            {item.nutrition}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* DYNAMIC SIZES SELECTOR (If soup or snack has size options) */}
                    {item.sizes && item.sizes.length > 0 && (
                      <div className="space-y-1.5 border-t border-bento-border pt-3" id={`sizes-selector-block-${item.id}`}>
                        <span className="block text-[10px] font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Select Volume/Size</span>
                        <div className="grid grid-cols-2 gap-1.5" id={`sizes-buttons-row-${item.id}`}>
                          {item.sizes.map((sz) => {
                            const isSelected = size?.name === sz.name;
                            return (
                              <button
                                key={sz.name}
                                type="button"
                                onClick={() => handleSelectSize(item.id, sz)}
                                className={`px-2 py-1.5 text-[11px] rounded-xl border text-left font-medium transition-colors cursor-pointer truncate ${
                                  isSelected
                                    ? 'bg-bento-olive-dark text-bento-cream border-bento-olive-dark font-bold'
                                    : 'bg-bento-gray text-bento-text-secondary border-bento-border hover:bg-bento-olive'
                                }`}
                                id={`sz-btn-${item.id}-${sz.name}`}
                              >
                                <span className="block truncate font-bold">{sz.name}</span>
                                <span className="block text-[9px] opacity-80 font-mono">₦{sz.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC EXTRAS SELECTOR (If extra choices are provided, like beef/plantain) */}
                    {item.extras && item.extras.length > 0 && (
                      <div className="space-y-1.5 border-t border-bento-border pt-3" id={`extras-selector-block-${item.id}`}>
                        <span className="block text-[10px] font-bold text-bento-text-muted uppercase tracking-wider transition-colors">Customize dinner (Add-ons)</span>
                        <div className="flex flex-wrap gap-1.5" id={`extras-buttons-row-${item.id}`}>
                          {item.extras.map((ext) => {
                            const isSelected = extras.some(e => e.id === ext.id);
                            return (
                              <button
                                key={ext.id}
                                type="button"
                                onClick={() => handleToggleExtra(item.id, ext)}
                                className={`px-2.5 py-1 text-[10px] rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                                  isSelected
                                    ? 'bg-bento-tan text-bento-tan-dark border-bento-tan-border font-bold'
                                    : 'bg-bento-card-bg text-bento-text-secondary border-bento-border hover:bg-bento-gray'
                                }`}
                                id={`ext-btn-${item.id}-${ext.id}`}
                              >
                                {isSelected ? <Check className="w-3 h-3 text-bento-tan-dark animate-scaleIn" /> : <Plus className="w-3 h-3 text-bento-text-muted" />}
                                <span>{ext.name} (+₦{ext.price})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add to Order Button */}
                    <div className="border-t border-bento-border pt-3" id={`card-footer-${item.id}`}>
                      <button
                        onClick={() => onAddToCart(item, size, extras)}
                        className="w-full bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream font-bold py-3 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        id={`add-btn-${item.id}`}
                      >
                        <Plus className="w-4 h-4 text-bento-cream" />
                        <span>Add to Dinner Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
