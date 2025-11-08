export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  items: CartItem[];
  subtotal: number;
  total: number;
  tender: number;
  change: number;
}
