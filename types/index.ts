export type UserRole = "kasir" | "kitchen";

export type OrderSource = "qr" | "walk-in";
export type OrderType = "dine-in" | "take-away";
export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentMethod = "qris" | "cash" | "debit";
export type ShiftStatus = "open" | "closed";

export type MenuCategory =
  | "nasi"
  | "signature_noodle"
  | "mie"
  | "snack"
  | "ketan"
  | "pisang"
  | "roti_bakar"
  | "minuman";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string | null;
  image: string | null;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  note: string | null;
  subtotal: number;
}

export interface Order {
  id: string;
  standId: string | null;
  tableId: string | null;
  orderSource: OrderSource;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentId: string | null;
  queueNumber: string | null;
  subtotal: number;
  tax: number;
  totalAmount: number;
  customerNote: string | null;
  paidAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  stand?: Stand;
  table?: Table;
}

export interface Stand {
  id: string;
  standNumber: number;
  isActive: boolean;
  orderId: string | null;
}

export interface Table {
  id: string;
  tableNumber: string;
  qrCode: string;
  isQREnabled: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
}

export const TAX_RATE = 0.03; // 3% PPN

export const categoryLabels: Record<MenuCategory, string> = {
  nasi: "Nasi",
  signature_noodle: "Signature Noodle",
  mie: "Mie",
  snack: "Snack",
  ketan: "Ketan",
  pisang: "Pisang",
  roti_bakar: "Roti Bakar",
  minuman: "Minuman",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
};
