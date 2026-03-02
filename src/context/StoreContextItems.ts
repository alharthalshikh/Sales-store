import { createContext } from 'react';
import { CartItem, Order, Message, Review, Product, DiscountRule, Customer, Category, LoyaltyReward, Banner } from '../types';
import { products as defaultProducts, categories as defaultCategories } from '../data/products';
import { StoreType } from '../config/theme';
import themeConfig from '../config/theme';

export interface StoreSettings {
    storeName: string;
    storeDescription: string;
    storeTagline: string;
    storeLogo: string;
    storeType: StoreType;
    whatsappNumber: string;
    currency: string;
    currencySymbol: string;
    primaryColor: string;
    accentColor: string;
    termsConditions: string;
    privacyPolicy: string;
    loyaltyPointsRatio: number; // كم ريال يساوي نقطة واحدة
    loyaltyEnabled: boolean;
    instagramLink?: string;
    facebookLink?: string;
    snapchatLink?: string;
    deliveryFee?: number;
    minOrder?: number;
    freeShippingThreshold?: number;
    storeLat?: number;
    storeLng?: number;
    deliveryPricePerKm?: number;
}

export const defaultSettings: StoreSettings = {
    storeName: 'أرض الجنتين',
    storeDescription: 'أجود أنواع العسل الطبيعي، التمور الفاخرة، والعطور العربية الأصيلة - بإشراف الحارث (Alharth)',
    storeTagline: 'أرض الجنتين... جودة ونقاء بإشراف الحارث (Alharth)',
    storeLogo: 'https://gxxnuxowzufouzfzoxun.supabase.co/storage/v1/object/public/store-assets/settings/1771717035634-181c99.webp',
    storeType: themeConfig.storeType,
    whatsappNumber: themeConfig.whatsappNumber,
    currency: themeConfig.currency,
    currencySymbol: themeConfig.currencySymbol,
    primaryColor: themeConfig.colors.primary,
    accentColor: themeConfig.colors.accent,
    termsConditions: '',
    privacyPolicy: '',
    loyaltyPointsRatio: 10,
    loyaltyEnabled: true,
    instagramLink: '',
    facebookLink: '',
    snapchatLink: '',
    deliveryFee: 0,
    minOrder: 0,
    freeShippingThreshold: 500,
    storeLat: 24.7136, // Default Riyadh lat
    storeLng: 46.6753, // Default Riyadh lng
    deliveryPricePerKm: 10,
};


export interface StoreState {
    products: Product[];
    categories: Category[];
    cart: CartItem[];
    favorites: string[];
    orders: Order[];
    messages: Message[];
    reviews: Review[];
    discountRules: DiscountRule[];
    customers: Customer[];
    banners: Banner[];
    settings: StoreSettings;
    bannedCustomers: string[];
    isCartOpen: boolean;
    isMobileMenuOpen: boolean;
    supabaseReady: boolean;
    unreadFavoritesCount: number;
    rewards: LoyaltyReward[];
    isDataInitialized: boolean;
}
export type StoreAction =
    | { type: 'ADD_PRODUCT'; product: Product }
    | { type: 'UPDATE_PRODUCT'; product: Product }
    | { type: 'DELETE_PRODUCT'; productId: string }
    | { type: 'ADD_CATEGORY'; category: Category }
    | { type: 'UPDATE_CATEGORY'; category: Category }
    | { type: 'DELETE_CATEGORY'; categoryId: string }
    | { type: 'ADD_TO_CART'; product: Product; quantity?: number }
    | { type: 'REMOVE_FROM_CART'; productId: string }
    | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
    | { type: 'CLEAR_CART' }
    | { type: 'TOGGLE_FAVORITE'; productId: string }
    | { type: 'ADD_ORDER'; order: Order }
    | { type: 'UPDATE_ORDER_STATUS'; orderId: string; status: Order['status'] }
    | { type: 'DELETE_ORDER'; orderId: string }
    | { type: 'ADD_MESSAGE'; message: Message }
    | { type: 'MARK_MESSAGE_READ'; messageId: string }
    | { type: 'DELETE_MESSAGE'; messageId: string }
    | { type: 'ADD_REVIEW'; review: Review }
    | { type: 'DELETE_REVIEW'; reviewId: string }
    | { type: 'ADD_DISCOUNT_RULE'; rule: DiscountRule }
    | { type: 'UPDATE_DISCOUNT_RULE'; rule: DiscountRule }
    | { type: 'REMOVE_DISCOUNT_RULE'; ruleId: string }
    | { type: 'TOGGLE_DISCOUNT_RULE'; ruleId: string }
    | { type: 'ADD_CUSTOMER'; customer: Customer }
    | { type: 'BAN_CUSTOMER'; phone: string }
    | { type: 'UNBAN_CUSTOMER'; phone: string }
    | { type: 'DELETE_CUSTOMER'; phone: string }
    | { type: 'UPDATE_SETTINGS'; settings: Partial<StoreSettings> }
    | { type: 'ADD_BANNER'; banner: Banner }
    | { type: 'UPDATE_BANNER'; banner: Banner }
    | { type: 'DELETE_BANNER'; bannerId: string }
    | { type: 'ADD_REWARD'; reward: LoyaltyReward }
    | { type: 'UPDATE_REWARD'; reward: LoyaltyReward }
    | { type: 'DELETE_REWARD'; rewardId: string }
    | { type: 'DEDUCT_STOCK'; items: { productId: string; quantity: number }[] }
    | { type: 'TOGGLE_CART' }
    | { type: 'TOGGLE_MOBILE_MENU' }
    | { type: 'SET_CART_OPEN'; isOpen: boolean }
    | { type: 'SET_MOBILE_MENU_OPEN'; isOpen: boolean }
    | { type: 'RESET_FAVORITES_COUNT' }
    | { type: 'CLEAR_ORDERS' }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'CLEAR_REVIEWS' }
    | { type: 'CLEAR_CUSTOMERS' }
    | { type: 'CLEAR_REWARDS' }
    | { type: 'CLEAR_PRODUCTS' }
    | { type: 'CLEAR_CATEGORIES' }
    | { type: 'FACTORY_RESET' }
    | { type: 'LOGOUT' }
    | { type: 'CLEAR_USER_MESSAGES'; userId?: string; phone?: string }
    | { type: 'LOAD_STATE'; state: Partial<StoreState> };

