// src/types/checkout.ts

export type CartItemType = "full_course" | "section";

export interface CartItem {
  _id: string;
  type: CartItemType;
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  instructorName: string;
  sectionId?: string;
  sectionTitle?: string;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
}

export interface CheckoutResponse {
  success: boolean;
  clientSecret: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface OrderItem {
  courseTitle: string;
  type: CartItemType;
  sectionTitle?: string;
  price: number;
}

export interface Order {
  orderId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  items: OrderItem[];
  total: number;
  paidAt?: string;
  createdAt: string;
}
