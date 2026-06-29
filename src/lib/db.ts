import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { CustomerDetails, Order as OrderType, MenuItem, PromoCode } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  landmark?: string;
  deliveryInstructions?: string;
  deliveryTime?: string;
  createdAt: string;
}

// Helper to recursively remove undefined fields so Firestore doesn't throw errors
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }
  const cleanObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleanObj[key] = removeUndefinedFields(val);
      }
    }
  }
  return cleanObj as T;
}

// Save or update user profile details
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  const cleanData = removeUndefinedFields({
    ...profile,
    uid,
    updatedAt: new Date().toISOString()
  });
  await setDoc(userDocRef, cleanData, { merge: true });
}

// Get user profile details
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
}

// Save an order in firestore
export async function saveOrder(userId: string, order: OrderType): Promise<void> {
  const orderDocRef = doc(db, 'orders', order.id);
  const cleanOrder = removeUndefinedFields({
    ...order,
    userId,
    timestamp: new Date().toISOString() // for querying & ordering
  });
  await setDoc(orderDocRef, cleanOrder);
}

// Get the last 30 orders placed by a user
export async function getUserOrders(userId: string): Promise<OrderType[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    const querySnapshot = await getDocs(q);
    const orders: OrderType[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as OrderType);
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders: ", error);
    return [];
  }
}

// Set up a real-time snapshot listener for a user's last 30 orders
export function subscribeToUserOrders(userId: string, callback: (orders: OrderType[]) => void) {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snapshot) => {
    const orders: OrderType[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data() as OrderType);
    });
    callback(orders);
  }, (error) => {
    console.error("Snapshot subscription error for orders: ", error);
  });
}

// --- ADMIN FUNCTIONS ---

// Get the list of admin emails
export async function getAdminEmails(): Promise<string[]> {
  try {
    const docRef = doc(db, 'settings', 'admins');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().emails || [];
    }
    // Initialize defaults if not found
    const initialAdmins = ['nourideyforyou@gmail.com', 'michaiahomolaso@gmail.com'];
    await setDoc(docRef, { emails: initialAdmins });
    return initialAdmins;
  } catch (error) {
    console.error("Error fetching admin emails: ", error);
    return [];
  }
}

export async function addAdminEmail(email: string): Promise<void> {
  const docRef = doc(db, 'settings', 'admins');
  await updateDoc(docRef, {
    emails: arrayUnion(email)
  });
}

export async function removeAdminEmail(email: string): Promise<void> {
  const docRef = doc(db, 'settings', 'admins');
  await updateDoc(docRef, {
    emails: arrayRemove(email)
  });
}

// Get all orders (for admin)
export function subscribeToAllOrders(callback: (orders: OrderType[]) => void) {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('timestamp', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const orders: OrderType[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data() as OrderType);
    });
    callback(orders);
  }, (error) => {
    console.error("Snapshot subscription error for all orders: ", error);
  });
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status });
}

export async function cancelOrderInDb(orderId: string, fee: number, refund: number): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: 'Cancelled',
    cancellationFee: fee,
    refundAmount: refund,
    cancelledAt: new Date().toLocaleTimeString()
  });
}

export function subscribeToOrder(orderId: string, callback: (order: OrderType | null) => void) {
  const orderRef = doc(db, 'orders', orderId);
  return onSnapshot(orderRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as OrderType);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to order: ", error);
  });
}

// Subscribe to real-time storefront menu from Firestore
export function subscribeToMenu(callback: (items: MenuItem[]) => void) {
  const menuRef = collection(db, 'menu');
  return onSnapshot(menuRef, (snapshot) => {
    const items: MenuItem[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as MenuItem);
    });
    callback(items);
  }, (error) => {
    console.error("Error subscribing to menu items: ", error);
  });
}

// Create or update a menu item
export async function saveMenuItem(item: MenuItem): Promise<void> {
  const docRef = doc(db, 'menu', item.id);
  await setDoc(docRef, removeUndefinedFields(item));
}

// Delete a menu item from the storefront
export async function deleteMenuItem(itemId: string): Promise<void> {
  const docRef = doc(db, 'menu', itemId);
  await deleteDoc(docRef);
}

// Clear all menu items from the storefront
export async function clearAllMenuItems(): Promise<void> {
  const menuRef = collection(db, 'menu');
  const snapshot = await getDocs(menuRef);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'menu', docSnap.id));
  }
}

// Reset store to default menu
export async function resetMenuToDefaults(): Promise<void> {
  const menuRef = collection(db, 'menu');
  const snapshot = await getDocs(menuRef);
  
  // Delete all current items
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'menu', docSnap.id));
  }
  
  // Seed defaults
  const { MENU_ITEMS } = await import('../data');
  for (const item of MENU_ITEMS) {
    await setDoc(doc(db, 'menu', item.id), removeUndefinedFields(item));
  }
}

// --- PROMO CODES FUNCTIONS ---

// Subscribe to all promo codes in real-time
export function subscribeToPromos(callback: (promos: PromoCode[]) => void): () => void {
  const promosRef = collection(db, 'settings', 'promos', 'codes');
  const q = query(promosRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      // Seed default promos if none exist
      const defaultPromos: PromoCode[] = [
        {
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          description: '10% off your first dinner',
          usageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          code: 'BODIJATECH',
          discountType: 'fixed',
          discountValue: 1500,
          description: 'Flat ₦1,500 off',
          usageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          code: 'NOURI-PASS',
          discountType: 'percentage',
          discountValue: 15,
          description: '15% off subscription meal pass',
          usageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      for (const p of defaultPromos) {
        await setDoc(doc(db, 'settings', 'promos', 'codes', p.code), p);
      }
      callback(defaultPromos);
    } else {
      const promos: PromoCode[] = [];
      snapshot.forEach((docSnap) => {
        promos.push(docSnap.data() as PromoCode);
      });
      callback(promos);
    }
  }, (error) => {
    console.error("Error subscribing to promos:", error);
  });
}

// Save or update a promo code
export async function savePromoCode(promo: PromoCode): Promise<void> {
  const docRef = doc(db, 'settings', 'promos', 'codes', promo.code.toUpperCase().trim());
  await setDoc(docRef, removeUndefinedFields({
    ...promo,
    code: promo.code.toUpperCase().trim()
  }));
}

// Remove a promo code
export async function removePromoCode(code: string): Promise<void> {
  const docRef = doc(db, 'settings', 'promos', 'codes', code.toUpperCase().trim());
  await deleteDoc(docRef);
}

// Increment promo usage stats
export async function incrementPromoUsage(code: string): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'promos', 'codes', code.toUpperCase().trim());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        usageCount: increment(1)
      });
    }
  } catch (error) {
    console.error("Error incrementing promo usage:", error);
  }
}