export interface StoreContextType {
    state: StoreState;
    dispatch: React.Dispatch<StoreAction>;
    cartTotal: number;
    cartCount: number;
    getAppliedDiscount: (product: Product) => number;
    getFinalPrice: (product: Product) => number;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const initialState: StoreState = {
    products: defaultProducts,
    categories: defaultCategories,
    cart: [],
    favorites: [],
    orders: [],
    messages: [],
    reviews: [],
    discountRules: [],
    customers: [],
    banners: [
        { id: 'b1', title: 'عروض حصرية', subtitle: 'خصومات تصل لـ 50% على منتجات مختارة', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1920&q=80', link: '/products', active: true },
        { id: 'b2', title: 'منتجات جديدة', subtitle: 'اكتشف آخر ما وصلنا', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1920&q=80', link: '/products', active: true },
    ],
    settings: defaultSettings,
    bannedCustomers: [],
    isCartOpen: false,
    isMobileMenuOpen: false,
    supabaseReady: false,
    unreadFavoritesCount: 0,
    rewards: [],
    isDataInitialized: false,
};

// 🔄 دوال المزامنة مع Supabase (Helpers)
export function dbToBanner(row: any): Banner {
    return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle || '',
        image: row.image,
        link: row.link || '/products',
        active: row.active ?? true
    };
}

export function bannerToDb(b: Banner) {
    return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        image: b.image,
        link: b.link,
        active: b.active
    };
}

export function dbToReward(row: any): LoyaltyReward {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        pointsCost: Number(row.points_cost || 0),
        discountValue: Number(row.discount_value || 0),
        discountType: row.discount_type || 'percentage',
        icon: row.icon || '🎁',
        color: row.color || '#4CAF50'
    };
}

export function rewardToDb(r: LoyaltyReward) {
    return {
        id: r.id,
        title: r.title,
        description: r.description,
        points_cost: r.pointsCost,
        discount_value: r.discountValue,
        discount_type: r.discountType,
        icon: r.icon,
        color: r.color
    };
}
export function dbToProduct(row: any): Product {
    return {
        id: String(row.id),
        name: row.name,
        nameEn: row.name_en || '',
        description: row.description || '',
        price: Number(row.price),
        originalPrice: row.original_price ? Number(row.original_price) : undefined,
        discount: row.discount || undefined,
        image: row.image || '',
        images: row.images || [],
        categoryId: row.category_id ? String(row.category_id) : '',
        weight: row.weight || '',
        tags: row.tags || [],
        specifications: row.specifications || {},
        inStock: row.in_stock ?? true,
        stockQuantity: row.stock_quantity ?? 0,
        lowStockThreshold: row.low_stock_threshold ?? 5,
        featured: row.featured ?? false,
        rating: Number(row.rating) || 5,
        reviewCount: row.review_count || 0,
    };
}

