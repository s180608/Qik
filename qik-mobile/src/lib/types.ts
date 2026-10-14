export type Role = "CUSTOMER" | "ADMIN" | "RIDER";
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
}
export interface Category {
  id: number;
  name: string;
  active: boolean;
}
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  category: Category;
}
export type Cart = Record<string, number>;
export type OrderStatus =
  | "PLACED"
  | "PICKING"
  | "READY"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export interface Order {
  id: number;
  customer: User;
  rider?: User;
  address: string;
  postcode: string;
  status: OrderStatus;
  items: {
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  simulated: boolean;
}
