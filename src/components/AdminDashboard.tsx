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
  Percent,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Activity,
  Send,
  Bell
} from 'lucide-react';
import { Order as OrderType, MenuItem, SizeOption, ExtraOption, FoodCategory, PromoCode } from '../types';
import { sendPushNotification, getRegisteredDevices } from '../lib/notificationService';
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
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'insights' | 'promos' | 'notifications'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderViewMode, setOrderViewMode] = useState<'list' | 'dispatch'>('list');

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

  // Push Notifications Management State
  const [devices, setDevices] = useState<{ userId: string; userEmail: string; token: string; updatedAt: string }[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTarget, setNotifTarget] = useState('all'); // 'all' or user UID
  const [notifType, setNotifType] = useState<'promo' | 'order_update'>('promo');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState('');
  const [notifErrorMsg, setNotifErrorMsg] = useState('');

  // Load registered device tokens for notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      setLoadingDevices(true);
      getRegisteredDevices()
        .then((data) => {
          setDevices(data);
          setLoadingDevices(false);
        })
        .catch((err) => {
          console.error("Error loading registered devices:", err);
          setLoadingDevices(false);
        });
    }
  }, [activeTab]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) {
      setNotifErrorMsg('Title and body are required');
      return;
    }
    setSendingNotif(true);
    setNotifSuccessMsg('');
    setNotifErrorMsg('');

    try {
      let targetEmail = null;
      if (notifTarget !== 'all') {
        const found = devices.find(d => d.userId === notifTarget);
        if (found) targetEmail = found.userEmail;
      } else {
        targetEmail = 'all';
      }

      await sendPushNotification(notifTarget, targetEmail, notifTitle, notifBody, notifType);
      
      setNotifSuccessMsg(`Push Notification successfully sent to ${notifTarget === 'all' ? 'all users' : targetEmail || notifTarget}!`);
      setNotifTitle('');
      setNotifBody('');
    } catch (err) {
      console.error("Failed to send notification:", err);
      setNotifErrorMsg('Failed to dispatch notification. Please check database connection.');
    } finally {
      setSendingNotif(false);
    }
  };

  // Form Fields State for Product Editor
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<FoodCategory>('rice');
  const [editPrice, setEditPrice] = useState(0);
  const [editImage, setEditImage] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
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
    setEditTags(item.tags || []);
    setTagInput('');
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
    setEditTags([]);
    setTagInput('');
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
  const getTagSuggestions = () => {
    const currentTyped = tagInput.trim().toLowerCase();
    const existingTags = editTags.map(t => t.toLowerCase());
    
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
    if (!editTags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
      setEditTags([...editTags, tag]);
    }
    setTagInput('');
  };

  const addTag = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    if (!editTags.map(t => t.toLowerCase()).includes(cleanValue.toLowerCase())) {
      setEditTags([...editTags, cleanValue]);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,$/, '');
      if (val) {
        addTag(val);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && editTags.length > 0) {
      setEditTags(editTags.slice(0, -1));
    }
  };

  const handleTagBlur = () => {
    const val = tagInput.trim();
    if (val) {
      addTag(val);
      setTagInput('');
    }
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const tags = pasteData.split(/[,\n;]+/).map(t => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      const updatedTags = [...editTags];
      tags.forEach(tag => {
        if (!updatedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
          updatedTags.push(tag);
        }
      });
      setEditTags(updatedTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setEditTags(editTags.filter((_, idx) => idx !== indexToRemove));
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
      const tagsArray = editTags;
      
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
      
      // Auto-dispatch beautiful status change push notification to user
      const targetOrder = orders.find(o => o.id === orderId) as any;
      if (targetOrder && targetOrder.userId) {
        const title = `🍲 Order Status Update!`;
        const body = `Your Nouri order #${orderId.slice(0, 6).toUpperCase()} is now [${newStatus}].`;
        await sendPushNotification(targetOrder.userId, targetOrder.customer?.email || null, title, body, 'order_update', orderId);
      }
    } catch (err) {
      console.error("Failed to update status or send FCM push:", err);
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
                setActiveTab('notifications');
                setSelectedProduct(null);
                setIsNewProduct(false);
              }}
              className={`flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap md:w-full flex-shrink-0 ${
                activeTab === 'notifications' ? 'bg-bento-olive text-bento-olive-dark shadow-sm font-black' : 'text-bento-text-secondary hover:bg-bento-cream'
              }`}
            >
              <Bell className="w-4 h-4 flex-shrink-0 text-bento-olive-dark" />
              Push Alerts
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="font-black text-lg text-bento-text-primary uppercase tracking-tight">Active & Past Orders</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-bento-cream p-1 rounded-xl border border-bento-border">
                      <button 
                        onClick={() => setOrderViewMode('list')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${orderViewMode === 'list' ? 'bg-white text-bento-olive-dark shadow-sm' : 'text-bento-text-muted hover:text-bento-text-primary'}`}
                      >
                        List View
                      </button>
                      <button 
                        onClick={() => setOrderViewMode('dispatch')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${orderViewMode === 'dispatch' ? 'bg-white text-bento-olive-dark shadow-sm' : 'text-bento-text-muted hover:text-bento-text-primary'}`}
                      >
                        Auto Dispatch
                      </button>
                    </div>
                    <div className="text-xs font-mono text-bento-text-muted bg-bento-cream px-3 py-1.5 rounded-lg border border-bento-border">
                      {orders.length} orders total
                    </div>
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center items-center h-40 text-bento-text-muted">
                    <span className="font-mono text-sm uppercase tracking-wider animate-pulse">Loading Live Orders...</span>
                  </div>
                ) : orderViewMode === 'list' ? (
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
                                {order.customer.googleMapsLink && (
                                  <p>
                                    <span className="font-medium text-bento-text-secondary">Map:</span>{' '}
                                    <a href={order.customer.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      Open in Google Maps
                                    </a>
                                  </p>
                                )}
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
                ) : (
                  <div className="space-y-6">
                    <div className="bg-bento-cream border border-bento-border p-4 rounded-2xl flex items-center gap-3">
                      <Truck className="w-6 h-6 text-bento-olive-dark flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-black text-bento-text-primary uppercase tracking-tight">AI Dispatch Optimization</h4>
                        <p className="text-xs text-bento-text-muted">Active orders grouped by location & landmark to maximize delivery efficiency.</p>
                      </div>
                    </div>
                    {(() => {
                      const activeOrders = orders.filter(o => o.status === 'Received' || o.status === 'Preparing');
                      if (activeOrders.length === 0) {
                        return (
                          <div className="text-center py-10 text-bento-text-muted text-sm border-2 border-dashed border-bento-border rounded-2xl">
                            No active orders to dispatch.
                          </div>
                        );
                      }
                      
                      const grouped: Record<string, typeof orders> = {};
                      activeOrders.forEach(o => {
                        const zone = o.customer.landmark?.trim() || 'Unknown Zone / Direct Address';
                        if (!grouped[zone]) grouped[zone] = [];
                        grouped[zone].push(o);
                      });
                      
                      return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).map(([zone, zoneOrders]) => (
                        <div key={zone} className="border border-bento-border bg-white rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-bento-olive/10 border-b border-bento-border p-3 flex justify-between items-center">
                            <h5 className="font-bold text-sm text-bento-text-primary uppercase flex items-center gap-2">
                              📍 Zone: {zone}
                            </h5>
                            <span className="bg-white text-bento-olive-dark text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border border-bento-border">
                              {zoneOrders.length} Order(s)
                            </span>
                          </div>
                          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {zoneOrders.map(o => (
                              <div key={o.id} className="border border-bento-border rounded-xl p-3 text-xs bg-bento-cream/20">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-mono font-bold">{o.id.slice(0, 8).toUpperCase()}</span>
                                  <span className="bg-orange-100 text-orange-800 border border-orange-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
                                    {o.status}
                                  </span>
                                </div>
                                <p className="font-medium text-bento-text-primary truncate">{o.customer.name}</p>
                                <p className="text-bento-text-muted truncate mb-1">{o.customer.address}</p>
                                {o.customer.googleMapsLink && (
                                  <a href={o.customer.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mb-2 inline-block text-[10px]">
                                    Open Map
                                  </a>
                                )}
                                <div className="space-y-1">
                                  {o.items.map((it, i) => (
                                    <div key={i} className="flex justify-between border-t border-bento-border/50 pt-1">
                                      <span className="text-bento-text-secondary truncate pr-2">{it.quantity}x {it.menuItem.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
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
                            <label className="block text-[10px] font-black text-bento-text-primary uppercase tracking-widest font-mono">Tags</label>
                            <div className="w-full min-h-[46px] p-2 flex flex-wrap gap-1.5 rounded-xl border-2 border-bento-border bg-white text-sm text-bento-text-primary focus-within:border-bento-olive-dark focus-within:ring-2 focus-within:ring-bento-olive/20 shadow-xs font-sans transition-all duration-200">
                              {editTags.map((tag, idx) => (
                                <span 
                                  key={`${tag}-${idx}`} 
                                  className="inline-flex items-center gap-1.5 bg-bento-cream/60 hover:bg-bento-cream border border-bento-border/80 text-[11px] font-bold text-bento-text-primary px-2.5 py-1 rounded-lg select-none transition-colors"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(idx)}
                                    className="text-bento-text-muted hover:text-red-600 font-black cursor-pointer ml-0.5 leading-none w-3.5 h-3.5 rounded-full hover:bg-red-50 flex items-center justify-center text-xs transition-colors"
                                    title="Remove tag"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder={editTags.length === 0 ? "Type and press Enter, comma, or paste list..." : "Add tag..."}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagInputKeyDown}
                                onBlur={handleTagBlur}
                                onPaste={handleTagPaste}
                                className="flex-1 min-w-[140px] bg-transparent outline-none border-none py-1 px-1 text-xs text-bento-text-primary placeholder:text-bento-text-muted/60"
                              />
                            </div>
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

              const CHART_COLORS = ['#5C3A21', '#D2791B', '#8F7A6C', '#EAD2BE', '#4D602D', '#D0602F', '#F4A261'];

              // Compute additional smart business insights locally
              const topMeal = popularMeals[0];
              const peakSlotName = Object.entries(timeSlots).sort((a,b) => b[1] - a[1])[0]?.[0] || '6:00 PM - 7:30 PM';
              const topPromo = promoChartData.sort((a,b) => b.Redemptions - a.Redemptions)[0];
              const conversionRate = orders.length > 0 ? Math.round((totalDelivered / orders.length) * 100) : 0;

              return (
                <div className="space-y-8 animate-fadeIn" id="admin-insights-container">
                  {/* Dashboard Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bento-olive/10 border-2 border-bento-border/50 rounded-3xl p-6 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 bg-bento-olive-dark/10 rounded-lg text-bento-olive-dark">
                          <Activity className="w-5 h-5" />
                        </span>
                        <h3 className="font-black text-xl text-bento-text-primary uppercase tracking-tight font-sans">Store Performance Console</h3>
                      </div>
                      <p className="text-xs text-bento-text-secondary font-sans font-medium">Real-time revenue flows, dinner booking volumes, and kitchen analytics.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-full font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        Live telemetry synchronized
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="insights-metrics-bento">
                    
                    {/* Metric: Completed Revenue */}
                    <div className="bg-white border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 hover:border-bento-olive-dark hover:-translate-y-0.5 transition-all duration-300 shadow-sm relative group overflow-hidden" id="metric-revenue">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-bento-olive/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-widest">Completed Revenue</span>
                        <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-2xl font-black text-bento-olive-dark">₦{totalRevenue.toLocaleString()}</h4>
                        <p className="text-[9px] font-mono text-bento-text-muted font-bold uppercase tracking-wider">
                          {totalDelivered} Delivered Dinner{totalDelivered !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Metric: Pipeline Revenue */}
                    <div className="bg-white border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 hover:border-bento-olive-dark hover:-translate-y-0.5 transition-all duration-300 shadow-sm relative group overflow-hidden" id="metric-pending">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50/10 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-widest">Pipeline Revenue</span>
                        <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                          <Clock className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-2xl font-black text-orange-600">₦{pendingRevenue.toLocaleString()}</h4>
                        <p className="text-[9px] font-mono text-bento-text-muted font-bold uppercase tracking-wider">
                          {orders.length - totalDelivered - cancelledOrdersCount} Active Bookings
                        </p>
                      </div>
                    </div>

                    {/* Metric: Cancellation Recovery */}
                    <div className="bg-white border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 hover:border-bento-olive-dark hover:-translate-y-0.5 transition-all duration-300 shadow-sm relative group overflow-hidden" id="metric-cancellation">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-red-50/10 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Cancelled Fees</span>
                        <span className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100">
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-2xl font-black text-red-600">₦{totalCancellationFees.toLocaleString()}</h4>
                        <p className="text-[9px] font-mono text-bento-text-muted font-bold uppercase tracking-wider">
                          {cancelledOrdersCount} Cancelled Dinners
                        </p>
                      </div>
                    </div>

                    {/* Metric: Active Kitchen Feed */}
                    <div className="bg-white border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 hover:border-bento-olive-dark hover:-translate-y-0.5 transition-all duration-300 shadow-sm relative group overflow-hidden" id="metric-active-orders">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50/10 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-widest">Active Kitchen</span>
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                          <Truck className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl font-black text-blue-600">{totalReceived + totalPreparing + totalInTransit} orders</h4>
                        <div className="flex flex-wrap gap-1 text-[8px] font-mono font-bold uppercase tracking-wider">
                          <span className="bg-amber-50 text-amber-800 px-1 py-0.5 rounded border border-amber-200">{totalReceived} Rec</span>
                          <span className="bg-orange-50 text-orange-800 px-1 py-0.5 rounded border border-orange-200">{totalPreparing} Prep</span>
                          <span className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded border border-blue-200">{totalInTransit} Out</span>
                        </div>
                      </div>
                    </div>

                    {/* Metric: Total Volume */}
                    <div className="bg-white border-2 border-bento-border rounded-2xl p-4.5 space-y-3.5 hover:border-bento-olive-dark hover:-translate-y-0.5 transition-all duration-300 shadow-sm relative group overflow-hidden" id="metric-conversion">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-bento-cream/10 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-bento-text-muted uppercase tracking-widest">Total Bookings</span>
                        <span className="p-1.5 bg-bento-cream border border-bento-border text-bento-text-primary rounded-lg">
                          <ShoppingBag className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-2xl font-black text-bento-text-primary">{orders.length} dinners</h4>
                        <p className="text-[9px] font-mono text-bento-text-muted font-bold uppercase tracking-wider">
                          {conversionRate}% Delivery Rate
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Smart Business Advice & Kitchen Recommendation Panel */}
                  <div className="bg-gradient-to-r from-bento-olive/15 via-bento-tan/30 to-bento-cream border-2 border-bento-border rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-bento-tan-dark animate-pulse" />
                      <h4 className="font-sans text-xs font-black uppercase tracking-widest text-bento-olive-dark font-mono">Kitchen Optimization & Operational Strategy (AI Advices)</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                      {/* Operational Advice 1: Supply Planning */}
                      <div className="bg-white border border-bento-border/70 p-4 rounded-2xl flex gap-3 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="p-2 h-fit bg-bento-olive/40 text-bento-olive-dark rounded-xl border border-bento-border">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-bento-text-muted">Ingredient Supply advice</span>
                          <p className="text-xs font-bold text-bento-text-primary leading-tight">
                            {topMeal ? (
                              <>Demand is peaking for <span className="text-bento-olive-dark underline decoration-2 decoration-bento-border">{topMeal.name}</span>. Secure raw materials to handle continued volume scaling.</>
                            ) : (
                              "Initial demand trends are compiling. Prioritize keeping rice and premium swallow base items fully stocked."
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Operational Advice 2: Kitchen Scheduling */}
                      <div className="bg-white border border-bento-border/70 p-4 rounded-2xl flex gap-3 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="p-2 h-fit bg-orange-50 text-orange-700 rounded-xl border border-orange-100">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-bento-text-muted">Peak Shift Dispatching</span>
                          <p className="text-xs font-bold text-bento-text-primary leading-tight">
                            The <span className="text-orange-700 font-mono">{peakSlotName}</span> slot remains your heaviest bottleneck. Pre-batch and wrap active items 30 minutes before this window.
                          </p>
                        </div>
                      </div>

                      {/* Operational Advice 3: Marketing Campaign ROI */}
                      <div className="bg-white border border-bento-border/70 p-4 rounded-2xl flex gap-3 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="p-2 h-fit bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-bento-text-muted">Promo Optimization</span>
                          <p className="text-xs font-bold text-bento-text-primary leading-tight">
                            {topPromo && topPromo.Redemptions > 0 ? (
                              <>Campaign <span className="font-mono bg-emerald-100/50 border border-emerald-200 px-1 py-0.5 rounded text-emerald-800">{topPromo.code}</span> is driving your peak conversions with {topPromo.Redemptions} redemptions. Promote it on socials!</>
                            ) : (
                              "No active campaign codes are being redeemed. Deploy an early-bird promo discount (e.g. EARLY10) to optimize dinner prep cycles."
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trends Chart (Area Chart) */}
                    <div className="bg-white border-2 border-bento-border rounded-3xl p-5.5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-start border-b border-bento-border/40 pb-3">
                        <div>
                          <h4 className="font-sans text-xs font-black uppercase tracking-widest text-bento-text-primary">Completed Revenue Trend</h4>
                          <p className="text-[10px] text-bento-text-muted font-mono">Daily delivered dinner earnings metrics</p>
                        </div>
                        <span className="p-1 bg-bento-cream rounded-lg border border-bento-border text-bento-olive-dark">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={finalRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#5C3A21" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#5C3A21" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD5" opacity={0.5} />
                            <XAxis dataKey="date" stroke="#8F7A6C" fontSize={10} fontStyle="bold" tickLine={false} />
                            <YAxis stroke="#8F7A6C" fontSize={10} fontStyle="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                            <ChartTooltip 
                              formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                              contentStyle={{ background: '#FAF8F5', border: '2px solid #E8DFD5', borderRadius: '12px', fontSize: '11px', color: '#2C1A10', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="Revenue" stroke="#5C3A21" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Sales Distribution (Pie Chart) */}
                    <div className="bg-white border-2 border-bento-border rounded-3xl p-5.5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-start border-b border-bento-border/40 pb-3">
                        <div>
                          <h4 className="font-sans text-xs font-black uppercase tracking-widest text-bento-text-primary">Meal Category Breakdown</h4>
                          <p className="text-[10px] text-bento-text-muted font-mono">Volume distribution by culinary categories</p>
                        </div>
                        <span className="p-1 bg-bento-cream rounded-lg border border-bento-border text-bento-olive-dark">
                          <Activity className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
                        <div className="sm:col-span-7 h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={finalCategoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={6}
                                dataKey="value"
                              >
                                {finalCategoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip contentStyle={{ background: '#FAF8F5', border: '2px solid #E8DFD5', borderRadius: '12px', fontSize: '11px', color: '#2C1A10', fontWeight: 'bold' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="sm:col-span-5 space-y-2.5">
                          {finalCategoryData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-xs font-bold text-bento-text-secondary bg-bento-cream/20 border border-bento-border/30 p-1.5 px-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                                <span className="uppercase tracking-wider text-[10px]">{item.name}</span>
                              </div>
                              <span className="font-mono text-bento-text-primary text-[11px]">{item.value} units</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="insights-details-row">
                    {/* Popular Meals Standings */}
                    <div className="lg:col-span-7 bg-white border-2 border-bento-border rounded-3xl p-5.5 space-y-4 shadow-sm" id="popular-standings-card">
                      <div className="flex justify-between items-start border-b border-bento-border/40 pb-3">
                        <div>
                          <h4 className="font-sans text-xs font-black uppercase tracking-widest text-bento-text-primary">Popular Meals Standings</h4>
                          <p className="text-[10px] text-bento-text-muted font-mono">Most ordered menu items ranked by quantity</p>
                        </div>
                        <span className="text-[10px] font-mono bg-bento-olive/30 border border-bento-olive-border/50 text-bento-olive-dark px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          Rankings
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {popularMeals.map((meal, index) => (
                          <div key={meal.name} className="flex items-center justify-between bg-bento-cream/25 border-2 border-bento-border p-3 rounded-2xl hover:border-bento-olive-dark hover:shadow-xs transition-all duration-300">
                            <div className="flex items-center gap-3.5">
                              <span className="font-mono text-xs font-black text-bento-olive-dark bg-bento-olive-border/30 w-6 h-6 rounded-full flex items-center justify-center border border-bento-border">
                                {index + 1}
                              </span>
                              <img src={meal.img} alt={meal.name} className="w-10 h-10 rounded-xl object-cover border border-bento-border bg-white" referrerPolicy="no-referrer" />
                              <div className="space-y-0.5">
                                <span className="font-black text-xs text-bento-text-primary block">{meal.name}</span>
                                <span className="text-[9px] font-mono uppercase bg-white px-2 py-0.5 rounded-md border border-bento-border/75 text-bento-text-muted font-bold tracking-wider">
                                  {meal.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="font-black text-xs text-bento-olive-dark block">{meal.count} ordered</span>
                              <span className="text-[10px] font-mono font-bold text-bento-text-muted">₦{meal.revenue.toLocaleString()} Rev</span>
                            </div>
                          </div>
                        ))}

                        {popularMeals.length === 0 && (
                          <div className="text-center py-12 text-bento-text-muted italic text-xs font-sans">
                            No dinner orders registered yet to compile standings.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Time and Promo Codes Impact */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Delivery Window Distribution */}
                      <div className="bg-white border-2 border-bento-border rounded-3xl p-5.5 space-y-4 shadow-sm" id="slots-distribution-card">
                        <div className="flex justify-between items-start border-b border-bento-border/40 pb-3">
                          <div>
                            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-bento-text-primary">Delivery Window Distribution</h4>
                            <p className="text-[10px] text-bento-text-muted font-mono">Customer preferences for delivery schedules</p>
                          </div>
                          <span className="p-1 bg-bento-cream rounded-lg border border-bento-border text-bento-olive-dark">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="space-y-4.5 pt-2">
                          {Object.entries(timeSlots).map(([slot, count]) => {
                            const percentage = Math.round((count / totalSlotsCount) * 100);
                            return (
                              <div key={slot} className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-black text-bento-text-secondary">
                                  <span className="truncate">{slot === '4:30 PM - 6:00 PM' ? '🌅 Early Dinner' : slot === '6:00 PM - 7:30 PM' ? '🌆 Standard' : '🌃 Late Dinner'} <span className="text-[9px] font-mono font-normal text-bento-text-muted">({slot})</span></span>
                                  <span className="font-mono text-bento-olive-dark text-[11px] bg-bento-olive/30 px-2 py-0.5 rounded-md border border-bento-border/40">{percentage}% ({count})</span>
                                </div>
                                <div className="h-2.5 bg-bento-cream rounded-full overflow-hidden border border-bento-border">
                                  <div 
                                    className="h-full bg-bento-olive-dark rounded-full transition-all duration-700"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Promo Code Redemptions Bar Chart */}
                      <div className="bg-white border-2 border-bento-border rounded-3xl p-5.5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start border-b border-bento-border/40 pb-3">
                          <div>
                            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-bento-text-primary">Campaign Redemptions</h4>
                            <p className="text-[10px] text-bento-text-muted font-mono">Redemption counts by promotional codes</p>
                          </div>
                          <span className="p-1 bg-bento-cream rounded-lg border border-bento-border text-bento-olive-dark">
                            <Ticket className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="h-40 pt-2">
                          {promoChartData.length === 0 ? (
                            <div className="text-center py-10 text-xs text-bento-text-muted italic font-sans">No campaign redemption data available yet.</div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={promoChartData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <XAxis type="number" stroke="#8F7A6C" fontSize={9} fontStyle="bold" tickLine={false} />
                                <YAxis type="category" dataKey="code" stroke="#8F7A6C" fontSize={9} fontStyle="bold" tickLine={false} />
                                <ChartTooltip contentStyle={{ background: '#FAF8F5', border: '2px solid #E8DFD5', borderRadius: '12px', fontSize: '11px', color: '#2C1A10', fontWeight: 'bold' }} />
                                <Bar dataKey="Redemptions" fill="#5C3A21" radius={[0, 6, 6, 0]} barSize={14} />
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

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex flex-col xl:flex-row gap-6">
                  {/* Left: Compose Form */}
                  <div className="flex-1 bg-white p-5 sm:p-6 rounded-2xl border border-bento-border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="text-bento-olive-dark w-5 h-5" />
                      <h3 className="font-black text-lg text-bento-text-primary uppercase tracking-tight">Compose Push Notification</h3>
                    </div>
                    <p className="text-xs text-bento-text-muted mb-6">Send status updates or promotional broadcasts directly to customers' notification bell in real-time.</p>

                    {notifSuccessMsg && (
                      <div className="mb-4 p-3 bg-bento-olive/10 text-bento-olive-dark rounded-xl text-xs font-bold border border-bento-olive/30 flex items-center gap-2 animate-bounce">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {notifSuccessMsg}
                      </div>
                    )}

                    {notifErrorMsg && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {notifErrorMsg}
                      </div>
                    )}

                    <form onSubmit={handleSendNotification} className="space-y-4">
                      {/* Recipient Selector */}
                      <div>
                        <label className="block text-xs font-bold text-bento-text-primary uppercase tracking-wider mb-1.5">Target Recipient</label>
                        <select
                          value={notifTarget}
                          onChange={(e) => setNotifTarget(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                        >
                          <option value="all">📢 All Registered Users (Broadcast Promo)</option>
                          {devices.map((device) => (
                            <option key={device.userId} value={device.userId}>
                              👤 {device.userEmail} ({device.userId.slice(0, 6)}...)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Type Selector */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-bento-text-primary uppercase tracking-wider mb-1.5">Notification Type</label>
                          <select
                            value={notifType}
                            onChange={(e) => setNotifType(e.target.value as 'promo' | 'order_update')}
                            className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                          >
                            <option value="promo">🎁 Promotion / Discount Campaign</option>
                            <option value="order_update">🚴 Order Status / Kitchen Update</option>
                          </select>
                        </div>

                        {/* Title input */}
                        <div>
                          <label className="block text-xs font-bold text-bento-text-primary uppercase tracking-wider mb-1.5">Notification Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Delicious Soup Alert!"
                            value={notifTitle}
                            onChange={(e) => setNotifTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                          />
                        </div>
                      </div>

                      {/* Body textarea */}
                      <div>
                        <label className="block text-xs font-bold text-bento-text-primary uppercase tracking-wider mb-1.5">Message Body</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Compose your dynamic notification message here..."
                          value={notifBody}
                          onChange={(e) => setNotifBody(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-bento-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-bento-olive-dark"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={sendingNotif}
                        className="w-full bg-bento-olive-dark text-bento-cream py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {sendingNotif ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatched FCM Send...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Dispatch Push Notification
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right: Device Tokens Directory */}
                  <div className="w-full xl:w-96 bg-white p-5 rounded-2xl border border-bento-border shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Activity className="text-bento-olive-dark w-5 h-5 animate-pulse" />
                      <h4 className="font-black text-sm text-bento-text-primary uppercase tracking-tight">FCM Device Tokens ({devices.length})</h4>
                    </div>
                    <p className="text-[10px] text-bento-text-muted mb-4">Direct directory registry mapping of device tokens stored in firestore.</p>

                    <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-bento-border/50">
                      {loadingDevices ? (
                        <div className="p-6 text-center text-xs font-mono text-bento-text-muted">Loading device directory...</div>
                      ) : devices.length === 0 ? (
                        <div className="p-8 text-center text-bento-text-muted">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-bold">No active devices</p>
                          <p className="text-[9px] font-medium mt-1">Tokens register here once customers log in.</p>
                        </div>
                      ) : (
                        devices.map((dev) => (
                          <div key={dev.userId} className="py-2.5 hover:bg-bento-cream/10 transition-all flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-bento-text-primary truncate">{dev.userEmail}</span>
                              <span className="text-[8px] font-mono font-bold bg-bento-olive/10 text-bento-olive-dark px-1.5 py-0.5 rounded-lg shrink-0">ONLINE</span>
                            </div>
                            <div className="text-[9px] text-bento-text-muted font-mono truncate select-all" title="Click to copy token">
                              Token: <span className="text-bento-text-secondary">{dev.token}</span>
                            </div>
                            <span className="text-[8px] text-bento-text-muted">Registered: {new Date(dev.updatedAt).toLocaleDateString()} {new Date(dev.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))
                      )}
                    </div>
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
