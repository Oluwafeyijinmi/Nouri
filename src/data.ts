import { MenuItem } from './types';

export const STANDARD_EXTRAS = [
  { id: 'ext_beef', name: 'Extra Beef', price: 500 },
  { id: 'ext_chicken', name: 'Extra Chicken', price: 1800 },
  { id: 'ext_fish', name: 'Extra Fish', price: 1200 },
  { id: 'ext_plantain', name: 'Extra Plantain', price: 500 },
  { id: 'ext_semo', name: 'Extra Semo', price: 500 },
  { id: 'ext_eba', name: 'Extra Eba', price: 400 },
];

export const MENU_ITEMS: MenuItem[] = [
  // --- RICE DISHES ---
  {
    id: 'rice_beef',
    name: 'Rice with Beef',
    description: 'Perfectly seasoned rice served with tender, flavorful stewed beef chunks. A comforting classic for dinner.',
    category: 'rice',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800',
    tags: ['Working Class Fave', 'Quick Dinner', 'High Protein', 'Rice Classics'],
    extras: [
      { id: 'ext_beef', name: 'Extra Beef', price: 500 },
      { id: 'ext_plantain', name: 'Extra Plantain', price: 500 }
    ],
    isPopular: true
  },
  {
    id: 'rice_chicken',
    name: 'Rice with Chicken',
    description: 'Rich tomato-stew rice paired with a large, beautifully roasted and spiced chicken piece.',
    category: 'rice',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    tags: ['Best Seller', 'Working Class Fave', 'High Protein'],
    extras: [
      { id: 'ext_chicken', name: 'Extra Chicken', price: 1800 },
      { id: 'ext_plantain', name: 'Extra Plantain', price: 500 }
    ],
    isPopular: true
  },
  {
    id: 'rice_fish',
    name: 'Rice with Fish',
    description: 'Tasty rice served with seasoned, deep-fried fresh fish in classic Nigerian tomato stew.',
    category: 'rice',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800',
    tags: ['Healthy Choice', 'Quick Dinner', 'Fish Lovers'],
    extras: [
      { id: 'ext_fish', name: 'Extra Fish', price: 1200 },
      { id: 'ext_plantain', name: 'Extra Plantain', price: 500 }
    ]
  },
  {
    id: 'white_rice_stew',
    name: 'White Rice and Stew (Beef)',
    description: 'Steaming white rice with rich, slow-simmered Yoruba style stew and succulent chunks of beef.',
    category: 'rice',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800',
    tags: ['Simple Comfort', 'Quick Dinner'],
    extras: [
      { id: 'ext_beef', name: 'Extra Beef', price: 500 },
      { id: 'ext_plantain', name: 'Extra Plantain', price: 500 }
    ]
  },

  // --- SWALLOW DISHES ---
  {
    id: 'swallow_ewedu_beef',
    name: 'Swallow with Ewedu and Beef',
    description: 'Your choice of Swallow (Semo, Eba, Amala) paired with slimy, delicious Ewedu soup, stew, and tender beef.',
    category: 'swallow',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800',
    tags: ['Traditional', 'Local Flavor', 'Dinner Classics'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_beef', name: 'Extra Beef', price: 500 }
    ],
    isPopular: true
  },
  {
    id: 'swallow_ewedu_chicken',
    name: 'Swallow with Ewedu and Chicken',
    description: 'Soft Swallow served with seasoned Ewedu soup, rich tomato stew, and a large roasted chicken part.',
    category: 'swallow',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800',
    tags: ['Traditional', 'Rich Dinner', 'High Protein'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_chicken', name: 'Extra Chicken', price: 1800 }
    ]
  },
  {
    id: 'swallow_ewedu_fish',
    name: 'Swallow with Ewedu and Fish',
    description: 'Hot Swallow with slimy Ewedu, stew, and fried fish. Perfect comfort meal after a busy workday.',
    category: 'swallow',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800',
    tags: ['Traditional', 'Fish Lovers'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_fish', name: 'Extra Fish', price: 1200 }
    ]
  },
  {
    id: 'swallow_efo_beef',
    name: 'Swallow with Efo Riro & Beef',
    description: 'Warm Swallow served with rich, aromatic Efo Riro (Spiced Spinach Soup) cooked with beef and local spices.',
    category: 'swallow',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800',
    tags: ['Best Seller', 'Traditional', 'Nutritious'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_beef', name: 'Extra Beef', price: 500 }
    ],
    isPopular: true
  },
  {
    id: 'swallow_efo_chicken',
    name: 'Swallow with Efo Riro & Chicken',
    description: 'Fluffy Swallow of choice served with deluxe Efo Riro stew and crispy spiced roasted chicken.',
    category: 'swallow',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=800',
    tags: ['Traditional', 'Rich Dinner'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_chicken', name: 'Extra Chicken', price: 1800 }
    ]
  },
  {
    id: 'swallow_egusi_beef',
    name: 'Swallow with Egusi & Beef',
    description: 'Traditional swallow with richly textured Egusi (Melon Seed) soup cooked with beef, palm oil, and stockfish.',
    category: 'swallow',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    tags: ['Working Class Fave', 'Traditional'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_beef', name: 'Extra Beef', price: 500 }
    ]
  },
  {
    id: 'swallow_egusi_chicken',
    name: 'Swallow with Egusi & Chicken',
    description: 'Soft swallow served with rich Egusi soup, stewed chicken, and distinct Nigerian herbs.',
    category: 'swallow',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
    tags: ['Traditional', 'Rich Dinner'],
    extras: [
      { id: 'ext_semo', name: 'Extra Semo', price: 500 },
      { id: 'ext_eba', name: 'Extra Eba', price: 400 },
      { id: 'ext_chicken', name: 'Extra Chicken', price: 1800 }
    ]
  },
  {
    id: 'fried_stew_plate',
    name: 'A Plate of Fried Stew',
    description: 'Rich, intensely cooked spicy Yoruba-style fried pepper stew. Amazing addition to any swallow or rice.',
    category: 'swallow',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&q=80&w=800',
    tags: ['Spicy Fave', 'Extras'],
    extras: [
      { id: 'ext_beef', name: 'Extra Beef', price: 500 },
      { id: 'ext_chicken', name: 'Extra Chicken', price: 1800 }
    ]
  },

  // --- SOUPS IN LITRES / BOWLS ---
  {
    id: 'soup_efo_litres',
    name: 'Premium Efo Riro (Litre Bowls)',
    description: 'Bulk order of our highly sought-after spinach soup. Cooked with high-quality stock, rich dry fish, cow skin (ponmo), and traditional spices. Ready to freeze and reheat for your week!',
    category: 'soup',
    price: 8000, // Base is 1 Litre
    sizes: [
      { name: '1 Litre Bowl', price: 8000 },
      { name: '2 Litre Bowl', price: 15000 },
      { name: '3 Litre Bowl', price: 22000 },
      { name: '5 Litre Bowl', price: 35000 }
    ],
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800',
    tags: ['Meal Prep', 'Busy Professional Special', 'Bulk Soup'],
    isPopular: true
  },
  {
    id: 'soup_egusi_litres',
    name: 'Premium Egusi Soup (Litre Bowls)',
    description: 'Creamy, rich melon seed soup cooked to perfection with crayfish, dried prawns, and local vegetable leaves. Stock your fridge for easy weekday meals.',
    category: 'soup',
    price: 8000,
    sizes: [
      { name: '1 Litre Bowl', price: 8000 },
      { name: '2 Litre Bowl', price: 15000 },
      { name: '3 Litre Bowl', price: 22000 },
      { name: '5 Litre Bowl', price: 35000 }
    ],
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800',
    tags: ['Meal Prep', 'Busy Professional Special', 'Bulk Soup'],
    isPopular: true
  },
  {
    id: 'soup_ewedu_litres',
    name: 'Fresh Ewedu Soup (Litre Bowls)',
    description: 'Traditional slippery Jute leaf soup blended with authentic local spices (iru). Excellent for instant swallow meals.',
    category: 'soup',
    price: 4000,
    sizes: [
      { name: '1 Litre Bowl', price: 4000 },
      { name: '2 Litre Bowl', price: 7500 },
      { name: '3 Litre Bowl', price: 11000 },
      { name: '5 Litre Bowl', price: 18000 }
    ],
    image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&q=80&w=800',
    tags: ['Meal Prep', 'Traditional Fave']
  },
  {
    id: 'soup_stew_litres',
    name: 'Signature Fried Pepper Stew (Litre Bowls)',
    description: 'Our house-special spicy red pepper oil stew, fried slowly to release deep sweet-savory notes. Goes with everything - rice, beans, swallows.',
    category: 'soup',
    price: 6000,
    sizes: [
      { name: '1 Litre Bowl', price: 6000 },
      { name: '2 Litre Bowl', price: 11500 },
      { name: '3 Litre Bowl', price: 17000 },
      { name: '5 Litre Bowl', price: 27000 }
    ],
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800',
    tags: ['Meal Prep', 'Versatile Stew'],
    isPopular: true
  },

  // --- SNACKS ---
  {
    id: 'snack_chinchin',
    name: 'Crunchy Gourmet Chin Chin',
    description: 'Our signature crispy, milky, and beautifully scented chin chin. Sweet with a pleasant hint of nutmeg. Keeps perfectly fresh in airtight storage!',
    category: 'snack',
    price: 800,
    sizes: [
      { name: 'Small (250g Pouch)', price: 800 },
      { name: 'Medium (750g Jar)', price: 2000 },
      { name: 'Large (2kg Family Pack)', price: 4500 }
    ],
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=800',
    tags: ['Workplace Snack', 'Crunchy Fave', 'Milky Sweet'],
    isPopular: true
  },
  {
    id: 'snack_plantain_chips',
    name: 'Premium Plantain Chips (Sweet & Spicy)',
    description: 'Perfectly thin, crispy plantain chips. Available in naturally sweet golden ripe, or spicy green unripe varieties. A healthy and energetic snack for office hours.',
    category: 'snack',
    price: 600,
    sizes: [
      { name: 'Small Pouch', price: 600 },
      { name: 'Medium Bag', price: 1500 },
      { name: 'Large Jumbo Tub', price: 3500 }
    ],
    image: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?auto=format&fit=crop&q=80&w=800',
    tags: ['Workplace Snack', 'Crispy', 'Healthy Choice'],
    isPopular: true
  },
  {
    id: 'snack_banana_chips',
    name: 'Sweet Banana Chips',
    description: 'Delectable, golden, crispy sun-dried banana chips with a natural tropical sweet glaze. Awesome sweet energy boost.',
    category: 'snack',
    price: 600,
    sizes: [
      { name: 'Small Pouch', price: 600 },
      { name: 'Medium Bag', price: 1500 },
      { name: 'Large Jumbo Tub', price: 3500 }
    ],
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800',
    tags: ['Workplace Snack', 'Crunchy Fave', 'Natural Sweet']
  }
];

