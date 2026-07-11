export interface ComboChoice {
  label: string;
  priceModifier: number;
}

export interface ComboOption {
  name: string;
  choices: ComboChoice[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl: string; // REAL Krispy King image URL from the list above
  isCombo?: boolean;
  comboOptions?: ComboOption[];
  spiceLevel?: number; // 0-3 (0: None, 1: Mild, 2: Hot, 3: Extra Hot)
  isPopular?: boolean;
  isAvailable?: boolean;
  isBreakfast?: boolean; // only shown 6am-11am
  isKiddies?: boolean;
  servingSize?: string; // "1pc", "4 wings", "Single", etc.
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedOptions?: Record<string, string>; // e.g. { "Burger Choice": "Double Chicken Burger (+R23.00)" }
  unitPrice: number; // price at the time of adding (with option mods)
}

export interface Order {
  id: string;
  passCode: string; // e.g., KK-84A2F1
  customerName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'verified' | 'completed' | 'cancelled';
  createdAt: number; // timestamp
  verifiedAt?: number;
  completedAt?: number;
}

export interface StaffSession {
  isAuthenticated: boolean;
  loginTime: number;
}
