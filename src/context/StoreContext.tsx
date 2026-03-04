// ============================================================
// 🔄 إدارة حالة المتجر الكاملة + مزامنة Supabase
// المنتجات، الأصناف، السلة، المفضلة، الطلبات، الرسائل، العملاء، الإعدادات
// ============================================================
import React, { useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import { CartItem, Product, Order, Message, Banner, Customer, LoyaltyReward, Category } from '../types';
import { products as defaultProducts, categories as defaultCategories } from '../data/products';
import themeConfig from '../config/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// استيراد الأنواع والثوابت من الملف الجديد
import {
    StoreState, StoreAction, StoreSettings,
    initialState, defaultSettings, StoreContext,
    dbToBanner, bannerToDb, dbToProduct, productToDb,
    dbToCategory, categoryToDb, dbToOrder, orderToDb,
    dbToMessage, messageToDb, dbToReview, reviewToDb,
    dbToCustomer, customerToDb, dbToSettings, settingsToDb,
    dbToDiscount, discountToDb, getFinalPriceCalc,
    dbToReward, rewardToDb
} from './StoreContextItems';

function storeReducer(state: StoreState, action: StoreAction): StoreState {
    switch (action.type) {
        case 'ADD_PRODUCT':
            return { ...state, products: [...state.products, action.product] };
        case 'UPDATE_PRODUCT':
            return { ...state, products: state.products.map(p => p.id === action.product.id ? action.product : p) };
        case 'DELETE_PRODUCT':
            return { ...state, products: state.products.filter(p => p.id !== action.productId), cart: state.cart.filter(item => item.product.id !== action.productId), favorites: state.favorites.filter(id => id !== action.productId) };
        case 'ADD_CATEGORY':
            return { ...state, categories: [...state.categories, action.category] };
        case 'UPDATE_CATEGORY':
            return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) };
        case 'DELETE_CATEGORY':
            return { ...state, categories: state.categories.filter(c => c.id !== action.categoryId), products: state.products.filter(p => p.categoryId !== action.categoryId) };
        case 'ADD_TO_CART': {
            const existing = state.cart.find(item => item.product.id === action.product.id);
            if (existing) {
                return { ...state, cart: state.cart.map(item => item.product.id === action.product.id ? { ...item, quantity: item.quantity + (action.quantity || 1) } : item) };
            }
            return { ...state, cart: [...state.cart, { product: action.product, quantity: action.quantity || 1 }] };
        }
        case 'REMOVE_FROM_CART':
            return { ...state, cart: state.cart.filter(item => item.product.id !== action.productId) };
        case 'UPDATE_QUANTITY': {
            if (action.quantity <= 0) return { ...state, cart: state.cart.filter(item => item.product.id !== action.productId) };
            return {
                ...state,
                cart: state.cart.map(item => {
                    if (item.product.id === action.productId) {
                        const maxQty = item.product.stockQuantity ?? 999;
                        return { ...item, quantity: Math.min(action.quantity, maxQty) };
                    }
                    return item;
                })
            };
        }
        case 'CLEAR_CART':
            return { ...state, cart: [] };
        case 'TOGGLE_FAVORITE': {
            const isFav = state.favorites.includes(action.productId);
            return {
                ...state,
                favorites: isFav ? state.favorites.filter(id => id !== action.productId) : [...state.favorites, action.productId],
                unreadFavoritesCount: !isFav ? state.unreadFavoritesCount + 1 : state.unreadFavoritesCount
            };
        }
        case 'RESET_FAVORITES_COUNT':
            return { ...state, unreadFavoritesCount: 0 };
        case 'ADD_ORDER':
            if (state.orders.find(o => o.id === action.order.id)) return state;
            return { ...state, orders: [action.order, ...state.orders] };
        case 'UPDATE_ORDER_STATUS':
            return { ...state, orders: state.orders.map(o => o.id === action.orderId ? { ...o, status: action.status } : o) };
        case 'DELETE_ORDER':
            return { ...state, orders: state.orders.filter(o => o.id !== action.orderId) };
        case 'ADD_MESSAGE':
            if (state.messages.find(m => m.id === action.message.id)) return state;
            return { ...state, messages: [action.message, ...state.messages] };
        case 'MARK_MESSAGE_READ':
            return { ...state, messages: state.messages.map(m => m.id === action.messageId ? { ...m, read: true, status: 'read' } : m) };
        case 'DELETE_MESSAGE':
            return { ...state, messages: state.messages.filter(m => m.id !== action.messageId) };
        case 'CLEAR_USER_MESSAGES':
            return {
                ...state,
                messages: state.messages.filter(m => {
                    if (action.userId) return m.userId !== action.userId;
                    if (action.phone) return m.senderPhone !== action.phone;
                    return true;
                })
            };
        case 'ADD_REVIEW':
            return { ...state, reviews: [action.review, ...state.reviews] };
        case 'DELETE_REVIEW':
            return { ...state, reviews: state.reviews.filter(r => r.id !== action.reviewId) };
        case 'ADD_DISCOUNT_RULE':
            return { ...state, discountRules: [...state.discountRules, action.rule] };
        case 'UPDATE_DISCOUNT_RULE':
            return { ...state, discountRules: state.discountRules.map(r => r.id === action.rule.id ? action.rule : r) };
        case 'REMOVE_DISCOUNT_RULE':
            return { ...state, discountRules: state.discountRules.filter(r => r.id !== action.ruleId) };
        case 'TOGGLE_DISCOUNT_RULE':
            return { ...state, discountRules: state.discountRules.map(r => r.id === action.ruleId ? { ...r, active: !r.active } : r) };
        case 'ADD_CUSTOMER':
            if (state.customers.find(c => c.id === action.customer.id)) return state;
            return { ...state, customers: [...state.customers, action.customer] };
        case 'BAN_CUSTOMER':
            return {
                ...state,
                bannedCustomers: Array.from(new Set([...state.bannedCustomers, action.phone])),
                customers: state.customers.map(c => c.phone === action.phone ? { ...c, isSuspended: true } : c)
            };
        case 'UNBAN_CUSTOMER':
            return {
                ...state,
                bannedCustomers: state.bannedCustomers.filter(p => p !== action.phone),
                customers: state.customers.map(c => c.phone === action.phone ? { ...c, isSuspended: false } : c)
            };
        case 'DELETE_CUSTOMER':
            return {
                ...state,
                customers: state.customers.filter(c => c.phone !== action.phone),
                orders: state.orders.filter(o => o.customerPhone !== action.phone),
                messages: state.messages.filter(m => m.senderPhone !== action.phone),
                bannedCustomers: state.bannedCustomers.filter(p => p !== action.phone)
            };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.settings } };
        case 'ADD_BANNER':
            return { ...state, banners: [...state.banners, action.banner] };
        case 'UPDATE_BANNER':
            return { ...state, banners: state.banners.map(b => b.id === action.banner.id ? action.banner : b) };
        case 'DELETE_BANNER':
            return { ...state, banners: state.banners.filter(b => b.id !== action.bannerId) };
        case 'ADD_REWARD':
            return { ...state, rewards: [action.reward, ...state.rewards] };
        case 'UPDATE_REWARD':
            return { ...state, rewards: state.rewards.map(r => r.id === action.reward.id ? action.reward : r) };
        case 'DELETE_REWARD':
            return { ...state, rewards: state.rewards.filter(r => r.id !== action.rewardId) };
        case 'DEDUCT_STOCK': {
            const updatedProducts = state.products.map(p => {
                const deduction = action.items.find(item => item.productId === p.id);
                if (!deduction) return p;
                const newQty = Math.max(0, (p.stockQuantity || 0) - deduction.quantity);
                return { ...p, stockQuantity: newQty, inStock: newQty > 0 };
            });
            return { ...state, products: updatedProducts };
        }
        case 'TOGGLE_CART':
            return { ...state, isCartOpen: !state.isCartOpen };
        case 'TOGGLE_MOBILE_MENU':
            return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
        case 'SET_CART_OPEN':
            return { ...state, isCartOpen: action.isOpen };
        case 'SET_MOBILE_MENU_OPEN':
            return { ...state, isMobileMenuOpen: action.isOpen };
        case 'CLEAR_ORDERS':
            return { ...state, orders: [] };
        case 'CLEAR_MESSAGES':
            return { ...state, messages: [] };
        case 'CLEAR_REVIEWS':
            return { ...state, reviews: [] };
        case 'CLEAR_CUSTOMERS':
            return { ...state, customers: [] };
        case 'CLEAR_REWARDS':
            return { ...state, rewards: [] };
        case 'CLEAR_PRODUCTS':
            return { ...state, products: [] };
        case 'CLEAR_CATEGORIES':
            return { ...state, categories: [] };
        case 'FACTORY_RESET':
            return {
                ...initialState,
                isDataInitialized: true
            };
        case 'LOGOUT':
            return {
                ...state,
                cart: [],
                favorites: [],
                orders: [],
                messages: [],
                reviews: [],
                rewards: [],
                unreadFavoritesCount: 0
            };
        case 'LOAD_STATE': {
            // console.log('🔄 REDUCER: LOAD_STATE', Object.keys(action.state));

            return {
                ...state,
                // ندمج كل البيانات القادمة بشرط ألا تكون undefined
                ...Object.fromEntries(
                    Object.entries(action.state).filter(([_, v]) => v !== undefined)
                ),
                // تأكيد تحديث الإعدادات إذا وجدت
                settings: action.state.settings || state.settings,
                isDataInitialized: action.state.isDataInitialized ?? state.isDataInitialized
            };
        }
        default:
            return state;
    }
}