export const WORK_CLASS_REVIEWS = [
  {
    id: 'rev1',
    name: 'Tola Adebayo',
    role: 'Bank Manager, Ibadan North',
    quote: 'Nouri is a life-saver. Arriving home by 6 PM with zero energy to cook, having a hot bowl of swallow and Efo Riro delivered fresh at 5:00 PM makes my weekdays heavenly. Highly recommended for busy folks!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    rating: 5
  },
  {
    id: 'rev2',
    name: 'Dr. Kunle Olatunji',
    role: 'Senior Consultant, UCH Ibadan',
    quote: 'I order the 3-Litre Egusi soup and Chin Chin every weekend. The soup is frozen into portions for my weekdays. The taste is incredibly authentic, just like premium home cooking without the time investment.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    rating: 5
  },
  {
    id: 'rev3',
    name: 'Amara Uzor',
    role: 'Software Engineer & Remote Worker',
    quote: 'Crunchy banana and plantain chips are my absolute workday savior while coding. And their white rice and stew dinner delivery allows me to transition from work to evening family time effortlessly.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    rating: 5
  }
];

export const FAQ_ITEMS = [
  {
    question: "When do deliveries start?",
    answer: "Deliveries start promptly from 4:30 PM, specifically timed for when working-class people are returning home or concluding their workdays. You can schedule your preferred window between 4:30 PM and 9:00 PM."
  },
  {
    question: "How do your soup litre/bowl orders work?",
    answer: "Our premium soups (Efo Riro, Egusi, Ewedu, Fried Stew) are prepared in larger volume containers (1L, 2L, 3L, and 5L bowls). They are cooked fresh, cooled down, and sealed. They are perfect for freezing or portioning to cover your family's meals for the week!"
  },
  {
    question: "Are the snacks available in different sizes?",
    answer: "Yes! Our homemade Chin Chin, plantain chips, and banana chips come in three convenient sizes: Small Pouches (perfect for single snack breaks), Medium Bags/Jars (for keeping at your office desk), and Large Jumbo Tubs/Packs (perfect for families or week-long munching)."
  },
  {
    question: "Where in Ibadan do you deliver?",
    answer: "We proudly serve major working-class residential and commercial areas across Ibadan, Oyo State, including Bodija, Samonda, Akobo, Oluyole, Jericho, Ring Road, UI, and environs."
  },
  {
    question: "Can I pre-plan my entire week's dinner with Nouri?",
    answer: "Absolutely! Use our built-in Weekly Meal Planner tool to schedule your dinners from Monday to Friday. You can add them all to your cart at once, establishing a hassle-free meal schedule for your busy week."
  }
];