export function productToDb(p: Product) {
    return {
        id: p.id, name: p.name, name_en: p.nameEn, description: p.description,
        price: p.price, original_price: p.originalPrice || null, discount: p.discount || null,
        image: p.image, images: p.images || [], category_id: p.categoryId,
        weight: p.weight, tags: p.tags || [], specifications: p.specifications || {},
        in_stock: p.inStock, stock_quantity: p.stockQuantity ?? 0, low_stock_threshold: p.lowStockThreshold ?? 5,
        featured: p.featured, rating: p.rating, review_count: p.reviewCount,
    };
}

export function dbToCategory(row: any): Category {
    return { id: String(row.id), name: row.name, nameEn: row.name_en || '', description: row.description || '', icon: row.icon || '📦', image: row.image || '' };
}

export function categoryToDb(c: Category) {
    return { id: c.id, name: c.name, name_en: c.nameEn, description: c.description, icon: c.icon, image: c.image };
}

export function dbToOrder(row: any): Order {
    return {
        id: row.id,
        userId: row.user_id,
        items: row.items || [],
        total: Number(row.total_price),
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerAddress: row.customer_address || '',
        customerNotes: row.customer_notes || '',
        status: row.status,
        paymentMethod: row.payment_method || 'cod',
        loyaltyPointsEarned: row.loyalty_points_earned || 0,
        createdAt: new Date(row.created_at).getTime()
    };
}

export function orderToDb(o: Order) {
    return {
        id: o.id,
        user_id: o.userId,
        items: o.items,
        total_price: o.total,
        customer_name: o.customerName,
        customer_phone: o.customerPhone,
        customer_address: o.customerAddress,
        customer_notes: o.customerNotes,
        status: o.status,
        payment_method: o.paymentMethod,
        loyalty_points_earned: o.loyaltyPointsEarned || 0,
        created_at: new Date(o.createdAt).toISOString()
    };
}

export function dbToMessage(row: any): Message {
    return {
        id: row.id,
        userId: row.user_id,
        senderName: row.name,
        senderPhone: row.contact_info || '',
        content: row.content,
        isFromAdmin: row.is_from_admin || false,
        orderId: row.order_id,
        read: row.status === 'read' || row.status === 'replied',
        status: row.status || 'unread',
        createdAt: new Date(row.created_at).getTime()
    };
}

export function messageToDb(m: Message) {
    return {
        id: m.id,
        user_id: m.userId,
        name: m.senderName,
        contact_info: m.senderPhone,
        content: m.content,
        is_from_admin: m.isFromAdmin,
        order_id: m.orderId,
        status: m.status,
        created_at: new Date(m.createdAt).toISOString()
    };
}

export function dbToReview(row: any): Review {
    return {
        id: row.id,
        productId: row.product_id,
        customerName: row.customer_name,
        rating: row.rating,
        comment: row.comment,
        createdAt: new Date(row.created_at).getTime(),
        adminReply: row.admin_reply || undefined,
        repliedAt: row.replied_at ? new Date(row.replied_at).getTime() : undefined
    };
}

export function reviewToDb(r: Review) {
    return {
        id: r.id,
        product_id: r.productId,
        customer_name: r.customerName,
        rating: r.rating,
        comment: r.comment,
        created_at: new Date(r.createdAt).toISOString(),
        admin_reply: r.adminReply || null,
        replied_at: r.repliedAt ? new Date(r.repliedAt).toISOString() : null
    };
}

export function dbToCustomer(row: any): Customer {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        avatarUrl: row.avatar_url,
        coverUrl: row.cover_url,
        address: row.address || '',
        role: row.role || 'customer',
        loyaltyPoints: row.loyalty_points || 0,
        isActive: row.is_active ?? true,
        isSuspended: row.is_suspended ?? false,
        deviceInfo: row.device_info || {},
        lastLocation: row.last_location || {},
        totalSpent: 0,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime()
    };
}

export function customerToDb(c: Customer) {
    return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar_url: c.avatarUrl,
        cover_url: c.coverUrl,
        address: c.address,
        role: c.role,
        loyalty_points: c.loyaltyPoints,
        is_active: c.isActive,
        is_suspended: c.isSuspended,
        device_info: c.deviceInfo,
        last_location: c.lastLocation,
        created_at: new Date(c.createdAt).toISOString(),
        updated_at: new Date(c.updatedAt).toISOString()
    };
}