export function StoreProvider({ children }: { children: ReactNode }) {
    const { user, isAdmin, userData } = useAuth();
    const [state, baseDispatch] = useReducer(storeReducer, initialState);
    const supabaseInitialized = useRef(false);

    // ===== Dispatch مع مزامنة Supabase =====
    const dispatch = useCallback((action: StoreAction) => {
        baseDispatch(action);

        // مزامنة مع Supabase في الخلفية (للبيانات العامة)
        // syncToSupabase(action).catch(err => console.warn('Supabase sync error:', err));
    }, [user]); // استقرار أكبر للـ dispatch

    // ===== المزامنة مع Supabase (البيانات العامة) =====
    async function syncToSupabase(action: StoreAction) {
        try {
            switch (action.type) {
                case 'ADD_PRODUCT':
                    await supabase.from('products').upsert(productToDb(action.product));
                    break;
                case 'UPDATE_PRODUCT':
                    await supabase.from('products').upsert(productToDb(action.product));
                    break;
                case 'DELETE_PRODUCT':
                    await supabase.from('products').delete().eq('id', action.productId);
                    break;
                case 'ADD_CATEGORY':
                    await supabase.from('categories').upsert(categoryToDb(action.category));
                    break;
                case 'UPDATE_CATEGORY':
                    await supabase.from('categories').upsert(categoryToDb(action.category));
                    break;
                case 'DELETE_CATEGORY':
                    await supabase.from('categories').delete().eq('id', action.categoryId);
                    break;
                case 'ADD_ORDER': {
                    const { error } = await supabase.from('orders').upsert(orderToDb(action.order));
                    if (error) { /* console.error('❌ فشل حفظ الطلب في السيرفر:', error.message, error.details); */ }
                    // else console.log('✅ تم حفظ الطلب برقم:', action.order.id);
                    break;
                }
                case 'UPDATE_ORDER_STATUS': {
                    // console.log(`📦 جاري تحديث الطلب ${action.orderId} إلى: ${action.status}`);
                    const { error } = await supabase.from('orders').update({ status: action.status }).eq('id', action.orderId);
                    if (error) {
                        // console.error('❌ فشل تحديث حالة الطلب في السيرفر:', error.message);
                    } else {
                        // console.log('✅ تم تحديث حالة الطلب بنجاح في السيرفر');
                    }

                    // 📦 خصم المخزون تلقائياً عند تأكيد التوصيل (نخصم فقط إذا لم يكن مُوصلاً بالفعل)
                    if (action.status === 'delivered') {
                        const order = state.orders.find(o => o.id === action.orderId);
                        if (order && order.status !== 'delivered' && order.items.length > 0) {
                            const deductionItems = order.items.map(item => ({
                                productId: item.product.id,
                                quantity: item.quantity,
                            }));
                            baseDispatch({ type: 'DEDUCT_STOCK', items: deductionItems });
                            // console.log('📉 تم خصم المخزون للمنتجات:', deductionItems);

                            // مزامنة المخزون المحدث مع Supabase
                            for (const item of deductionItems) {
                                const product = state.products.find(p => p.id === item.productId);
                                if (product) {
                                    const newQty = Math.max(0, (product.stockQuantity || 0) - item.quantity);
                                    await supabase.from('products').update({
                                        stock_quantity: newQty,
                                        in_stock: newQty > 0,
                                    }).eq('id', item.productId);
                                }
                            }
                        }
                    }
                    break;
                }
                case 'DEDUCT_STOCK': {
                    // مزامنة خصم المخزون مع Supabase
                    for (const item of action.items) {
                        const product = state.products.find(p => p.id === item.productId);
                        if (product) {
                            const newQty = Math.max(0, (product.stockQuantity || 0) - item.quantity);
                            await supabase.from('products').update({
                                stock_quantity: newQty,
                                in_stock: newQty > 0,
                            }).eq('id', item.productId);
                        }
                    }
                    break;
                }
                case 'DELETE_ORDER': {
                    const { error } = await supabase.from('orders').delete().eq('id', action.orderId);
                    if (error) { /* console.error('❌ فشل حذف الطلب من السيرفر:', error.message); */ }
                    break;
                }
                case 'ADD_MESSAGE': {
                    const { error } = await supabase.from('messages').upsert(messageToDb(action.message));
                    if (error) { /* console.error('❌ فشل حفظ الرسالة في السيرفر:', error.message); */ }
                    break;
                }
                case 'MARK_MESSAGE_READ':
                    await supabase.from('messages').update({ status: 'read' }).eq('id', action.messageId);
                    break;
                case 'DELETE_MESSAGE':
                    await supabase.from('messages').delete().eq('id', action.messageId);
                    break;
                case 'ADD_REVIEW':
                    await supabase.from('reviews').upsert(reviewToDb(action.review));
                    break;
                case 'DELETE_REVIEW':
                    await supabase.from('reviews').delete().eq('id', action.reviewId);
                    break;
                case 'ADD_DISCOUNT_RULE': {
                    const { error } = await supabase.from('discount_rules').upsert(discountToDb(action.rule));
                    if (error) {
                        // console.error('❌ فشل إضافة قاعدة الخصم للسيرفر:', error.message);
                        alert(`فشل حفظ التخفيض في السيرفر: ${error.message}. سيتم الحفظ محلياً فقط.`);
                    } else {
                        // console.log('✅ تم حفظ قاعدة الخصم في السيرفر');
                    }
                    break;
                }
                case 'UPDATE_DISCOUNT_RULE': {
                    const { error } = await supabase.from('discount_rules').upsert(discountToDb(action.rule));
                    if (error) { /* console.error('❌ فشل تحديث قاعدة الخصم في السيرفر:', error.message); */ }
                    break;
                }
                case 'REMOVE_DISCOUNT_RULE': {
                    const { error } = await supabase.from('discount_rules').delete().eq('id', action.ruleId);
                    if (error) { /* console.error('❌ فشل حذف قاعدة الخصم من السيرفر:', error.message); */ }
                    break;
                }
                case 'TOGGLE_DISCOUNT_RULE': {
                    // جلب القيمة الحالية وعكسها في قاعدة البيانات
                    const currentRule = state.discountRules.find(r => r.id === action.ruleId);
                    if (currentRule) {
                        const { error } = await supabase.from('discount_rules').update({ active: !currentRule.active }).eq('id', action.ruleId);
                        if (error) { /* console.error('❌ فشل تحديث حالة التخفيض:', error.message); */ }
                        // else console.log('✅ تم تحديث حالة التخفيض في السيرفر');
                    }
                    break;
                }
                case 'ADD_CUSTOMER': {
                    // مزامنة مع جدول users الموحد
                    const customer = action.customer;
                    await supabase.from('users').upsert({
                        id: customer.id,
                        email: customer.email || '',
                        name: customer.name || 'عميل جديد',
                        phone: customer.phone || '',
                        role: 'customer',
                        is_active: true,
                        is_suspended: false
                    }, { onConflict: 'id' });
                    break;
                }
                case 'UPDATE_SETTINGS': {
                    const dbSettings = settingsToDb({ ...state.settings, ...action.settings });
                    // console.log('📡 جاري محاولة الحفظ المطور...', dbSettings);

                    try {
                        // تقليل وقت الانتظار للمحاولة الأولى لضمان استجابة أسرع في حال وجود خطأ في الأعمدة
                        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 8000));

                        const performSync = async () => {
                            // 1. محاولة الحفظ الكامل
                            const { error: fullError } = await supabase.from('settings').upsert(dbSettings, { onConflict: 'id' });

                            if (fullError) {
                                // console.warn('⚠️ فشل الحفظ الكامل، جاري محاولة الحفظ الآمن...', fullError.message);

                                // 2. محاولة الحفظ بدون الميزات الجديدة (التوصيل المطور والولاء)
                                const level1Safe = { ...dbSettings };
                                const keysToRemove = [
                                    'loyalty_enabled', 'loyalty_points_ratio', 'terms_conditions', 'privacy_policy',
                                    'instagram_link', 'facebook_link', 'snapchat_link', 'delivery_fee', 'min_order',
                                    'free_shipping_threshold', 'store_lat', 'store_lng', 'delivery_price_per_km'
                                ];
                                keysToRemove.forEach(key => delete (level1Safe as any)[key]);

                                const { error: err1 } = await supabase.from('settings').upsert(level1Safe, { onConflict: 'id' });
                                if (!err1) {
                                    // console.log('✅ تم الحفظ بنجاح (النسخة المتوافقة)');
                                    return;
                                }

                                // 3. الحفظ الأساسي جداً كخيار أخير
                                const level2Safe = {
                                    id: 1,
                                    store_name: dbSettings.store_name,
                                    store_logo: dbSettings.store_logo,
                                    whatsapp_number: dbSettings.whatsapp_number
                                };
                                await supabase.from('settings').upsert(level2Safe, { onConflict: 'id' });
                            }
                        };

                        await Promise.race([performSync(), timeout]);
                        // console.log('✅ انتهت المزامنة بنجاح');
                    } catch (err: any) {
                        // console.error('❌ خطأ في المزامنة:', err.message);
                        // لا نظهر التنبيه للمستخدم لضمان استمرارية العمل محلياً
                    }
                    break;
                }
                case 'ADD_BANNER':
                    await supabase.from('banners').upsert(bannerToDb(action.banner));
                    break;
                case 'UPDATE_BANNER':
                    await supabase.from('banners').upsert(bannerToDb(action.banner));
                    break;
                case 'DELETE_BANNER':
                    await supabase.from('banners').delete().eq('id', action.bannerId);
                    break;
                case 'CLEAR_USER_MESSAGES':
                    if (action.userId) {
                        await supabase.from('messages').delete().eq('user_id', action.userId);
                    } else if (action.phone) {
                        await supabase.from('messages').delete().eq('sender_phone', action.phone);
                    }
                    break;
                case 'ADD_REWARD': {
                    // console.log('💎 جاري إضافة مكافأة جديدة للسيرفر...', action.reward);
                    const { error } = await supabase.from('rewards').upsert(rewardToDb(action.reward));
                    if (error) { /* console.error('❌ فشل إضافة المكافأة:', error.message); */ }
                    else { /* console.log('✅ تم حفظ المكافأة بنجاح'); */ }
                    break;
                }
                case 'UPDATE_REWARD': {
                    const { error } = await supabase.from('rewards').upsert(rewardToDb(action.reward));
                    if (error) console.error('❌ فشل تحديث المكافأة:', error.message);
                    break;
                }
                case 'DELETE_REWARD': {
                    const { error } = await supabase.from('rewards').delete().eq('id', action.rewardId);
                    if (error) console.error('❌ فشل حذف المكافأة:', error.message);
                    break;
                }
                case 'BAN_CUSTOMER': {
                    await supabase.from('users').update({ is_suspended: true }).eq('phone', action.phone);
                    break;
                }
                case 'UNBAN_CUSTOMER': {
                    await supabase.from('users').update({ is_suspended: false }).eq('phone', action.phone);
                    break;
                }
                case 'DELETE_CUSTOMER': {
                    const { error } = await supabase.from('users').delete().eq('phone', action.phone);
                    if (error) console.error('❌ فشل حذف العميل:', error.message);
                    break;
                }
                case 'CLEAR_ORDERS':
                    await supabase.from('orders').delete().neq('id', '_none_');
                    break;
                case 'CLEAR_MESSAGES':
                    await supabase.from('messages').delete().neq('id', '_none_');
                    break;
                case 'CLEAR_REVIEWS':
                    await supabase.from('reviews').delete().neq('id', '_none_');
                    break;
                case 'CLEAR_CUSTOMERS':
                    await supabase.from('users').delete().neq('email', 'alharth465117@gmail.com');
                    break;
                case 'CLEAR_REWARDS':
                    await supabase.from('rewards').delete().neq('id', '_none_');
                    break;
                case 'CLEAR_PRODUCTS':
                    await supabase.from('products').delete().neq('id', '_none_');
                    break;
                case 'CLEAR_CATEGORIES':
                    await supabase.from('categories').delete().neq('id', '_none_');
                    break;
                case 'FACTORY_RESET':
                    await Promise.all([
                        supabase.from('products').delete().neq('id', '_none_'),
                        supabase.from('categories').delete().neq('id', '_none_'),
                        supabase.from('orders').delete().neq('id', '_none_'),
                        supabase.from('messages').delete().neq('id', '_none_'),
                        supabase.from('reviews').delete().neq('id', '_none_'),
                        supabase.from('users').delete().neq('email', 'alharth465117@gmail.com'),
                        supabase.from('discount_rules').delete().neq('id', '_none_'),
                        supabase.from('banners').delete().neq('id', '_none_'),
                        supabase.from('rewards').delete().neq('id', '_none_'),
                        supabase.from('settings').upsert(settingsToDb(defaultSettings))
                    ]);
                    localStorage.clear(); // مسح شامل لكل الكاش المحلي
                    break;
            }
        } catch (err) {
            console.warn('Supabase sync failed (General):', err);
        }
    }

    // ===== مراقبة ومزامنة المفضلة والسلة (الحساب) =====
    const prevFavs = useRef<string[]>([]);
    const prevCart = useRef<CartItem[]>([]);

    useEffect(() => {
        if (!user) return;

        // مزامنة المفضلة
        // رصد التغييرات الحقيقي ومزامنتها فقط إذا كان هناك مستخدم
        const syncFavs = async () => {
            if (!state.isDataInitialized) return; // منع التزامن قبل تحميل البيانات
            try {
                const added = state.favorites.filter(id => !prevFavs.current.includes(id));
                const removed = prevFavs.current.filter(id => !state.favorites.includes(id));

                if (added.length === 0 && removed.length === 0) return;

                // console.log(`☁️ Syncing Favorites: Added ${added.length}, Removed ${removed.length}`);

                for (const id of added) {
                    await supabase.from('user_favorites').upsert(
                        { user_id: user.uid, product_id: id },
                        { onConflict: 'user_id,product_id' }
                    );
                }
                for (const id of removed) {
                    await supabase.from('user_favorites').delete().eq('user_id', user.uid).eq('product_id', id);
                }
                prevFavs.current = [...state.favorites];
            } catch (e) {
                console.error("❌ Error syncing favorites:", e);
            }
        };

        // مزامنة السلة
        const syncCart = async () => {
            if (!state.isDataInitialized) return; // منع التزامن قبل تحميل البيانات
            try {
                // تحديث/إضافة
                for (const item of state.cart) {
                    const prev = prevCart.current.find(p => p.product.id === item.product.id);
                    if (!prev || prev.quantity !== item.quantity) {
                        await supabase.from('user_cart').upsert(
                            {
                                user_id: user.uid,
                                product_id: item.product.id,
                                quantity: item.quantity
                            },
                            { onConflict: 'user_id,product_id' }
                        );
                    }
                }
                // حذف
                for (const prev of prevCart.current) {
                    if (!state.cart.find(i => i.product.id === prev.product.id)) {
                        await supabase.from('user_cart').delete().eq('user_id', user.uid).eq('product_id', prev.product.id);
                    }
                }
                prevCart.current = [...state.cart];
            } catch (e) {
                console.error("❌ Error syncing cart:", e);
            }
        };

        syncFavs();
        syncCart();
    }, [state.favorites, state.cart, user]);

    const userDataLoaded = useRef<string | null>(null);

    // ===== تحميل بيانات المستخدم الخاصة عند تسجيل الدخول =====
    useEffect(() => {
        if (user) {
            const loadKey = `${user.uid}-${isAdmin}`;
            // منع التحميل المتكرر لنفس المستخدم
            if (userDataLoaded.current === loadKey) return;
            userDataLoaded.current = loadKey;

            const fetchUserData = async () => {
                // console.log('🚀 Starting fetchUserData for user:', user.uid, 'isAdmin:', isAdmin);
                const results: Partial<StoreState> = {};

                try {
                    const userPhone = userData?.phone || '';
                    const profileData = {
                        id: user.uid,
                        name: userData?.name || user.displayName || user.email?.split('@')[0] || 'عميل',
                        email: user.email,
                        phone: userPhone,
                        updated_at: new Date().toISOString()
                    };

                    // استخدام upsert بدلاً من insert/update لتجنب أخطاء 409
                    await supabase.from('users').upsert({
                        ...profileData,
                        role: isAdmin ? 'admin' : 'customer',
                        is_active: true,
                        is_suspended: false
                    }, { onConflict: 'id' });


                    // 1. جلب السلة والمفضلة
                    const [favsRes, cartRes] = await Promise.all([
                        supabase.from('user_favorites').select('product_id').eq('user_id', user.uid),
                        supabase.from('user_cart').select('product_id, quantity').eq('user_id', user.uid)
                    ]);

                    if (favsRes.data) {
                        const cloudFavs = favsRes.data.map((f: any) => f.product_id);
                        // عند تسجيل الدخول، نعتمد بيانات الكلاود للمستخدم الجديد كلياً
                        results.favorites = cloudFavs;
                        // تحديث المرجعية لمنع المزامنة العكسية غير الضرورية
                        prevFavs.current = cloudFavs;
                    }

                    if (cartRes.data) {
                        const cloudCart = cartRes.data.map((c: any) => {
                            const product = state.products.find(p => p.id === c.product_id);
                            return product ? { product, quantity: c.quantity } : null;
                        }).filter(Boolean) as CartItem[];

                        // نعتمد سلة الكلاود للمستخدم الجديد فقط
                        results.cart = cloudCart;
                        // تحديث المرجعية
                        prevCart.current = cloudCart;
                    }

                    // 2. جلب الطلبات والرسائل الخاصة
                    let ordersQuery = supabase.from('orders').select('*');
                    let messagesQuery = supabase.from('messages').select('*');

                    if (!isAdmin) {
                        const userPhone = userData?.phone;
                        if (userPhone) {
                            ordersQuery = ordersQuery.or(`user_id.eq."${user.uid}",customer_phone.eq."${userPhone}"`);
                            messagesQuery = messagesQuery.or(`user_id.eq."${user.uid}",contact_info.eq."${userPhone}"`);
                        } else {
                            ordersQuery = ordersQuery.eq('user_id', user.uid);
                            messagesQuery = messagesQuery.eq('user_id', user.uid);
                        }
                    }

                    const [ordersRes, messagesRes] = await Promise.all([ordersQuery, messagesQuery]);
                    if (ordersRes.data) results.orders = ordersRes.data.map(dbToOrder);
                    if (messagesRes.data) results.messages = messagesRes.data.map(dbToMessage);

                    // 3. لو كان أدمن، نجلب قائمة المستخدمين من الجدول الموحد
                    if (isAdmin) {
                        try {
                            const { data: allUsers, error: usersError } = await supabase
                                .from('users')
                                .select('*')
                                .order('created_at', { ascending: false });

                            if (!usersError && allUsers) {
                                results.customers = allUsers.map(u => ({
                                    ...dbToCustomer(u),
                                    role: u.role || 'customer'
                                }));
                                // console.log(`✅ Admin fetch: ${allUsers.length} users loaded`);
                            }
                        } catch (e) {
                            // console.error('❌ Error fetching users:', e);
                        }
                    }

                    // console.log('📤 Dispatching private user data load...', {
                    //     orders: results.orders?.length,
                    //     messages: results.messages?.length,
                    //     customers: results.customers?.length
                    // });

                    // تحديث الحالة مرة واحدة فقط بجميع البيانات المجلوبة
                    baseDispatch({ type: 'LOAD_STATE', state: results });
                } catch (err) {
                    console.warn('Error fetching private user data:', err);
                }
            };

            fetchUserData();
        } else if (userDataLoaded.current !== null) {
            // تنظيف البيانات الحساسة عند تسجيل الخروج
            userDataLoaded.current = null;
            prevFavs.current = [];
            prevCart.current = [];
            localStorage.removeItem('store-cart');
            localStorage.removeItem('store-favorites');
            // مسح الكوكيز المتعلقة بالهوية إذا وجدت بموثوقية
            try {
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            } catch (e) { console.error("Cookie clear error:", e); }
            baseDispatch({ type: 'LOGOUT' });
        }
    }, [user?.uid, isAdmin, state.products.length]);
    // ===== تحميل البيانات العامة والمشتركة =====
    useEffect(() => {
        if (supabaseInitialized.current) return;
        supabaseInitialized.current = true;

        // مسح الكاش القديم لمنع ظهور البيانات التجريبية
        const CACHE_VERSION = 'v3';
        const currentVersion = localStorage.getItem('store-cache-version');
        if (currentVersion !== CACHE_VERSION) {
            localStorage.removeItem('store-state-v2');
            localStorage.removeItem('store-cart');
            localStorage.removeItem('store-favorites');
            localStorage.setItem('store-cache-version', CACHE_VERSION);
            // console.log('🧹 تم مسح الكاش القديم');
        }

        loadFromSupabase();
    }, []);

    // ===== مراقبة التغييرات في الوقت الحقيقي (مع الفلترة الأمنية) =====
    useEffect(() => {
        const subscription = supabase
            .channel('store-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
                if (payload.new) baseDispatch({ type: 'UPDATE_SETTINGS', settings: dbToSettings(payload.new) });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
                supabase.from('banners').select('*').then(({ data }) => {
                    if (data) baseDispatch({ type: 'LOAD_STATE', state: { banners: data.map(dbToBanner) } });
                });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'discount_rules' }, () => {
                supabase.from('discount_rules').select('*').then(({ data }) => {
                    if (data) baseDispatch({ type: 'LOAD_STATE', state: { discountRules: data.map(dbToDiscount) } });
                });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                const msg = dbToMessage(payload.new || payload.old);
                // فلترة: لو كان أدمن يرى الكل، لو كان مستخدم يرى رسائله فقط
                if (isAdmin || (user && msg.userId === user.uid)) {
                    if (payload.eventType === 'INSERT') baseDispatch({ type: 'ADD_MESSAGE', message: msg });
                    else if (payload.eventType === 'UPDATE') baseDispatch({ type: 'MARK_MESSAGE_READ', messageId: msg.id });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                const order = dbToOrder(payload.new || payload.old);
                // فلترة: لو كان أدمن يرى الكل، لو كان مستخدم يرى طلباته فقط
                if (isAdmin || (user && order.userId === user.uid)) {
                    if (payload.eventType === 'INSERT') baseDispatch({ type: 'ADD_ORDER', order });
                    else if (payload.eventType === 'UPDATE') baseDispatch({ type: 'UPDATE_ORDER_STATUS', orderId: order.id, status: order.status });
                    else if (payload.eventType === 'DELETE') baseDispatch({ type: 'DELETE_ORDER', orderId: order.id });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
                supabase.from('rewards').select('*').then(({ data }) => {
                    if (data) baseDispatch({ type: 'LOAD_STATE', state: { rewards: data.map(dbToReward) } });
                });
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, isAdmin]);

    async function loadFromSupabase() {
        try {
            // console.log('📡 جاري جلب البيانات العامة...');
            const tables = ['categories', 'products', 'reviews', 'discount_rules', 'settings', 'banners', 'rewards'];

            const loadedState: Partial<StoreState> = {};
            const promises = tables.map(async (table) => {
                const fetchPromise = (async () => {
                    try {
                        const { data, error } = await supabase.from(table).select('*');
                        if (error) return { table, data: null, error };
                        return { table, data, error: null };
                    } catch (e) {
                        return { table, data: null, error: e };
                    }
                })();

                const timeoutPromise = new Promise((resolve) =>
                    setTimeout(() => resolve({ table, data: null, error: 'TIMEOUT' }), 15000)
                );

                return Promise.race([fetchPromise, timeoutPromise]) as Promise<any>;
            });

            const results = await Promise.all(promises);

            results.forEach(({ table, data, error }) => {
                if (error) {
                    console.warn(`⚠️ Warning fetching ${table}:`, error);
                    return;
                }
                if (!data) return;
                switch (table) {
                    case 'categories': loadedState.categories = data.map(dbToCategory); break;
                    case 'products': loadedState.products = data.map(dbToProduct); break;
                    case 'orders': loadedState.orders = data.map(dbToOrder); break;
                    case 'messages': loadedState.messages = data.map(dbToMessage); break;
                    case 'reviews': loadedState.reviews = data.map(dbToReview); break;
                    case 'discount_rules': loadedState.discountRules = data.map(dbToDiscount); break;
                    case 'settings':
                        if (data.length > 0) {
                            const mainSettings = data.find((r: any) => r.id === 1) || data[0];
                            loadedState.settings = dbToSettings(mainSettings);
                        }
                        break;
                    case 'banners': loadedState.banners = data.map(dbToBanner); break;
                    case 'rewards': loadedState.rewards = data.map(dbToReward); break;
                }
            });

            // دمج الحالات السابقة مع الجديدة
            const hasRemoteData = (loadedState.products?.length || 0) > 0 ||
                (loadedState.categories?.length || 0) > 0 ||
                (loadedState.discountRules?.length || 0) > 0 ||
                !!loadedState.settings;

            // محاولة الدمج مع البيانات المحلية للسلة والمفضلة
            try {
                const localCart = localStorage.getItem('store-cart');
                const localFavs = localStorage.getItem('store-favorites');
                if (localCart) loadedState.cart = JSON.parse(localCart);
                if (localFavs) loadedState.favorites = JSON.parse(localFavs);
            } catch (e) { }

            // دمج مع localStorage في حال وجود بيانات أحدث أو مفقودة في السيرفر
            try {
                const saved = localStorage.getItem('store-state-v2');
                if (saved) {
                    const localParsed = JSON.parse(saved);
                    // إذا كان السيرفر لا يحتوي على تخفيضات ولكن محلياً توجد، استخدم المحلية مؤقتاً
                    if ((!loadedState.discountRules || loadedState.discountRules.length === 0) && localParsed.discountRules?.length > 0) {
                        loadedState.discountRules = localParsed.discountRules;
                        // console.log('♻️ Recovered discount rules from LocalStorage');
                    }
                    if ((!loadedState.rewards || loadedState.rewards.length === 0) && localParsed.rewards?.length > 0) {
                        loadedState.rewards = localParsed.rewards;
                    }
                }
            } catch (e) { }

            // الإشارة بأن البيانات تم تحميلها بنجاح لمنع الكتابة فوقها ببيانات فارغة
            loadedState.isDataInitialized = true;

            baseDispatch({ type: 'LOAD_STATE', state: loadedState });
            // seedSupabase(); // تم إيقاف التعبئة التلقائية لضمان بقاء المتجر فارغاً بناءً على طلبك
        } catch (err) {
            // console.error('❌ Error in loadFromSupabase:', err);
            baseDispatch({ type: 'LOAD_STATE', state: { isDataInitialized: true } });
            loadFromLocalStorage();
        }
    }

    async function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('store-state-v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                baseDispatch({ type: 'LOAD_STATE', state: { ...parsed, isDataInitialized: true } });
            } else {
                baseDispatch({ type: 'LOAD_STATE', state: { isDataInitialized: true } });
            }
        } catch (e) { }
    }

    async function seedSupabase() {
        try {
            const [{ count: catCount }, { count: prodCount }, { count: settCount }] = await Promise.all([
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('settings').select('*', { count: 'exact', head: true })
            ]);

            if (catCount === 0) {
                for (const cat of defaultCategories) await supabase.from('categories').upsert(categoryToDb(cat));
            }
            if (prodCount === 0) {
                for (const prod of defaultProducts) await supabase.from('products').upsert(productToDb(prod));
            }
            if (settCount === 0) {
                await supabase.from('settings').upsert(settingsToDb(defaultSettings));
            }
        } catch (err) { }
    }

    useEffect(() => {
        if (!state.isDataInitialized) return; // منع المسح الأولي
        try {
            localStorage.setItem('store-cart', JSON.stringify(state.cart));
            localStorage.setItem('store-favorites', JSON.stringify(state.favorites));
        } catch (e) { }
    }, [state.cart, state.favorites, state.isDataInitialized]);

    useEffect(() => {
        if (!state.isDataInitialized) return; // منع المسح الأولي للبيانات المحلية
        try {
            const toSave = {
                products: state.products, categories: state.categories,
                discountRules: state.discountRules,
                settings: state.settings,
                customers: state.customers,
                rewards: state.rewards,
                banners: state.banners,
            };
            localStorage.setItem('store-state-v2', JSON.stringify(toSave));
        } catch (e) { }
    }, [state.products, state.categories, state.discountRules, state.settings, state.customers, state.rewards, state.banners, state.isDataInitialized]);

    useEffect(() => {
        if (state.settings.primaryColor) document.documentElement.style.setProperty('--primary', state.settings.primaryColor);
        if (state.settings.accentColor) document.documentElement.style.setProperty('--accent', state.settings.accentColor);
        document.title = state.settings.storeName || themeConfig.storeName;

        // تحديث أيقونة الموقع (Favicon) ديناميكياً لتظهر في شريط العنوان
        if (state.settings.storeLogo) {
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = state.settings.storeLogo;
            // دعم الأيقونة لنظام أبل أيضاً
            let appleIcon = document.querySelector("link[rel*='apple-touch-icon']") as HTMLLinkElement;
            if (!appleIcon) {
                appleIcon = document.createElement('link');
                appleIcon.rel = 'apple-touch-icon';
                document.head.appendChild(appleIcon);
            }
            appleIcon.href = state.settings.storeLogo;
        }
    }, [state.settings]);

    const cartTotal = state.cart.reduce((sum, item) => {
        const finalPrice = getFinalPriceCalc(item.product, state.discountRules);
        return sum + finalPrice * item.quantity;
    }, 0);

    const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    function getAppliedDiscount(product: Product): number {
        if (product.discount) return product.discount;
        const now = Date.now();
        const applicableRules = state.discountRules.filter(rule => {
            if (!rule.active) return false;
            if (rule.startDate && now < rule.startDate) return false;
            if (rule.endDate && now > rule.endDate) return false;
            if (rule.categoryId && rule.categoryId !== product.categoryId) return false;
            if (rule.productIds && !rule.productIds.includes(product.id)) return false;
            return true;
        });
        if (applicableRules.length === 0) return 0;
        return Math.max(...applicableRules.map(r => r.type === 'percentage' ? r.value : (r.value / product.price) * 100));
    }

    function getFinalPrice(product: Product): number {
        return getFinalPriceCalc(product, state.discountRules);
    }

    return (
        <StoreContext.Provider value={{ state, dispatch, cartTotal, cartCount, getAppliedDiscount, getFinalPrice }}>
            {children}
        </StoreContext.Provider>
    );
}
