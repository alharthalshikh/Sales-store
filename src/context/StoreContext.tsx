// ============================================================
// 🔄 إدارة حالة المتجر الكاملة + مزامنة Firestore
// المنتجات، الأقسام، السلة، المفضلة، الطلبات، الرسائل، العملاء، الإعدادات
// ============================================================
import React, { useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import { CartItem, Product, Order, Message, Banner, Customer, LoyaltyReward, Category } from '../types';
import { products as defaultProducts, categories as defaultCategories } from '../data/products';
import themeConfig from '../config/theme';
import { db } from '../lib/firebase';
import {
    collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
    onSnapshot, query, where, orderBy, writeBatch
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../components/ToastContainer';

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
            const variantId = action.selectedVariant?.id;
            const existing = state.cart.find(item =>
                item.product.id === action.product.id &&
                (item.selectedVariant?.id || undefined) === (variantId || undefined)
            );
            if (existing) {
                return {
                    ...state, cart: state.cart.map(item =>
                        item.product.id === action.product.id && (item.selectedVariant?.id || undefined) === (variantId || undefined)
                            ? { ...item, quantity: item.quantity + (action.quantity || 1) }
                            : item
                    )
                };
            }
            return { ...state, cart: [...state.cart, { product: action.product, quantity: action.quantity || 1, selectedVariant: action.selectedVariant }] };
        }
        case 'REMOVE_FROM_CART':
            return { ...state, cart: state.cart.filter(item => !(item.product.id === action.productId && (item.selectedVariant?.id || undefined) === (action.variantId || undefined))) };
        case 'UPDATE_QUANTITY': {
            if (action.quantity <= 0) return { ...state, cart: state.cart.filter(item => !(item.product.id === action.productId && (item.selectedVariant?.id || undefined) === (action.variantId || undefined))) };
            return {
                ...state,
                cart: state.cart.map(item => {
                    if (item.product.id === action.productId && (item.selectedVariant?.id || undefined) === (action.variantId || undefined)) {
                        const maxQty = item.selectedVariant?.stockQuantity ?? item.product.stockQuantity ?? 999;
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
        case 'ADD_MESSAGE': {
            if (state.messages.find(m => m.id === action.message.id)) return state;
            const updatedMessages = [action.message, ...state.messages];
            localStorage.setItem('cached-messages', JSON.stringify(updatedMessages.slice(0, 50)));
            return { ...state, messages: updatedMessages };
        }
        case 'MARK_MESSAGE_READ': {
            const updatedMessages = state.messages.map(m => m.id === action.messageId ? { ...m, read: true, status: 'read' as const } : m);
            localStorage.setItem('cached-messages', JSON.stringify(updatedMessages.slice(0, 50)));
            return { ...state, messages: updatedMessages };
        }
        case 'DELETE_MESSAGE': {
            const updatedMessages = state.messages.filter(m => m.id !== action.messageId);
            localStorage.setItem('cached-messages', JSON.stringify(updatedMessages.slice(0, 50)));
            return { ...state, messages: updatedMessages };
        }
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
                const deductionsForThisProduct = action.items.filter(item => item.productId === p.id);
                if (deductionsForThisProduct.length === 0) return p;

                let newProduct = { ...p };
                deductionsForThisProduct.forEach(deduction => {
                    if (deduction.variantId && newProduct.variants) {
                        newProduct.variants = newProduct.variants.map(v =>
                            v.id === deduction.variantId
                                ? { ...v, stockQuantity: Math.max(0, v.stockQuantity - deduction.quantity) }
                                : v
                        );
                    } else {
                        const newQty = Math.max(0, (newProduct.stockQuantity || 0) - deduction.quantity);
                        newProduct.stockQuantity = newQty;
                        newProduct.inStock = newQty > 0;
                    }
                });
                return newProduct;
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
            const newState = {
                ...state,
                ...Object.fromEntries(
                    Object.entries(action.state).filter(([_, v]) => v !== undefined)
                ),
                settings: action.state.settings || state.settings,
                isDataInitialized: action.state.isDataInitialized ?? state.isDataInitialized
            };

            // 🧠 دمج الرسائل بذكاء: الحفاظ على الرسائل المحلية التي لم تُرفع بعد
            if (action.state.messages) {
                const incomingIds = new Set(action.state.messages.map((m: any) => m.id));
                const localOnly = state.messages.filter(m => !incomingIds.has(m.id));
                newState.messages = [...action.state.messages, ...localOnly].sort((a, b) => b.createdAt - a.createdAt);
            }

            // 🧠 دمج الطلبات بذكاء: الحفاظ على الطلبات المحلية
            if (action.state.orders) {
                const incomingOrderIds = new Set(action.state.orders.map((o: any) => o.id));
                const localOrdersOnly = state.orders.filter(o => !incomingOrderIds.has(o.id));
                newState.orders = [...action.state.orders, ...localOrdersOnly].sort((a, b) => b.createdAt - a.createdAt);
            }

            // حفظ في localStorage للاحتياط (باستثناء البيانات الضخمة)
            localStorage.setItem('cached-messages', JSON.stringify(newState.messages.slice(0, 50)));
            return newState;
        }
        default:
            return state;
    }
}

export function StoreProvider({ children }: { children: ReactNode }) {
    const { user, isAdmin, userData } = useAuth();
    const [state, baseDispatch] = useReducer(storeReducer, initialState);
    const stateRef = useRef(state);
    stateRef.current = state;
    const firestoreInitialized = useRef(false);

    // ===== Dispatch مع مزامنة Firestore =====
    const dispatch = useCallback((action: StoreAction) => {
        baseDispatch(action);
        // نمرر الحالة الحالية من الـ ref لضمان عدم اعتماد useCallback على state مباشرة
        syncToFirestore(action, stateRef.current).catch(() => { });
    }, [user]); // الآن لا يعتمد على state

    // ===== دالة مساعدة لحذف كل مستندات مجموعة =====
    async function clearCollection(colName: string) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }

    // ===== المزامنة مع Firestore (البيانات العامة) =====
    async function syncToFirestore(action: StoreAction, currentState: StoreState) {
        if (!user) return;
        const isAdmin = (action as any).isAdmin || user.email === 'alharth465117@gmail.com';
        
        try {
            switch (action.type) {
                case 'ADD_PRODUCT':
                case 'UPDATE_PRODUCT':
                    await setDoc(doc(db, 'products', action.product.id), productToDb(action.product));
                    break;
                case 'DELETE_PRODUCT':
                    await deleteDoc(doc(db, 'products', action.productId));
                    break;
                case 'ADD_CATEGORY':
                case 'UPDATE_CATEGORY':
                    await setDoc(doc(db, 'categories', action.category.id), categoryToDb(action.category));
                    break;
                case 'DELETE_CATEGORY':
                    await deleteDoc(doc(db, 'categories', action.categoryId));
                    break;
                case 'ADD_ORDER':
                    await setDoc(doc(db, 'orders', action.order.id), orderToDb(action.order));
                    break;
                case 'UPDATE_ORDER_STATUS':
                    await updateDoc(doc(db, 'orders', action.orderId), { status: action.status });
                    if (action.status === 'delivered') {
                        const order = currentState.orders.find(o => o.id === action.orderId);
                        if (order && order.status !== 'delivered' && order.items.length > 0) {
                            const deductionItems = order.items.map(item => ({
                                productId: item.product.id,
                                quantity: item.quantity,
                                variantId: item.selectedVariant?.id
                            }));
                            baseDispatch({ type: 'DEDUCT_STOCK', items: deductionItems });
                            for (const item of deductionItems) {
                                const product = currentState.products.find(p => p.id === item.productId);
                                if (product) {
                                    if (item.variantId && product.variants) {
                                        const updatedVariants = product.variants.map(v =>
                                            v.id === item.variantId
                                                ? { ...v, stockQuantity: Math.max(0, v.stockQuantity - item.quantity) }
                                                : v
                                        );
                                        await updateDoc(doc(db, 'products', item.productId), { variants: updatedVariants });
                                    } else {
                                        const newQty = Math.max(0, (product.stockQuantity || 0) - item.quantity);
                                        await updateDoc(doc(db, 'products', item.productId), {
                                            stock_quantity: newQty, in_stock: newQty > 0,
                                        });
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 'DEDUCT_STOCK':
                    for (const item of action.items) {
                        const product = currentState.products.find(p => p.id === item.productId);
                        if (product) {
                            if (item.variantId && product.variants) {
                                const updatedVariants = product.variants.map(v =>
                                    v.id === item.variantId
                                        ? { ...v, stockQuantity: Math.max(0, v.stockQuantity - item.quantity) }
                                        : v
                                );
                                await updateDoc(doc(db, 'products', item.productId), { variants: updatedVariants });
                            } else {
                                const newQty = Math.max(0, (product.stockQuantity || 0) - item.quantity);
                                await updateDoc(doc(db, 'products', item.productId), {
                                    stock_quantity: newQty, in_stock: newQty > 0,
                                });
                            }
                        }
                    }
                    break;
                case 'DELETE_ORDER':
                    await deleteDoc(doc(db, 'orders', action.orderId));
                    break;
                case 'ADD_MESSAGE':
                    await setDoc(doc(db, 'messages', action.message.id), messageToDb(action.message));
                    break;
                case 'MARK_MESSAGE_READ':
                    await updateDoc(doc(db, 'messages', action.messageId), { status: 'read' });
                    break;
                case 'DELETE_MESSAGE':
                    if (isAdmin) {
                        // المدير يحذف نهائياً من القاعدة
                        await deleteDoc(doc(db, 'messages', action.messageId));
                    } else {
                        // المستخدم يخفيها من عنده فقط (تحديث حقل في القاعدة)
                        await updateDoc(doc(db, 'messages', action.messageId), { deleted_by_user: true });
                    }
                    break;
                case 'CLEAR_USER_MESSAGES': {
                    const q = action.userId
                        ? query(collection(db, 'messages'), where('user_id', '==', action.userId))
                        : query(collection(db, 'messages'), where('contact_info', '==', action.phone));
                    const snap = await getDocs(q);
                    const batch = writeBatch(db);
                    snap.docs.forEach(d => {
                        if (isAdmin) {
                            batch.delete(d.ref); // حذف نهائي للمدير
                        } else {
                            batch.update(d.ref, { deleted_by_user: true }); // إخفاء للمستخدم
                        }
                    });
                    await batch.commit();
                    break;
                }
                case 'CLEAR_MESSAGES': {
                    if (isAdmin) await clearCollection('messages');
                    break;
                }
                case 'ADD_REVIEW':
                    await setDoc(doc(db, 'reviews', action.review.id), reviewToDb(action.review));
                    break;
                case 'DELETE_REVIEW':
                    await deleteDoc(doc(db, 'reviews', action.reviewId));
                    break;
                case 'ADD_DISCOUNT_RULE':
                case 'UPDATE_DISCOUNT_RULE':
                    await setDoc(doc(db, 'discount_rules', action.rule.id), discountToDb(action.rule));
                    break;
                case 'REMOVE_DISCOUNT_RULE':
                    await deleteDoc(doc(db, 'discount_rules', action.ruleId));
                    break;
                case 'TOGGLE_DISCOUNT_RULE': {
                    const currentRule = currentState.discountRules.find(r => r.id === action.ruleId);
                    if (currentRule) {
                        await updateDoc(doc(db, 'discount_rules', action.ruleId), { active: !currentRule.active });
                    }
                    break;
                }
                case 'ADD_CUSTOMER': {
                    const customer = action.customer;
                    await setDoc(doc(db, 'users', customer.id), {
                        email: customer.email || '', name: customer.name || 'عميل جديد',
                        phone: customer.phone || '', role: 'customer',
                        is_active: true, is_suspended: false,
                        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                    }, { merge: true });
                    break;
                }
                case 'UPDATE_SETTINGS': {
                    const dbSettings = settingsToDb({ ...currentState.settings, ...action.settings });
                    await setDoc(doc(db, 'settings', 'main'), dbSettings);
                    break;
                }
                case 'ADD_BANNER':
                case 'UPDATE_BANNER':
                    await setDoc(doc(db, 'banners', action.banner.id), bannerToDb(action.banner));
                    break;
                case 'DELETE_BANNER':
                    await deleteDoc(doc(db, 'banners', action.bannerId));
                    break;
                case 'ADD_REWARD':
                case 'UPDATE_REWARD':
                    await setDoc(doc(db, 'rewards', action.reward.id), rewardToDb(action.reward));
                    break;
                case 'DELETE_REWARD':
                    await deleteDoc(doc(db, 'rewards', action.rewardId));
                    break;
                case 'BAN_CUSTOMER': {
                    const usersSnap = await getDocs(query(collection(db, 'users'), where('phone', '==', action.phone)));
                    for (const d of usersSnap.docs) await updateDoc(d.ref, { is_suspended: true });
                    break;
                }
                case 'UNBAN_CUSTOMER': {
                    const usersSnap = await getDocs(query(collection(db, 'users'), where('phone', '==', action.phone)));
                    for (const d of usersSnap.docs) await updateDoc(d.ref, { is_suspended: false });
                    break;
                }
                case 'DELETE_CUSTOMER': {
                    const usersSnap = await getDocs(query(collection(db, 'users'), where('phone', '==', action.phone)));
                    for (const d of usersSnap.docs) await deleteDoc(d.ref);
                    break;
                }
                case 'CLEAR_ORDERS': await clearCollection('orders'); break;
                case 'CLEAR_REVIEWS': await clearCollection('reviews'); break;
                case 'CLEAR_CUSTOMERS': {
                    const snap = await getDocs(collection(db, 'users'));
                    const batch = writeBatch(db);
                    snap.docs.forEach(d => {
                        if (d.data().email !== 'alharth465117@gmail.com') batch.delete(d.ref);
                    });
                    await batch.commit();
                    break;
                }
                case 'CLEAR_REWARDS': await clearCollection('rewards'); break;
                case 'CLEAR_PRODUCTS': await clearCollection('products'); break;
                case 'CLEAR_CATEGORIES': await clearCollection('categories'); break;
                case 'FACTORY_RESET':
                    await Promise.all([
                        clearCollection('products'), clearCollection('categories'),
                        clearCollection('orders'), clearCollection('messages'),
                        clearCollection('reviews'), clearCollection('discount_rules'),
                        clearCollection('banners'), clearCollection('rewards'),
                    ]);
                    // حذف المستخدمين ماعدا المدير
                    const usSnap = await getDocs(collection(db, 'users'));
                    const fBatch = writeBatch(db);
                    usSnap.docs.forEach(d => {
                        if (d.data().email !== 'alharth465117@gmail.com') fBatch.delete(d.ref);
                    });
                    await fBatch.commit();
                    await setDoc(doc(db, 'settings', 'main'), settingsToDb(defaultSettings));
                    localStorage.clear();
                    break;
            }
        } catch (err: any) {
            console.error('🔥 Error syncing to Firestore:', err);
            if (err.code === 'permission-denied') {
                showToast('خطأ: ليس لديك صلاحية لحفظ هذه البيانات 🚫');
            } else {
                showToast(`خطأ في المزامنة: ${err.message || 'حدث خطأ غير معروف'}`);
            }
        }
    }

    // ===== مراقبة ومزامنة المفضلة والسلة (الحساب) =====
    const prevFavs = useRef<string[]>([]);
    const prevCart = useRef<CartItem[]>([]);

    useEffect(() => {
        if (!user) return;

        // مزامنة المفضلة
        const syncFavs = async () => {
            if (!state.isDataInitialized) return;
            try {
                const added = state.favorites.filter(id => !prevFavs.current.includes(id));
                const removed = prevFavs.current.filter(id => !state.favorites.includes(id));
                if (added.length === 0 && removed.length === 0) return;

                for (const id of added) {
                    await setDoc(doc(db, 'user_favorites', `${user.uid}_${id}`), {
                        user_id: user.uid, product_id: id
                    });
                }
                for (const id of removed) {
                    await deleteDoc(doc(db, 'user_favorites', `${user.uid}_${id}`));
                }
                prevFavs.current = [...state.favorites];
            } catch (e) { }
        };

        // مزامنة السلة
        const syncCart = async () => {
            if (!state.isDataInitialized) return;
            try {
                for (const item of state.cart) {
                    const prev = prevCart.current.find(p => p.product.id === item.product.id);
                    if (!prev || prev.quantity !== item.quantity) {
                        await setDoc(doc(db, 'user_cart', `${user.uid}_${item.product.id}`), {
                            user_id: user.uid, product_id: item.product.id, quantity: item.quantity
                        });
                    }
                }
                for (const prev of prevCart.current) {
                    if (!state.cart.find(i => i.product.id === prev.product.id)) {
                        await deleteDoc(doc(db, 'user_cart', `${user.uid}_${prev.product.id}`));
                    }
                }
                prevCart.current = [...state.cart];
            } catch (e) { }
        };

        syncFavs();
        syncCart();
    }, [state.favorites, state.cart, user]);

    const userDataLoaded = useRef<string | null>(null);

    // ===== تحميل بيانات المستخدم الخاصة عند تسجيل الدخول =====
    useEffect(() => {
        if (user) {
            const loadKey = `${user.uid}-${isAdmin}`;
            if (userDataLoaded.current === loadKey) return;
            userDataLoaded.current = loadKey;

            const fetchUserData = async () => {
                const results: Partial<StoreState> = {};
                try {
                    // حفظ/تحديث بيانات المستخدم في Firestore
                    await setDoc(doc(db, 'users', user.uid), {
                        name: userData?.name || user.displayName || user.email?.split('@')[0] || 'عميل',
                        email: user.email || '',
                        phone: userData?.phone || '',
                        role: isAdmin ? 'admin' : 'customer',
                        is_active: true,
                        is_suspended: false,
                        updated_at: new Date().toISOString()
                    }, { merge: true });

                    // 1. جلب المفضلة والسلة من Firestore
                    const [favsSnap, cartSnap] = await Promise.all([
                        getDocs(query(collection(db, 'user_favorites'), where('user_id', '==', user.uid))),
                        getDocs(query(collection(db, 'user_cart'), where('user_id', '==', user.uid)))
                    ]);

                    const cloudFavs = favsSnap.docs.map(d => d.data().product_id);
                    results.favorites = cloudFavs;
                    prevFavs.current = cloudFavs;

                    const cloudCart = cartSnap.docs.map(d => {
                        const data = d.data();
                        const product = state.products.find(p => p.id === data.product_id);
                        return product ? { product, quantity: data.quantity } : null;
                    }).filter(Boolean) as CartItem[];
                    results.cart = cloudCart;
                    prevCart.current = cloudCart;

                    // 2. جلب الطلبات والرسائل
                    if (isAdmin) {
                        const [ordersSnap, msgsSnap] = await Promise.all([
                            getDocs(collection(db, 'orders')),
                            getDocs(collection(db, 'messages'))
                        ]);
                        results.orders = ordersSnap.docs.map(d => dbToOrder({ ...d.data(), id: d.id }));
                        results.messages = msgsSnap.docs.map(d => dbToMessage({ ...d.data(), id: d.id }));
                    } else {
                        // المستخدم العادي: جلب طلباته ورسائله فقط
                        const ordersSnap = await getDocs(collection(db, 'orders'));
                        const msgsSnap = await getDocs(collection(db, 'messages'));
                        const userPhone = userData?.phone;
                        results.orders = ordersSnap.docs
                            .map(d => dbToOrder({ ...d.data(), id: d.id }))
                            .filter(o => o.userId === user.uid || (userPhone && o.customerPhone === userPhone));
                        results.messages = msgsSnap.docs
                            .map(d => dbToMessage({ ...d.data(), id: d.id }))
                            .filter(m => m.userId === user.uid || (userPhone && m.senderPhone === userPhone));
                    }

                    // 3. لو أدمن، نجلب قائمة المستخدمين
                    if (isAdmin) {
                        const usersSnap = await getDocs(collection(db, 'users'));
                        results.customers = usersSnap.docs.map(d => ({
                            ...dbToCustomer({ ...d.data(), id: d.id }),
                            role: d.data().role || 'customer'
                        }));
                    }

                    baseDispatch({ type: 'LOAD_STATE', state: results });
                } catch (err) {
                    console.error('❌ Error in fetchUserData:', err);
                }
            };

            fetchUserData();
        } else if (userDataLoaded.current !== null) {
            userDataLoaded.current = null;
            prevFavs.current = [];
            prevCart.current = [];
            localStorage.removeItem('store-cart');
            localStorage.removeItem('store-favorites');
            try {
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            } catch (e) { }
            baseDispatch({ type: 'LOGOUT' });
        }
    }, [user?.uid, isAdmin, state.products.length]);
    // ===== تحميل البيانات العامة والمشتركة =====
    useEffect(() => {
        if (firestoreInitialized.current) return;
        firestoreInitialized.current = true;

        // مسح الكاش القديم
        const CACHE_VERSION = 'v5-firestore';
        const currentVersion = localStorage.getItem('store-cache-version');
        if (currentVersion !== CACHE_VERSION) {
            localStorage.removeItem('store-state-v2');
            localStorage.removeItem('store-cart');
            localStorage.removeItem('store-favorites');
            localStorage.setItem('store-cache-version', CACHE_VERSION);
        }

        // تحميل الكاش أولاً وتفعيل الموقع فوراً إذا وُجد
        const hasCachedData = loadCachedDataFirst();
        if (hasCachedData) {
            // إذا وُجد كاش محلي، نُظهر الموقع فوراً ونحمّل Firebase في الخلفية
            baseDispatch({ type: 'LOAD_STATE', state: { isDataInitialized: true } });
        }

        // تحميل من Firebase في الخلفية (أو كأساسي إذا لم يوجد كاش)
        loadFromFirestore();

        // ⏱️ حماية: إذا لم يتم التهيئة خلال 8 ثواني، نُظهر الموقع بأي بيانات متوفرة
        const safetyTimeout = setTimeout(() => {
            if (!stateRef.current.isDataInitialized) {
                console.warn('⏱️ Firestore timeout - initializing with available data');
                baseDispatch({ type: 'LOAD_STATE', state: { isDataInitialized: true } });
            }
        }, 8000);

        return () => clearTimeout(safetyTimeout);
    }, []);

    // ===== مراقبة التغييرات في الوقت الحقيقي عبر Firestore onSnapshot =====
    useEffect(() => {
        const unsubscribers: (() => void)[] = [];

        // مراقبة الإعدادات
        unsubscribers.push(onSnapshot(doc(db, 'settings', 'main'), (snap) => {
            if (snap.exists()) {
                baseDispatch({ type: 'UPDATE_SETTINGS', settings: dbToSettings(snap.data()) });
            }
        }));

        // مراقبة البانرات
        unsubscribers.push(onSnapshot(collection(db, 'banners'), (snap) => {
            const banners = snap.docs.map(d => dbToBanner({ ...d.data(), id: d.id }));
            baseDispatch({ type: 'LOAD_STATE', state: { banners } });
        }));

        // مراقبة قواعد الخصم
        unsubscribers.push(onSnapshot(collection(db, 'discount_rules'), (snap) => {
            const discountRules = snap.docs.map(d => dbToDiscount({ ...d.data(), id: d.id }));
            baseDispatch({ type: 'LOAD_STATE', state: { discountRules } });
        }));

        // مراقبة المكافآت
        unsubscribers.push(onSnapshot(collection(db, 'rewards'), (snap) => {
            const rewards = snap.docs.map(d => dbToReward({ ...d.data(), id: d.id }));
            baseDispatch({ type: 'LOAD_STATE', state: { rewards } });
        }));

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);

    // ===== مراقبة البيانات الخاصة (المستخدمون، الطلبات، الرسائل) =====
    useEffect(() => {
        if (!user) return;
        const unsubscribers: (() => void)[] = [];

        if (isAdmin) {
            // الأدمن يراقب كل المستخدمين والطلبات والرسائل
            unsubscribers.push(onSnapshot(collection(db, 'users'), (snap) => {
                const customers = snap.docs.map(d => ({
                    ...dbToCustomer({ ...d.data(), id: d.id }),
                    role: d.data().role || 'customer'
                }));
                baseDispatch({ type: 'LOAD_STATE', state: { customers } });
            }));

            unsubscribers.push(onSnapshot(collection(db, 'orders'), (snap) => {
                const orders = snap.docs.map(d => dbToOrder({ ...d.data(), id: d.id }));
                baseDispatch({ type: 'LOAD_STATE', state: { orders } });
            }));
        } else {
            // للمستخدم العادي: مراقبة طلباته فقط
            unsubscribers.push(onSnapshot(collection(db, 'orders'), (snap) => {
                const userPhone = userData?.phone;
                const orders = snap.docs
                    .map(d => dbToOrder({ ...d.data(), id: d.id }))
                    .filter(o => o.userId === user.uid || (userPhone && o.customerPhone === userPhone));
                baseDispatch({ type: 'LOAD_STATE', state: { orders } });
            }));
        }

        // 🟢 مراقب الرسائل الموحد (للأعضاء والزوار والأدمن)
        // 🟢 مزامنة المفضلة والسلة
        unsubscribers.push(onSnapshot(query(collection(db, 'user_favorites'), where('user_id', '==', user.uid)), (snap) => {
            const cloudFavs = snap.docs.map(d => d.data().product_id);
            prevFavs.current = cloudFavs;
            baseDispatch({ type: 'LOAD_STATE', state: { favorites: cloudFavs } });
        }));

        unsubscribers.push(onSnapshot(query(collection(db, 'user_cart'), where('user_id', '==', user.uid)), (snap) => {
            const cloudCart = snap.docs.map(d => {
                const data = d.data();
                const product = state.products.find(p => p.id === data.product_id);
                return product ? { product, quantity: data.quantity } : null;
            }).filter(Boolean) as CartItem[];
            prevCart.current = cloudCart;
            baseDispatch({ type: 'LOAD_STATE', state: { cart: cloudCart } });
        }));

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user?.uid, isAdmin, userData?.phone, state.products.length]);

    // 🟢 مراقب الرسائل الموحد (للأعضاء والزوار والأدمن)
    useEffect(() => {
        // إذا لم يتم تهيئة بيانات المستخدم بعد، ننتظر قليلاً لتجنب الفلترة الخاطئة
        const savedName = localStorage.getItem('chat-sender-name');
        const savedPhone = localStorage.getItem('chat-sender-phone');

        const unsub = onSnapshot(collection(db, 'messages'),
            (snap) => {
                const currentUserId = user?.uid;
                const currentPhone = userData?.phone || savedPhone;
                const currentEmail = user?.email || userData?.email;
                const currentName = userData?.name || user?.displayName || savedName;

                const messages = snap.docs
                    .map(d => dbToMessage({ ...d.data(), id: d.id }))
                    .filter(m => {
                        // إذا كنا أدمن، نظهر كل شيء
                        if (isAdmin) return true;

                        // إذا لم نكن متأكدين بعد من الحالة (قيد التحميل)، لا نحذف الرسائل من الحالة المحلية
                        // لكن هنا سنطبق فلترة المستخدم العادي
                        if (m.deletedByUser) return false;

                        const matchesId = currentUserId && m.userId === currentUserId;
                        const matchesPhone = currentPhone && m.senderPhone === currentPhone;
                        const matchesEmail = (currentPhone && m.senderPhone === currentPhone) || (currentEmail && m.senderPhone === currentEmail);
                        const matchesName = currentName && m.senderName === currentName;

                        return matchesId || matchesPhone || matchesEmail || matchesName;
                    });
                baseDispatch({ type: 'LOAD_STATE', state: { messages } });
            },
            (error) => {
                console.error('🔥 Firestore Monitor Error:', error);
            }
        );

        return () => unsub();
    }, [user?.uid, isAdmin, userData?.phone, userData?.name, user === undefined]);

    // ✅ تحميل الكاش المحلي فوراً عند فتح التطبيق
    // يرجع true إذا وُجدت بيانات مخزنة محلياً
    function loadCachedDataFirst(): boolean {
        try {
            const saved = localStorage.getItem('store-state-v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                const hasCachedData = parsed.settings?.storeName ||
                    (parsed.products?.length > 0) ||
                    (parsed.categories?.length > 0);

                if (hasCachedData) {
                    const cachedState: Partial<StoreState> = {
                        settings: parsed.settings || undefined,
                        products: parsed.products || [],
                        categories: parsed.categories || [],
                        discountRules: parsed.discountRules || [],
                        banners: parsed.banners || [],
                        rewards: parsed.rewards || [],
                    };
                    try {
                        const localCart = localStorage.getItem('store-cart');
                        const localFavs = localStorage.getItem('store-favorites');
                        const localMessages = localStorage.getItem('cached-messages');
                        if (localCart) cachedState.cart = JSON.parse(localCart);
                        if (localFavs) cachedState.favorites = JSON.parse(localFavs);
                        if (localMessages) cachedState.messages = JSON.parse(localMessages);
                    } catch (e) { }
                    baseDispatch({ type: 'LOAD_STATE', state: cachedState });
                    return true;
                }
            }
        } catch (e) { }
        return false;
    }

    async function loadFromFirestore() {
        try {
            const collections = ['categories', 'products', 'reviews', 'discount_rules', 'banners', 'rewards'];
            const loadedState: Partial<StoreState> = {};
            let serverHasData = false;

            // ⏱️ إضافة timeout لكل طلب Firestore لمنع التعليق
            const fetchWithTimeout = async (col: string, timeoutMs = 10000) => {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), timeoutMs);
                    const snap = await getDocs(collection(db, col));
                    clearTimeout(timeout);
                    return { col, docs: snap.docs.map(d => ({ ...d.data(), id: d.id })) };
                } catch (e) {
                    console.warn(`⚠️ Failed to fetch collection: ${col}`, e);
                    return { col, docs: null };
                }
            };

            const results = await Promise.all(
                collections.map(col => fetchWithTimeout(col))
            );

            results.forEach(({ col, docs }) => {
                if (!docs) return;
                serverHasData = true;
                switch (col) {
                    case 'categories': loadedState.categories = docs.map(dbToCategory); break;
                    case 'products': loadedState.products = docs.map(dbToProduct); break;
                    case 'reviews': loadedState.reviews = docs.map(dbToReview); break;
                    case 'discount_rules': loadedState.discountRules = docs.map(dbToDiscount); break;
                    case 'banners': loadedState.banners = docs.map(dbToBanner); break;
                    case 'rewards': loadedState.rewards = docs.map(dbToReward); break;
                }
            });

            // جلب الإعدادات (مستند واحد)
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'main'));
                if (settingsDoc.exists()) {
                    loadedState.settings = dbToSettings(settingsDoc.data());
                    serverHasData = true;
                }
            } catch (e) {
                console.warn('⚠️ Failed to fetch settings:', e);
            }

            if (serverHasData) {
                try {
                    const localCart = localStorage.getItem('store-cart');
                    const localFavs = localStorage.getItem('store-favorites');
                    if (localCart) loadedState.cart = JSON.parse(localCart);
                    if (localFavs) loadedState.favorites = JSON.parse(localFavs);
                } catch (e) { }
                loadedState.isDataInitialized = true;
                loadedState.isFirestoreLoaded = true;
                baseDispatch({ type: 'LOAD_STATE', state: loadedState });
            } else {
                // لا توجد بيانات من السيرفر - نفتح الموقع بالبيانات المحلية
                console.warn('⚠️ No server data available - using local cache');
                baseDispatch({ type: 'LOAD_STATE', state: { isDataInitialized: true, isFirestoreLoaded: true } });
            }
        } catch (err) {
            console.error('❌ Critical error loading from Firestore:', err);
            // حتى في حالة الخطأ الكامل، نفتح الموقع
            baseDispatch({ type: 'LOAD_STATE', state: { isDataInitialized: true, isFirestoreLoaded: true } });
        }
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
        const finalPrice = getFinalPriceCalc(item.product, state.discountRules, item.selectedVariant?.price);
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

    function getFinalPrice(product: Product, variantPrice?: number): number {
        return getFinalPriceCalc(product, state.discountRules, variantPrice);
    }

    return (
        <StoreContext.Provider value={{ state, dispatch, cartTotal, cartCount, getAppliedDiscount, getFinalPrice }}>
            {children}
        </StoreContext.Provider>
    );
}