export const dbToSettings = (db: any): StoreSettings => ({
    storeName: db.store_name,
    storeDescription: db.store_description || '',
    storeTagline: db.store_tagline || '',
    storeLogo: db.store_logo || '🍯',
    storeType: db.store_type || 'honey',
    whatsappNumber: db.whatsapp_number || '',
    currency: db.currency || 'ريال',
    currencySymbol: db.currency_symbol || 'ر.س',
    primaryColor: db.primary_color || '#C8860A',
    accentColor: db.accent_color || '#FFD700',
    termsConditions: db.terms_conditions || '',
    privacyPolicy: db.privacy_policy || '',
    loyaltyPointsRatio: db.loyalty_points_ratio || 10,
    loyaltyEnabled: db.loyalty_enabled ?? true,
    instagramLink: db.instagram_link || '',
    facebookLink: db.facebook_link || '',
    snapchatLink: db.snapchat_link || '',
    deliveryFee: db.delivery_fee || 0,
    minOrder: db.min_order || 0,
    freeShippingThreshold: db.free_shipping_threshold || 500,
    storeLat: typeof db.store_lat === 'number' ? db.store_lat : 24.7136,
    storeLng: typeof db.store_lng === 'number' ? db.store_lng : 46.6753,
    deliveryPricePerKm: db.delivery_price_per_km || 0,
});

export const settingsToDb = (s: StoreSettings) => ({
    id: 1,
    store_name: s.storeName,
    store_description: s.storeDescription,
    store_tagline: s.storeTagline,
    store_logo: s.storeLogo,
    store_type: s.storeType,
    whatsapp_number: s.whatsappNumber,
    currency: s.currency,
    currency_symbol: s.currencySymbol,
    primary_color: s.primaryColor,
    accent_color: s.accentColor,
    terms_conditions: s.termsConditions || '',
    privacy_policy: s.privacyPolicy || '',
    loyalty_points_ratio: s.loyaltyPointsRatio,
    loyalty_enabled: s.loyaltyEnabled,
    instagram_link: s.instagramLink || '',
    facebook_link: s.facebookLink || '',
    snapchat_link: s.snapchatLink || '',
    delivery_fee: s.deliveryFee || 0,
    min_order: s.minOrder || 0,
    free_shipping_threshold: s.freeShippingThreshold || 0,
    store_lat: typeof s.storeLat === 'number' ? s.storeLat : 24.7136,
    store_lng: typeof s.storeLng === 'number' ? s.storeLng : 46.6753,
    delivery_price_per_km: s.deliveryPricePerKm || 0,
});

export function dbToDiscount(row: any): DiscountRule {
    return {
        id: row.id,
        name: row.name,
        type: row.type,
        value: Number(row.value),
        categoryId: row.category_id || undefined,
        productIds: row.product_ids || undefined,
        active: row.active,
        startDate: row.start_date,
        endDate: row.end_date,
        userId: row.user_id || undefined
    };
}

export function discountToDb(r: DiscountRule) {
    return {
        id: r.id,
        name: r.name,
        type: r.type,
        value: r.value,
        category_id: r.categoryId || null,
        product_ids: r.productIds || null,
        active: r.active,
        start_date: r.startDate || null,
        end_date: r.endDate || null,
        user_id: r.userId || null
    };
}

export function getFinalPriceCalc(product: Product, discountRules: DiscountRule[]): number {
    if (product.originalPrice && product.discount) return product.price;
    const now = Date.now();
    const applicableRules = discountRules.filter(rule => {
        if (!rule.active) return false;
        if (rule.startDate && now < rule.startDate) return false;
        if (rule.endDate && now > rule.endDate) return false;
        if (rule.categoryId && rule.categoryId !== product.categoryId) return false;
        if (rule.productIds && !rule.productIds.includes(product.id)) return false;
        return true;
    });
    if (applicableRules.length === 0) return product.price;
    const bestRule = applicableRules.reduce((best, rule) => {
        const discount = rule.type === 'percentage' ? (product.price * rule.value) / 100 : rule.value;
        const bestDiscount = best.type === 'percentage' ? (product.price * best.value) / 100 : best.value;
        return discount > bestDiscount ? rule : best;
    });
    const discountAmount = bestRule.type === 'percentage' ? (product.price * bestRule.value) / 100 : bestRule.value;
    return Math.max(0, product.price - discountAmount);
}
