// Types for the bookstore application

export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  description: string;
  image: string;
  rating: number;
  reviews: Review[];
  category: string;
  isbn: string;
  pages: number;
  language: string;
  publisher: string;
  year: number;
  featured?: boolean;
  special?: boolean;
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface CartItem {
  bookId: number;
  quantity: number;
}

export interface Order {
  id: string;          // було number
  userId?: string;     // можна лишити необов'язково
  items: CartItem[];
  total: number;
  date: string;        // будемо класти dateIso
  status: string;
  customer?: any;      // якщо захочеш показувати адресу/тел
}


export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  bookIds: number[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  active?: boolean;
}

