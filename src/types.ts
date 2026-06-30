export interface SizeOption {
  name: string;      // e.g. "1 Litre", "2 Litres", "3 Litres", "5 Litres", "Small Bowl", "Large Bowl", "Small", "Medium", "Large"
  price: number;     // Price in Naira (₦)
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;     // e.g. Extra beef ₦500, Extra plantain ₦500
}

export type FoodCategory = 'swallow' | 'rice' | 'soup' | 'snack' | 'extra';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  price: number;               // Base price or standard price
  sizes?: SizeOption[];        // Custom size options for Soups and Snacks
  extras?: ExtraOption[];      // Relevant extra options
  image: string;               // Unsplash food image
  tags: string[];              // e.g. ["Best Seller", "Working Class Fave", "Spicy", "High Protein", "Quick Dinner", "Sweet", "Crunchy"]
  isPopular?: boolean;
}

export interface CartItem {
  id: string;                  // Unique ID in cart (item.id + size_name + extras_ids_hash)
  menuItem: MenuItem;
  selectedSize?: SizeOption;
  selectedExtras: ExtraOption[];
  quantity: number;
  customNotes?: string;
  plannedDay?: string;        // If chosen as part of the weekly meal planner
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  landmark?: string;
  deliveryInstructions?: string; // e.g. "Leave with gatekeeper", "Call upon arrival"
  deliveryTime: string;          // e.g. "4:30 PM - 6:00 PM", "6:00 PM - 7:30 PM", "7:30 PM - 9:00 PM"
  plannedDay?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerDetails;
  total: number;
  createdAt: string;
  status: 'Received' | 'Preparing' | 'In Transit' | 'Delivered' | 'Cancelled';
  cancellationFee?: number;
  refundAmount?: number;
  cancelledAt?: string;
}

export interface PlannedMeal {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  itemId?: string;
  sizeName?: string;
  notes?: string;
}

export interface PromoCode {
  code: string;               // Uppercase unique code, e.g. "WELCOME10"
  discountType: 'percentage' | 'fixed';
  discountValue: number;      // e.g., 10 for percentage, 1500 for fixed Naira
  description: string;        // Explanation of the code
  usageCount: number;         // Statistics: how many times used
  maxUses?: number;           // Optional maximum usage limit
  isActive: boolean;          // Is active or disabled
  createdAt: string;          // ISO Date
}

export interface PushNotification {
  id: string;
  userId: string;             // User UID or "all" for broadcast promos
  title: string;
  body: string;
  type: 'order_update' | 'promo';
  sentAt: string;             // ISO String
  read: boolean;
  orderId?: string;
  userEmail?: string;         // optional tracking info
}


