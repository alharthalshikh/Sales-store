// ============================================================
// 📦 أنواع البيانات الرئيسية للمتجر
// ============================================================

export interface Category {
    id: string;
    name: string;
    nameEn: string;
    icon: string;
    description: string;
    image: string;
}

export interface Product {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    price: number;
    originalPrice?: number; // السعر الأصلي قبل التخفيض
    discount?: number; // نسبة التخفيض %
    categoryId: string;
    image: string;
    images?: string[];
    weight?: string;
    inStock: boolean;
    stockQuantity: number; // عدد القطع المتاحة في المخزون
    lowStockThreshold?: number; // حد التنبيه للمخزون المنخفض (افتراضي 5)
    featured?: boolean;
    rating: number;
    reviewCount: number;
    tags?: string[];
    specifications?: Record<string, string>;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface FavoriteItem {
    productId: string;
    addedAt: number;
}

export interface Order {
    id: string;
    userId?: string;
    items: CartItem[];
    total: number;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerLat?: number;
    customerLng?: number;
    customerNotes?: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod?: 'cod' | 'card';
    loyaltyPointsEarned?: number;
    createdAt: number;
}

export interface Message {
    id: string;
    userId?: string;
    senderName: string;
    senderPhone: string;
    content: string;
    isFromAdmin: boolean;
    orderId?: string;
    createdAt: number;
    read: boolean;
    status: 'unread' | 'read' | 'replied';
}

export interface DiscountRule {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    categoryId?: string;
    productIds?: string[];
    active: boolean;
    startDate?: number;
    endDate?: number;
    userId?: string; // لربط كبونات المكافآت بالمستخدمين
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    coverUrl?: string;
    address: string;
    role: 'admin' | 'moderator' | 'customer';
    loyaltyPoints: number;
    isActive: boolean;
    isSuspended: boolean;
    deviceInfo?: any;
    lastLocation?: any;
    totalSpent: number;
    createdAt: number;
    updatedAt: number;
}

export interface UserSession {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
    createdAt: number;
}

export interface Review {
    id: string;
    productId: string;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: number;
    adminReply?: string;
    repliedAt?: number;
}

export interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    active: boolean;
}

export interface LoyaltyReward {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    icon: string;
    color: string;
}
