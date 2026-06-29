import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Truck, 
  Plus, 
  Trash2, 
  Shield, 
  Settings, 
  ShoppingBag, 
  Search, 
  ChevronDown, 
  User,
  Store,
  Edit,
  Save,
  RotateCcw,
  RefreshCw,
  PlusCircle,
  Check,
  Sparkles,
  Ticket,
  Percent
} from 'lucide-react';
import { Order as OrderType, MenuItem, SizeOption, ExtraOption, FoodCategory, PromoCode } from '../types';
import { 
  getAdminEmails, 
  addAdminEmail, 
  removeAdminEmail, 
  subscribeToAllOrders, 
  updateOrderStatus,
  subscribeToMenu,
  saveMenuItem,
  deleteMenuItem,
  resetMenuToDefaults,
  clearAllMenuItems,
  subscribeToPromos,
  savePromoCode,
  removePromoCode
} from '../lib/db';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
};

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'insights' | 'promos'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Settings State
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Promos State
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [newPromoValue, setNewPromoValue] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoMax, setNewPromoMax] = useState('');

  // Storefront Catalog/Products Management State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [resettingMenu, setResettingMenu] = useState(false);
  const [clearingMenu, setClearingMenu] = useState(false);

  // Image Generation States
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);

  // Form Fields State for Product Editor
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<FoodCategory>('rice');
  const [editPrice, setEditPrice] = useState(0);
  const [editImage, setEditImage] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editIsPopular, setEditIsPopular] = useState(false);
  
  // Custom Lists for Sizes and Extras inside Editor
  const [editSizes, setEditSizes] = useState<SizeOption[]>([]);
  const [editExtras, setEditExtras] = useState<ExtraOption[]>([]);

  // Temp input states for adding size / extra items in form
  const [tempSizeName, setTempSizeName] = useState('');
  const [tempSizePrice, setTempSizePrice] = useState('');
  const [tempExtraName, setTempExtraName] = useState('');
  const [tempExtraPrice, setTempExtraPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Subscribe to all orders
      setLoadingOrders(true);
      const unsubscribeOrders = subscribeToAllOrders((fetchedOrders) => {
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      });

      // Subscribe to all menu items in real-time
      setLoadingMenu(true);
      const unsubscribeMenu = subscribeToMenu((fetchedItems) => {
        setMenuItems(fetchedItems);
        setLoadingMenu(false);
      });

      // Fetch admin emails
      setLoadingAdmins(true);
      getAdminEmails().then(emails => {
        setAdminEmails(emails);
        setLoadingAdmins(false);
      });

      // Subscribe to promos
      setLoadingPromos(true);
      const unsubscribePromos = subscribeToPromos((fetchedPromos) => {
        setPromos(fetchedPromos);
        setLoadingPromos(false);
      });

      return () => {
        unsubscribeOrders();
        unsubscribeMenu();
        unsubscribePromos();
      };
    }
  }, [isOpen]);

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;
    
    const promo: PromoCode = {
      code: newPromoCode.toUpperCase().trim(),
      discountType: newPromoType,
      discountValue: Number(newPromoValue) || 0,
      description: newPromoDesc || `${newPromoType === 'percentage' ? `${newPromoValue}%` : `₦${newPromoValue}`} discount`,
      usageCount: 0,
      isActive: true,
      maxUses: newPromoMax ? Number(newPromoMax) : undefined,
      createdAt: new Date().toISOString()
    };
    
    try {
      await savePromoCode(promo);
      setNewPromoCode('');
      setNewPromoType('percentage');
      setNewPromoValue('');
      setNewPromoDesc('');
      setNewPromoMax('');
    } catch (err) {
      console.error("Error saving promo code:", err);
    }
  };

  const handleTogglePromoStatus = async (promo: PromoCode) => {
    try {
      await savePromoCode({
        ...promo,
        isActive: !promo.isActive
      });
    } catch (err) {
      console.error("Error toggling promo status:", err);
    }
  };

  const handleRemovePromo = async (code: string) => {
    if (confirm(`Are you sure you want to delete promo code ${code}?`)) {
      try {
        await removePromoCode(code);
      } catch (err) {
        console.error("Error removing promo code:", err);
      }
    }
  };

  const handleEditProduct = (item: MenuItem) => {
    setSelectedProduct(item);
    setIsNewProduct(false);
    setEditId(item.id);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditCategory(item.category);
    setEditPrice(item.price);
    setEditImage(item.image);
    setEditTags(item.tags ? item.tags.join(', ') : '');
    setEditIsPopular(item.isPopular || false);
    setEditSizes(item.sizes || []);
    setEditExtras(item.extras || []);
    // Clear temp inputs
    setTempSizeName('');
    setTempSizePrice('');
    setTempExtraName('');
    setTempExtraPrice('');
    // Clear image generator state
    setShowImageGenerator(false);
    setImagePrompt('');
    setImageGenerationError(null);
  };

  const handleNameChange = (nameVal: string) => {
    setEditName(nameVal);
    if (isNewProduct) {
      const slug = slugify(nameVal);
      setEditId(slug ? `prod-${slug}` : 'prod-new-item');
    }
  };

  const handleCreateNewProductClick = () => {
    const newId = 'prod-new-item';
    setSelectedProduct({
      id: newId,
      name: '',
      description: '',
      category: 'rice',
      price: 0,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      tags: [],
      isPopular: false,
      sizes: [],
      extras: []
    });
    setIsNewProduct(true);
    setEditId(newId);
    setEditName('');
    setEditDescription('');
    setEditCategory('rice');
    setEditPrice(0);
    setEditImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setEditTags('');
    setEditIsPopular(false);
    setEditSizes([]);
    setEditExtras([]);
    // Clear temp inputs
    setTempSizeName('');
    setTempSizePrice('');
    setTempExtraName('');
    setTempExtraPrice('');
    // Clear image generator state
    setShowImageGenerator(false);
    setImagePrompt('');
    setImageGenerationError(null);
  };

  const handleGenerateImage = async () => {
    const finalPrompt = imagePrompt.trim() || `Realistic professional food photography of ${editName || 'delicious Nigerian food'}, ${editDescription || 'expert plating, gourmet styling'}, warm studio lighting, high resolution`;
    
    setIsGeneratingImage(true);
    setImageGenerationError(null);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio: '1:1',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setEditImage(data.imageUrl);
      setShowImageGenerator(false);
    } catch (err: any) {
      console.error(err);
      setImageGenerationError(err.message || 'An error occurred during image generation');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Get tag suggestions helper functions
  const getCurrentTagInput = () => {
    const parts = editTags.split(',');
    return parts[parts.length - 1].trim();
  };

  const getTagSuggestions = () => {
    const currentTyped = getCurrentTagInput().toLowerCase();
    const existingTags = editTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    
    // Default list of useful food tags
    const defaultSuggestions = ['Spicy', 'Popular', 'Chef Pick', 'New Meal', 'Combo Meal', 'Healthy', 'Gluten Free', 'Swallow', 'Premium Soup', 'Rice Dish', 'Snack', 'Dessert', 'Hot Seller'];
    
    // Combine with tags from database menu items
    const menuTags = menuItems.flatMap(item => item.tags || []);
    const uniqueCombinedTags = Array.from(new Set([...defaultSuggestions, ...menuTags]));
    
    // If not typing anything yet, suggest tags not already added
    if (!currentTyped) {
      return uniqueCombinedTags.filter(tag => !existingTags.includes(tag.toLowerCase())).slice(0, 5);
    }
    
    // Filter suggestions based on typed query & exclude already selected ones
    return uniqueCombinedTags.filter(tag => 
      tag.toLowerCase().startsWith(currentTyped) && 
      !existingTags.includes(tag.toLowerCase())
    ).slice(0, 5);
  };

  const handleSelectTagSuggestion = (tag: string) => {
    const parts = editTags.split(',');
    parts[parts.length - 1] = ' ' + tag; // replace current typed part
    const newTagsStr = parts.map(p => p.trim()).filter(Boolean).join(', ');
    setEditTags(newTagsStr + ', '); // Add trailing comma for ease of typing next
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!editName.trim()) {
      alert("Please enter a product name first to generate a description.");
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName: editName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }
      setEditDescription(data.description);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during description generation');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim()) {
      alert('Please fill out product name and description');
      return;
    }
    setSavingProduct(true);
    try {
      const tagsArray = editTags
        ? editTags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      
      const updatedProduct: MenuItem = {
        id: editId,
        name: editName.trim(),
        description: editDescription.trim(),
        category: editCategory,
        price: Number(editPrice) || 0,
        image: editImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        tags: tagsArray,
        isPopular: editIsPopular,
        sizes: editSizes,
        extras: editExtras
      };

      await saveMenuItem(updatedProduct);
      setSelectedProduct(null);
      setIsNewProduct(false);
    } catch (err) {
      console.error(err);
      alert('Error saving product to database');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this product from your storefront? This action cannot be undone.')) {
      try {
        await deleteMenuItem(itemId);
        if (selectedProduct?.id === itemId) {
          setSelectedProduct(null);
        }
      } catch (err) {
        console.error(err);
        alert('Error deleting product');
      }
    }
  };

  const handleResetCatalog = async () => {
    if (window.confirm('WARNING: This will delete ALL current products and reset your menu to the default Ibadan culinary catalog of 11 meals. Proceed?')) {
      setResettingMenu(true);
      try {
        await resetMenuToDefaults();
        setSelectedProduct(null);
        setIsNewProduct(false);
      } catch (err) {
        console.error(err);
        alert('Error resetting catalog');
      } finally {
        setResettingMenu(false);
      }
    }
  };

  const handleClearCatalog = async () => {
    if (window.confirm('CRITICAL WARNING: This will permanently delete ALL products in your catalog. Your storefront will be completely empty. Proceed?')) {
      setClearingMenu(true);
      try {
        await clearAllMenuItems();
        setSelectedProduct(null);
        setIsNewProduct(false);
      } catch (err) {
        console.error(err);
        alert('Error clearing catalog');
      } finally {
        setClearingMenu(false);
      }
    }
  };

  // Sizes management inside editor
  const handleAddSize = () => {
    if (!tempSizeName.trim() || !tempSizePrice.trim()) return;
    const priceNum = Number(tempSizePrice);
    if (isNaN(priceNum)) {
      alert('Size price must be a valid number');
      return;
    }
    setEditSizes([...editSizes, { name: tempSizeName.trim(), price: priceNum }]);
    setTempSizeName('');
    setTempSizePrice('');
  };

  const handleRemoveSize = (index: number) => {
    setEditSizes(editSizes.filter((_, i) => i !== index));
  };

  // Extras management inside editor
  const handleAddExtra = () => {
    if (!tempExtraName.trim() || !tempExtraPrice.trim()) return;
    const priceNum = Number(tempExtraPrice);
    if (isNaN(priceNum)) {
      alert('Extra price must be a valid number');
      return;
    }
    const uniqueId = 'extra_' + Math.random().toString(36).substring(2, 7);
    setEditExtras([...editExtras, { id: uniqueId, name: tempExtraName.trim(), price: priceNum }]);
    setTempExtraName('');
    setTempExtraPrice('');
  };

  const handleRemoveExtra = (id: string) => {
    setEditExtras(editExtras.filter(e => e.id !== id));
  };

  if (!isOpen) return null;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;
    try {
      await addAdminEmail(newAdminEmail.trim());
      setAdminEmails([...adminEmails, newAdminEmail.trim()]);
      setNewAdminEmail('');
    } catch (err) {
      console.error(err);
      alert('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (emailToRemove === 'nourideyforyou@gmail.com' || emailToRemove === 'michaiahomolaso@gmail.com') {
      alert('Cannot remove default admins.');
      return;
    }
    if (window.confirm(`Remove ${emailToRemove} from admins?`)) {
      try {
        await removeAdminEmail(emailToRemove);
        setAdminEmails(adminEmails.filter(e => e !== emailToRemove));
      } catch (err) {
        console.error(err);
        alert('Failed to remove admin');
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in transit': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-6 bg-black/45 backdrop-blur-sm animate-fadeIn">
      <div className="bg-bento-card-bg rounded-2xl w-full max-w-5xl h-[92vh] md:h-[85vh] flex flex-col shadow-2xl border border-bento-border transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-bento-olive-dark text-bento-cream-light p-5 flex items-center justify-between border-b border-bento-border rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-bento-olive/20 p-2.5 rounded-2xl text-bento-olive">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-xl font-black uppercase tracking-tight text-white">
                Admin Control Panel
              </h2>
              <p className="text-xs text-bento-cream/70">Manage operations and settings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-bento-cream/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar + Content layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-bento-border bg-bento-cream/30 p-3 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:space-y-2 flex-shrink-0">
            <button
              onClick={() => {
                setActiveTab('orders');
                setSelectedProduct(null);
                setIsNewProduct(false);
              }}
              className={`flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap md:w-full flex-shrink-0 ${
                activeTab === 'orders' ? 'bg-bento-olive text-bento-olive-dark shadow-sm font-black' : 'text-bento-text-secondary hover:bg-bento-cream'
              }`}
            >
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              Live Orders
            </button>
            <button
              onClick={() => {
                setActiveTab('products');
                setSelectedProduct(null);
                setIsNewProduct(false);
              }}
              className={`flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap md:w-full flex-shrink-0 ${
                activeTab === 'products' ? 'bg-bento-olive text-bento-olive-dark shadow-sm font-black' : 'text-bento-text-secondary hover:bg-bento-cream'
              }`}
            >
              <Store className="w-4 h-4 flex-shrink-0" />
              Products / Menu
            </button>
            <button
              onClick={() => {
                setActiveTab('insights');
                setSelectedProduct(null);
                setIsNewProduct(false);
              }}
              className={`flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap md:w-full flex-shrink-0 ${
                activeTab === 'insights' ? 'bg-bento-olive text-bento-olive-dark shadow-sm font-black' : 'text-bento-text-secondary hover:bg-bento-cream'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0 text-bento-olive-dark" />
              Store Insights
            </button>
            <button
              onClick={() => {
                setActiveTab('promos');
                setSelectedProduct(null);
                setIsNewProduct(false);
              }}
              className={`flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap md:w-full flex-shrink-0 ${
                activeTab === 'promos' ? 'bg-bento-olive text-bento-olive-dark shadow-sm font-black' : 'text-bento-text-secondary hover:bg-bento-cream'
              }`}
            >
              <Ticket className="w-4 h-4 flex-shrink-0" />
              Promo Codes
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setSelectedProduct(null);
                setIsNewProduct(false);
              }}
              className={`flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap md:w-full flex-shrink-0 ${
                activeTab === 'settings' ? 'bg-bento-olive text-bento-olive-dark shadow-sm font-black' : 'text-bento-text-secondary hover:bg-bento-cream'
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              Settings
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-bento-card-bg">
            
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-bento-text-primary uppercase tracking-tight">Active & Past Orders</h3>
                  <div className="text-xs font-mono text-bento-text-muted bg-bento-cream px-3 py-1.5 rounded-lg border border-bento-border">
                    {orders.length} orders total
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center items-center h-40 text-bento-text-muted">
                    <span className="font-mono text-sm uppercase tracking-wider animate-pulse">Loading Live Orders...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white border border-bento-border rounded-2xl overflow-hidden shadow-sm">
                        <div 
                          className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-bento-cream/20 transition-colors"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-black text-bento-text-primary">{order.id}</span>
                              <span className="text-[10px] text-bento-text-muted">{order.createdAt}</span>
                            </div>
                            <div className="text-sm font-medium text-bento-text-secondary flex items-center gap-2">
                              <User className="w-4 h-4 text-bento-olive-dark" />
                              {order.customer.name} • ₦{order.total.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Status controls */}
                            <select
                              value={order.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer outline-none appearance-none ${getStatusColor(order.status)}`}
                            >
                              <option value="Received">Received</option>
                              <option value="Preparing">Preparing</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Delivered">Delivered</option>
                            </select>

                            <ChevronDown className={`w-5 h-5 text-bento-text-muted transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {expandedOrder === order.id && (
                          <div className="p-4 border-t border-bento-border bg-bento-cream/10 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-bento-text-muted font-mono">Delivery Details</h4>
                              <div className="space-y-1 text-bento-text-primary">
                                <p><span className="font-medium text-bento-text-secondary">Address:</span> {order.customer.address}</p>
                                {order.customer.landmark && <p><span className="font-medium text-bento-text-secondary">Landmark:</span> {order.customer.landmark}</p>}
                                <p><span className="font-medium text-bento-text-secondary">Phone:</span> {order.customer.phone}</p>
                                <p><span className="font-medium text-bento-text-secondary">Time:</span> {order.customer.deliveryTime}</p>
                                {order.customer.deliveryInstructions && (
                                  <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-lg text-xs italic border border-yellow-100">
                                    "{order.customer.deliveryInstructions}"
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-bento-text-muted font-mono">Order Items</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-start border-b border-bento-border/50 pb-2">
                                    <div>
                                      <p className="font-medium text-bento-text-primary">{item.quantity}x {item.menuItem.name}</p>
                                      <p className="text-xs text-bento-text-muted">
                                        {item.selectedSize && `Size: ${item.selectedSize.name}`}
                                        {item.selectedExtras.length > 0 && ` | Extras: ${item.selectedExtras.map(e => e.name).join(', ')}`}
                                      </p>
                                    </div>
                                    <span className="font-mono text-bento-text-secondary font-bold">
                                      ₦{((item.selectedSize ? item.selectedSize.price : item.menuItem.price) * item.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                {selectedProduct ? (
                  /* Edit / Create Form View */
                  <form onSubmit={handleSaveProduct} className="space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-bento-border pb-5">
                      <div>
                        <h3 className="font-black text-xl text-bento-text-primary uppercase tracking-tight font-sans">
                          {isNewProduct ? 'Create Store Product' : 'Edit Product Details'}
                        </h3>
                        <p className="text-xs text-bento-text-muted font-medium mt-1">
                          Configure pricing, details, sizes and extras for this item
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(null);
                            setIsNewProduct(false);
                          }}
                          className="px-5 py-2.5 border-2 border-bento-border rounded-xl text-xs font-black uppercase tracking-wider text-bento-text-primary hover:bg-bento-cream transition-all cursor-pointer shadow-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingProduct}
                          className="bg-bento-text-primary text-bento-cream px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-opacity-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          {savingProduct ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{savingProduct ? 'Saving...' : 'Save Product'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                      {/* Left Column - Core Fields */}
                      <div className="lg:col-span-7 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between h-5">
                              <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Product ID</label>
                              {isNewProduct && (
                                <span className="text-[9px] bg-bento-olive/15 text-bento-olive-dark font-mono px-2 py-0.5 rounded border border-bento-olive-border/20 font-bold">
                                  ✨ Auto-Generated
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              disabled
                              value={editId}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-bento-border bg-bento-cream/30 text-sm font-mono text-bento-text-muted select-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-5 flex items-center">
                              <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Food Category</label>
                            </div>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as FoodCategory)}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-bento-border bg-white text-sm text-bento-text-primary focus:outline-none focus:border-bento-text-primary cursor-pointer font-sans shadow-sm"
                            >
                              <option value="rice">Rice Dishes</option>
                              <option value="swallow">Swallow Meals</option>
                              <option value="soup">Premium Soups (by Litres)</option>
                              <option value="snack">Crispy Snacks</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Product Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Premium Jollof Rice Combo"
                            value={editName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-bento-border bg-white text-sm text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Description</label>
                            <button
                              type="button"
                              onClick={handleGenerateDescription}
                              disabled={isGeneratingDescription || !editName.trim()}
                              className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-bento-olive-dark hover:text-bento-text-primary border border-bento-border bg-white hover:bg-bento-cream px-2 py-0.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                              title="Generate description from product name using AI"
                            >
                              {isGeneratingDescription ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-bento-olive" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-bento-olive" />
                              )}
                              <span>{isGeneratingDescription ? "Generating..." : "Generate Description"}</span>
                            </button>
                          </div>
                          <textarea
                            required
                            placeholder="Describe the meal ingredients, preparation, and size portion details..."
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border-2 border-bento-border bg-white text-sm text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Base Price (₦)</label>
                            <input
                              type="number"
                              required
                              placeholder="4500"
                              value={editPrice || ''}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-full px-4 py-3 rounded-xl border-2 border-bento-border bg-white text-sm text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans"
                            />
                          </div>

                          <div className="space-y-1.5 relative">
                            <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Product Image</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* File Upload Option */}
                              <div className="border-2 border-dashed border-bento-border hover:border-bento-text-primary bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative cursor-pointer group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="p-2 bg-bento-cream rounded-full text-bento-text-secondary group-hover:text-bento-text-primary transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-bento-text-primary block">Upload from Device</span>
                                  <span className="text-[8px] text-bento-text-muted">Drag & drop or click to browse</span>
                                </div>
                              </div>

                              {/* Paste Link Option */}
                              <div className="space-y-1 bg-white border-2 border-bento-border rounded-xl p-3 flex flex-col justify-center">
                                <span className="text-[9px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Or Paste Image URL</span>
                                <input
                                  type="text"
                                  placeholder="https://example.com/meal.jpg"
                                  value={editImage.startsWith('data:image/') ? '' : editImage}
                                  onChange={(e) => setEditImage(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-bento-border bg-white text-xs text-bento-text-primary focus:outline-none focus:ring-1 focus:ring-bento-text-primary font-sans"
                                />
                                {editImage.startsWith('data:image/') && (
                                  <span className="text-[8px] font-mono text-green-600 font-bold">✓ Image uploaded successfully</span>
                                )}
                              </div>
                            </div>

                            {/* Small preview block */}
                            {editImage && (
                              <div className="flex items-center gap-3 mt-2 p-2 bg-bento-cream/25 border border-bento-border rounded-xl bg-white">
                                <img 
                                  src={editImage} 
                                  alt="Product preview" 
                                  className="w-10 h-10 rounded-lg object-cover border border-bento-border bg-white" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] font-bold text-bento-text-secondary block truncate">Active Image Selected</span>
                                  <span className="text-[8px] font-mono text-bento-text-muted block truncate">
                                    {editImage.startsWith('data:image/') ? 'Base64 Device Asset' : editImage}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditImage('')}
                                  className="text-[9px] font-mono font-bold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 px-2 py-1 rounded border border-bento-border transition-colors cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                          <div className="space-y-1.5 relative">
                            <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Tags (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Spicy, Popular, Chef Pick"
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-bento-border bg-white text-sm text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans"
                            />
                            {/* Tags Suggestion Pills */}
                            {getTagSuggestions().length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <span className="text-[9px] font-bold text-bento-text-muted self-center font-mono uppercase tracking-wider mr-1">Suggestions:</span>
                                {getTagSuggestions().map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleSelectTagSuggestion(tag)}
                                    className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-bento-olive-dark hover:text-white bg-bento-olive/10 hover:bg-bento-olive-dark rounded-md transition-all cursor-pointer select-none border border-bento-border/30"
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-6 p-3.5 bg-bento-cream/20 border-2 border-dashed border-bento-border rounded-xl">
                            <input
                              type="checkbox"
                              id="isPopular"
                              checked={editIsPopular}
                              onChange={(e) => setEditIsPopular(e.target.checked)}
                              className="w-4 h-4 text-bento-text-primary border-2 border-bento-border rounded-lg focus:ring-0 cursor-pointer accent-bento-olive-dark"
                            />
                            <label htmlFor="isPopular" className="text-xs font-black text-bento-text-primary uppercase tracking-wider select-none cursor-pointer font-sans">
                              Highlight as Popular Star Meal
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Custom Sizes & Extras */}
                      <div className="lg:col-span-5 space-y-6">
                        {/* Sizes Manager */}
                        <div className="bg-bento-cream/5 border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between border-b-2 border-dashed border-bento-border pb-2.5">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-bento-text-primary font-mono">Custom Sizes</h4>
                            <span className="text-[9px] bg-bento-olive/15 text-bento-olive-dark font-mono px-2 py-0.5 rounded font-bold border border-bento-olive-border/20">
                              {editSizes.length} set
                            </span>
                          </div>

                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {editSizes.map((size, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white border-2 border-bento-border px-3.5 py-2 rounded-xl text-xs hover:border-bento-text-primary transition-colors">
                                <span className="font-bold text-bento-text-primary">{size.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-bento-text-primary">₦{size.price.toLocaleString()}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSize(idx)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {editSizes.length === 0 && (
                              <p className="text-[10px] text-bento-text-muted italic py-2 text-center">No custom sizes configured (uses base price)</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-3 border-t-2 border-dashed border-bento-border">
                            <input
                              type="text"
                              placeholder="Size (e.g. Single Portion)"
                              value={tempSizeName}
                              onChange={(e) => setTempSizeName(e.target.value)}
                              className="flex-1 min-w-0 px-3 py-2 border-2 border-bento-border rounded-xl text-xs bg-white text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans placeholder:text-bento-text-muted/60"
                            />
                            <input
                              type="number"
                              placeholder="Price (₦)"
                              value={tempSizePrice}
                              onChange={(e) => setTempSizePrice(e.target.value)}
                              className="w-24 px-3 py-2 border-2 border-bento-border rounded-xl text-xs bg-white text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans placeholder:text-bento-text-muted/60"
                            />
                            <button
                              type="button"
                              onClick={handleAddSize}
                              className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 border-2 border-transparent"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Extras Manager */}
                        <div className="bg-bento-cream/5 border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between border-b-2 border-dashed border-bento-border pb-2.5">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-bento-text-primary font-mono">Toppings & Extras</h4>
                            <span className="text-[9px] bg-bento-olive/15 text-bento-olive-dark font-mono px-2 py-0.5 rounded font-bold border border-bento-olive-border/20">
                              {editExtras.length} set
                            </span>
                          </div>

                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {editExtras.map((extra) => (
                              <div key={extra.id} className="flex justify-between items-center bg-white border-2 border-bento-border px-3.5 py-2 rounded-xl text-xs hover:border-bento-text-primary transition-colors">
                                <span className="font-bold text-bento-text-primary">{extra.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-bento-text-primary">₦{extra.price.toLocaleString()}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExtra(extra.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {editExtras.length === 0 && (
                              <p className="text-[10px] text-bento-text-muted italic py-2 text-center">No extra options configured</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-3 border-t-2 border-dashed border-bento-border">
                            <input
                              type="text"
                              placeholder="Extra (e.g. Fried Fish)"
                              value={tempExtraName}
                              onChange={(e) => setTempExtraName(e.target.value)}
                              className="flex-1 min-w-0 px-3 py-2 border-2 border-bento-border rounded-xl text-xs bg-white text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans placeholder:text-bento-text-muted/60"
                            />
                            <input
                              type="number"
                              placeholder="Price (₦)"
                              value={tempExtraPrice}
                              onChange={(e) => setTempExtraPrice(e.target.value)}
                              className="w-24 px-3 py-2 border-2 border-bento-border rounded-xl text-xs bg-white text-bento-text-primary focus:outline-none focus:border-bento-text-primary shadow-sm font-sans placeholder:text-bento-text-muted/60"
                            />
                            <button
                              type="button"
                              onClick={handleAddExtra}
                              className="bg-bento-text-primary hover:bg-bento-olive-dark text-bento-cream px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 border-2 border-transparent"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Catalog List View */
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text-muted" />
                        <input
                          type="text"
                          placeholder="Search products by name or category..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-bento-border bg-white text-sm text-bento-text-primary focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                        />
                      </div>

                      {/* Header Controls */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={handleClearCatalog}
                          disabled={clearingMenu || resettingMenu}
                          className="px-3.5 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 select-none bg-white font-mono"
                          title="Permanently delete all food items in the database"
                        >
                          {clearingMenu ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          )}
                          Clear Catalog
                        </button>
                        <button
                          type="button"
                          onClick={handleResetCatalog}
                          disabled={resettingMenu || clearingMenu}
                          className="px-3.5 py-2.5 border border-bento-border rounded-xl text-xs font-bold uppercase tracking-wider text-bento-text-secondary hover:bg-bento-cream transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 select-none bg-white font-mono"
                          title="Reset to original 11 delicious Nouri meal items"
                        >
                          {resettingMenu ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-bento-olive-dark" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-bento-olive-dark" />
                          )}
                          Reset defaults
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateNewProductClick}
                          className="bg-bento-olive-dark text-bento-cream px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 flex items-center gap-2 cursor-pointer transition-colors select-none font-mono"
                        >
                          <PlusCircle className="w-4 h-4" /> Add Product
                        </button>
                      </div>
                    </div>

                    {loadingMenu ? (
                      <div className="flex justify-center items-center h-40 text-bento-text-muted">
                        <span className="font-mono text-sm uppercase tracking-wider animate-pulse">Loading Store Catalog...</span>
                      </div>
                    ) : (
                      <div className="bg-white border border-bento-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-bento-cream/50 text-bento-text-muted text-xs uppercase font-mono border-b border-bento-border font-bold">
                                <th className="p-4 font-bold">Product</th>
                                <th className="p-4 font-bold font-mono">Category</th>
                                <th className="p-4 font-bold font-mono">Price</th>
                                <th className="p-4 font-bold font-mono text-center">Options</th>
                                <th className="p-4 font-bold font-mono text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-bento-border">
                              {menuItems
                                .filter(item => 
                                  item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                  item.description.toLowerCase().includes(productSearch.toLowerCase()) ||
                                  item.category.toLowerCase().includes(productSearch.toLowerCase())
                                )
                                .map((item) => (
                                  <tr key={item.id} className="hover:bg-bento-cream/10 transition-colors">
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-10 h-10 rounded-xl object-cover border border-bento-border"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div>
                                          <span className="font-bold text-bento-text-primary block flex items-center gap-1.5">
                                            {item.name}
                                            {item.isPopular && (
                                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded-full font-bold">
                                                ★ Popular
                                              </span>
                                            )}
                                          </span>
                                          <p className="text-xs text-bento-text-muted line-clamp-1 max-w-[240px]">
                                            {item.description}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className="text-xs font-mono uppercase bg-bento-cream px-2 py-1 rounded-md border border-bento-border font-bold">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-bento-text-primary">
                                      ₦{item.price.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-xs text-bento-text-secondary text-center">
                                      <div className="inline-flex flex-col items-center">
                                        <span className="font-bold">{item.sizes ? item.sizes.length : 0} sizes</span>
                                        <span>{item.extras ? item.extras.length : 0} extras</span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditProduct(item)}
                                          className="p-1.5 text-bento-olive-dark hover:bg-bento-olive/20 rounded-lg transition-colors cursor-pointer"
                                          title="Edit Product"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteProduct(item.id)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                          title="Delete Product"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {menuItems.filter(item => 
                                item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                item.description.toLowerCase().includes(productSearch.toLowerCase()) ||
                                item.category.toLowerCase().includes(productSearch.toLowerCase())
                              ).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-bento-text-muted italic">
                                    No products found matching your search.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (() => {
              // Computed Insights data
              const totalRevenue = orders
                .filter(o => o.status === 'Delivered')
                .reduce((sum, o) => sum + o.total, 0);

              const pendingRevenue = orders
                .filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
                .reduce((sum, o) => sum + o.total, 0);

              const totalDelivered = orders.filter(o => o.status === 'Delivered').length;
              const totalInTransit = orders.filter(o => o.status === 'In Transit').length;
              const totalPreparing = orders.filter(o => o.status === 'Preparing').length;
              const totalReceived = orders.filter(o => o.status === 'Received').length;
              
              const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;
              const totalCancellationFees = orders
                .filter(o => o.status === 'Cancelled')
                .reduce((sum, o) => sum + (o.cancellationFee || 0), 0);

              // Meal popularity ranking
              const itemCounts: { [name: string]: { count: number, revenue: number, category: string, img: string } } = {};
              orders.forEach(order => {
                order.items.forEach(item => {
                  const name = item.menuItem.name;
                  const price = item.selectedSize ? item.selectedSize.price : item.menuItem.price;
                  const revenue = price * item.quantity;
                  if (!itemCounts[name]) {
                    itemCounts[name] = { 
                      count: 0, 
                      revenue: 0, 
                      category: item.menuItem.category, 
                      img: item.menuItem.image 
                    };
                  }
                  itemCounts[name].count += item.quantity;
                  itemCounts[name].revenue += revenue;
                });
              });

              const popularMeals = Object.entries(itemCounts)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              // Preferred Delivery Time slots split
              const timeSlots: { [slot: string]: number } = {
                '4:30 PM - 6:00 PM': 0,
                '6:00 PM - 7:30 PM': 0,
                '7:30 PM - 9:00 PM': 0,
              };
              orders.forEach(order => {
                const slot = order.customer.deliveryTime || '4:30 PM - 6:00 PM';
                if (timeSlots[slot] !== undefined) {
                  timeSlots[slot]++;
                }
              });

              const totalSlotsCount = Object.values(timeSlots).reduce((a, b) => a + b, 0) || 1;

              // --- CHART DATA GENERATION ---
              
              // 1. Revenue Trends over time
              const sortedOrdersForChart = [...orders]
                .filter(o => o.status === 'Delivered' && o.timestamp)
                .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

              const revenueTrendMap: { [date: string]: number } = {};
              sortedOrdersForChart.forEach(order => {
                const date = new Date(order.timestamp!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                revenueTrendMap[date] = (revenueTrendMap[date] || 0) + order.total;
              });

              const revenueChartData = Object.entries(revenueTrendMap).map(([date, revenue]) => ({
                date,
                Revenue: revenue,
              }));

              const finalRevenueData = revenueChartData.length > 0 ? revenueChartData : [
                { date: 'Mon', Revenue: 25000 },
                { date: 'Tue', Revenue: 34000 },
                { date: 'Wed', Revenue: 21000 },
                { date: 'Thu', Revenue: 45000 },
                { date: 'Fri', Revenue: 52000 },
              ];

              // 2. Category Distribution
              const categorySales: { [cat: string]: number } = {};
              orders.forEach(order => {
                order.items.forEach(item => {
                  const cat = item.menuItem.category || 'Swallow';
                  categorySales[cat] = (categorySales[cat] || 0) + item.quantity;
                });
              });

              const categoryChartData = Object.entries(categorySales).map(([name, value]) => ({
                name: name.toUpperCase(),
                value
              }));

              const finalCategoryData = categoryChartData.length > 0 ? categoryChartData : [
                { name: 'RICE', value: 12 },
                { name: 'SWALLOW', value: 8 },
                { name: 'SOUP', value: 15 },
                { name: 'SNACK', value: 5 },
              ];

              // 3. Promo Usage Chart Data
              const promoChartData = promos.map(p => ({
                code: p.code,
                Redemptions: p.usageCount,
              }));

              const CHART_COLORS = ['#4D602D', '#D0602F', '#588157', '#A3B18A', '#3A5A40', '#E9C46A', '#F4A261'];

              return (
                <div className="space-y-6 animate-fadeIn" id="admin-insights-container">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-lg text-bento-text-primary uppercase tracking-tight">Real-Time Store Insights</h3>
                      <p className="text-xs text-bento-text-muted">Live performance analytics based on current bookings</p>
                    </div>
                    <span className="text-[10px] font-mono text-bento-olive-dark bg-bento-olive/15 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                      ● Live Syncing Active
                    </span>
                  </div>

                  {/* Metrics Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="insights-metrics-bento">
                    <div className="bg-white border border-bento-border rounded-2xl p-4 space-y-1.5" id="metric-revenue">
                      <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Completed Revenue</span>
                      <h4 className="text-xl font-black text-bento-olive-dark">₦{totalRevenue.toLocaleString()}</h4>
                      <p className="text-[9px] text-bento-text-muted">From {totalDelivered} completed orders</p>
                    </div>

                    <div className="bg-white border border-bento-border rounded-2xl p-4 space-y-1.5" id="metric-pending">
                      <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Pipeline Revenue</span>
                      <h4 className="text-xl font-black text-orange-600">₦{pendingRevenue.toLocaleString()}</h4>
                      <p className="text-[9px] text-bento-text-muted">From {orders.length - totalDelivered - cancelledOrdersCount} active bookings</p>
                    </div>

                    <div className="bg-white border border-bento-border rounded-2xl p-4 space-y-1.5" id="metric-cancellation">
                      <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-wider block">Cancellation Recovery</span>
                      <h4 className="text-xl font-black text-red-600">₦{totalCancellationFees.toLocaleString()}</h4>
                      <p className="text-[9px] text-bento-text-muted">From {cancelledOrdersCount} cancelled orders</p>
                    </div>

                    <div className="bg-white border border-bento-border rounded-2xl p-4 space-y-1.5" id="metric-active-orders">
                      <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Active Kitchen Feed</span>
                      <h4 className="text-xl font-black text-blue-600">{totalReceived + totalPreparing + totalInTransit} orders</h4>
                      <div className="text-[9px] text-bento-text-muted flex gap-1">
                        <span>{totalReceived} rec</span> • <span>{totalPreparing} prep</span> • <span>{totalInTransit} transit</span>
                      </div>
                    </div>

                    <div className="bg-white border border-bento-border rounded-2xl p-4 space-y-1.5" id="metric-conversion">
                      <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Total Bookings</span>
                      <h4 className="text-xl font-black text-bento-text-primary">{orders.length} dinners</h4>
                      <p className="text-[9px] text-bento-text-muted">All-time order volume</p>
                    </div>
                  </div>

                  {/* Charts Grid Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trends Chart (Area Chart) */}
                    <div className="bg-white border border-bento-border rounded-2xl p-5 space-y-4 shadow-sm">
                      <div>
                        <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Completed Revenue Trend</h4>
                        <p className="text-[10px] text-bento-text-muted font-mono">Daily delivered dinner earnings</p>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={finalRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4D602D" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#4D602D" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontStyle="bold" tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                            <ChartTooltip 
                              formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="Revenue" stroke="#4D602D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Sales Distribution (Pie Chart) */}
                    <div className="bg-white border border-bento-border rounded-2xl p-5 space-y-4 shadow-sm">
                      <div>
                        <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Meal Category Breakdown</h4>
                        <p className="text-[10px] text-bento-text-muted font-mono">Volume distribution by culinary categories</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-7 h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={finalCategoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {finalCategoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="sm:col-span-5 space-y-2">
                          {finalCategoryData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-xs font-bold text-bento-text-secondary">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                                <span className="uppercase tracking-wider text-[10px]">{item.name}</span>
                              </div>
                              <span className="font-mono text-bento-text-primary">{item.value} units</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="insights-details-row">
                    {/* Popular Meals Standings */}
                    <div className="lg:col-span-7 bg-white border border-bento-border rounded-2xl p-5 space-y-4" id="popular-standings-card">
                      <div>
                        <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Popular Meals Standings</h4>
                        <p className="text-[10px] text-bento-text-muted font-mono">Most ordered menu items ranked by quantity</p>
                      </div>

                      <div className="space-y-3">
                        {popularMeals.map((meal, index) => (
                          <div key={meal.name} className="flex items-center justify-between bg-bento-cream/25 border border-bento-border/40 p-3 rounded-xl hover:border-bento-olive/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-bento-olive-dark bg-bento-olive/20 w-5 h-5 rounded-full flex items-center justify-center">
                                {index + 1}
                              </span>
                              <img src={meal.img} alt={meal.name} className="w-8 h-8 rounded-lg object-cover border border-bento-border" referrerPolicy="no-referrer" />
                              <div>
                                <span className="font-bold text-xs text-bento-text-primary block">{meal.name}</span>
                                <span className="text-[9px] font-mono uppercase bg-bento-cream px-1.5 py-0.5 rounded border border-bento-border/50 text-bento-text-muted font-bold">
                                  {meal.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xs text-bento-text-primary block">{meal.count} ordered</span>
                              <span className="text-[10px] font-mono font-bold text-bento-text-secondary">₦{meal.revenue.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}

                        {popularMeals.length === 0 && (
                          <div className="text-center py-8 text-bento-text-muted italic text-xs">
                            No dinner orders registered yet to compile standings.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Time and Promo Codes Impact */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Delivery Window Distribution */}
                      <div className="bg-white border border-bento-border rounded-2xl p-5 space-y-4" id="slots-distribution-card">
                        <div>
                          <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Delivery Window Distribution</h4>
                          <p className="text-[10px] text-bento-text-muted font-mono">Customer preferences for delivery schedules</p>
                        </div>

                        <div className="space-y-4 pt-2">
                          {Object.entries(timeSlots).map(([slot, count]) => {
                            const percentage = Math.round((count / totalSlotsCount) * 100);
                            return (
                              <div key={slot} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-bento-text-secondary">
                                  <span className="truncate">{slot === '4:30 PM - 6:00 PM' ? 'Early Dinner' : slot === '6:00 PM - 7:30 PM' ? 'Standard' : 'Late Dinner'} <span className="text-[10px] font-normal text-bento-text-muted">({slot})</span></span>
                                  <span className="font-mono text-bento-olive-dark">{percentage}% ({count})</span>
                                </div>
                                <div className="h-2 bg-bento-cream rounded-full overflow-hidden border border-bento-border/50">
                                  <div 
                                    className="h-full bg-bento-olive-dark rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Promo Code Redemptions Bar Chart */}
                      <div className="bg-white border border-bento-border rounded-2xl p-5 space-y-4 shadow-sm">
                        <div>
                          <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Campaign Redemptions</h4>
                          <p className="text-[10px] text-bento-text-muted font-mono">Redemption counts by promotional codes</p>
                        </div>
                        <div className="h-40">
                          {promoChartData.length === 0 ? (
                            <div className="text-center py-10 text-xs text-bento-text-muted italic">No campaign data available.</div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={promoChartData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <XAxis type="number" stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                                <YAxis type="category" dataKey="code" stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                                <ChartTooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                                <Bar dataKey="Redemptions" fill="#4D602D" radius={[0, 4, 4, 0]} barSize={12} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'promos' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-black text-lg text-bento-text-primary uppercase tracking-tight mb-1">Promotional Codes</h3>
                  <p className="text-xs text-bento-text-muted font-mono">Create discount campaigns, track user redemptions, and view promotion statistics.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Create New Promo Code Form (Bento Card) */}
                  <div className="lg:col-span-4 bg-white border border-bento-border rounded-2xl p-5 space-y-4 h-fit">
                    <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Create Campaign</h4>
                    
                    <form onSubmit={handleAddPromo} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Promo Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. DINNER50"
                          value={newPromoCode}
                          onChange={(e) => setNewPromoCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                          className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Type *</label>
                          <select
                            value={newPromoType}
                            onChange={(e) => setNewPromoType(e.target.value as 'percentage' | 'fixed')}
                            className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed (₦)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Value *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder={newPromoType === 'percentage' ? "15" : "1500"}
                            value={newPromoValue}
                            onChange={(e) => setNewPromoValue(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Get 15% off your order"
                          value={newPromoDesc}
                          onChange={(e) => setNewPromoDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-wider block">Max Uses (Optional)</label>
                        <input
                          type="number"
                          placeholder="No Limit"
                          value={newPromoMax}
                          onChange={(e) => setNewPromoMax(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                        />
                      </div>

                      <button type="submit" className="w-full bg-bento-olive-dark text-bento-cream py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Create Campaign
                      </button>
                    </form>
                  </div>

                  {/* Campaign Statistics and List (Bento Card) */}
                  <div className="lg:col-span-8 bg-white border border-bento-border rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sans text-xs font-black uppercase tracking-tight text-bento-text-primary">Campaign Performance & Stats</h4>
                      <span className="text-[10px] font-mono text-bento-text-muted font-bold">{promos.length} total codes</span>
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2">
                      {loadingPromos ? (
                        <div className="text-center py-10 text-xs font-mono text-bento-text-muted animate-pulse">Loading campaigns...</div>
                      ) : promos.length === 0 ? (
                        <div className="text-center py-10 text-xs text-bento-text-muted italic font-mono">No campaigns found. Create one on the left.</div>
                      ) : (
                        promos.map((p) => {
                          const hasLimit = p.maxUses && p.maxUses > 0;
                          const usagePercent = hasLimit ? Math.round((p.usageCount / p.maxUses!) * 100) : 0;
                          return (
                            <div key={p.code} className="p-4 border border-bento-border rounded-xl space-y-3 hover:border-bento-olive/40 transition-colors bg-white">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-mono text-xs font-black tracking-wide text-bento-text-primary uppercase bg-bento-cream px-2.5 py-1 rounded border border-bento-border">
                                      {p.code}
                                    </span>
                                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                      p.discountType === 'percentage' 
                                        ? 'bg-purple-50 text-purple-600 border border-purple-200' 
                                        : 'bg-green-50 text-green-600 border border-green-200'
                                    }`}>
                                      {p.discountType === 'percentage' ? `${p.discountValue}% Off` : `₦${p.discountValue.toLocaleString()} Off`}
                                    </span>
                                    {!p.isActive && (
                                      <span className="text-[9px] font-mono font-bold uppercase bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium text-bento-text-secondary">{p.description}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTogglePromoStatus(p)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                                      p.isActive
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                    }`}
                                  >
                                    {p.isActive ? 'Active' : 'Paused'}
                                  </button>
                                  <button
                                    onClick={() => handleRemovePromo(p.code)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Promo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar / redemption stats */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-bento-text-muted">
                                  <span>Total Redemptions</span>
                                  <span className="text-bento-text-secondary">
                                    {p.usageCount} {hasLimit ? `/ ${p.maxUses} max` : 'uses'}
                                  </span>
                                </div>
                                {hasLimit && (
                                  <div className="h-1.5 bg-bento-cream rounded-full overflow-hidden border border-bento-border/50">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        usagePercent > 85 ? 'bg-red-500' : 'bg-bento-olive-dark'
                                      }`}
                                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h3 className="font-black text-lg text-bento-text-primary uppercase tracking-tight mb-2">Admin Roles</h3>
                  <p className="text-sm text-bento-text-muted mb-6">Manage the emails that are authorized to access this control panel.</p>
                  
                  <form onSubmit={handleAddAdmin} className="flex gap-3 mb-6">
                    <input 
                      type="email"
                      required
                      placeholder="Add new admin email..."
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-bento-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                    />
                    <button type="submit" className="bg-bento-olive-dark text-bento-cream px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-opacity-90 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </form>

                  <div className="bg-white rounded-2xl border border-bento-border overflow-hidden shadow-sm">
                    {loadingAdmins ? (
                      <div className="p-6 text-center text-sm font-mono text-bento-text-muted">Loading admins...</div>
                    ) : (
                      <ul className="divide-y divide-bento-border">
                        {adminEmails.map(email => {
                          const isDefault = email === 'nourideyforyou@gmail.com' || email === 'michaiahomolaso@gmail.com';
                          return (
                            <li key={email} className="flex items-center justify-between p-4 hover:bg-bento-cream/20">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-bento-olive flex items-center justify-center text-bento-olive-dark font-black text-xs uppercase">
                                  {email.slice(0, 2)}
                                </div>
                                <div>
                                  <span className="font-medium text-bento-text-primary block">{email}</span>
                                  {isDefault && <span className="text-[10px] font-mono text-bento-olive-dark uppercase font-bold">Super Admin</span>}
                                </div>
                              </div>
                              {!isDefault && (
                                <button 
                                  onClick={() => handleRemoveAdmin(email)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove Admin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
