import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, Package, Tags, ShoppingBag, Users, MessageCircle, MessageSquare, BarChart3,
    Percent, Plus, Edit, Trash2, Check, X, LogOut, Save,
    Eye, EyeOff, Settings, Upload, Loader2, Star, FileText, Image, Send, Home, Gift, RefreshCw, Truck, Globe, Navigation,
    Printer, Calendar, ChevronDown
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../components/ToastContainer';
import { Product, Category, DiscountRule, Order, Review, LoyaltyReward } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { uploadImage } from '../utils/imageUploader';
import { StoreSettings } from '../context/StoreContextItems';
import AdminUsers from './admin/AdminUsers';
import ReportsPanel from '../components/ReportsPanel';

declare var L: any;


type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'messages' | 'discounts' | 'reviews' | 'banners' | 'settings' | 'rewards' | 'shipping' | 'reports';

// ============================================
// Empty Product/Category form defaults
// ============================================
const emptyProduct: Partial<Product> = {
    name: '', nameEn: '', description: '', price: 0, originalPrice: undefined,
    image: '', images: [], categoryId: '', weight: '', tags: [],
    specifications: {}, inStock: true, stockQuantity: 0, lowStockThreshold: 5,
    featured: false, rating: 5, reviewCount: 0,
};

const emptyCategory: Partial<Category> = { name: '', nameEn: '', icon: '📦', image: '', description: '' };
const emptyReward: Partial<LoyaltyReward> = { title: '', description: '', pointsCost: 100, discountValue: 10, discountType: 'percentage', icon: '🎁', color: '#4CAF50' };

export default function AdminPage() {
    const { state, dispatch } = useStore();
    const { isAdmin, adminName, logout, role } = useAuth();
    const navigate = useNavigate();
    const s = state.settings;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as AdminTab) || 'dashboard';
    const setActiveTab = (tab: AdminTab) => setSearchParams({ tab }, { replace: true });
    const [discountSubTab, setDiscountSubTab] = useState<'rules' | 'customer_coupons'>('rules');

    // Product states
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [productForm, setProductForm] = useState<Partial<Product>>({ ...emptyProduct });
    const [tagsInput, setTagsInput] = useState('');

    // Category states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [categoryForm, setCategoryForm] = useState<Partial<Category>>({ ...emptyCategory });

    // Settings states
    const [settingsForm, setSettingsForm] = useState<StoreSettings>(s);
    const [uploading, setUploading] = useState(false);

    // مزامنة البيانات من الإعدادات العالمية عند فتح التبويب فقط أو عند تغيير الرفع
    useEffect(() => {
        if ((activeTab === 'settings' || activeTab === 'shipping') && !uploading) {
            setSettingsForm(s);
        }
    }, [s, activeTab, uploading]);
    const [selectedChatPhone, setSelectedChatPhone] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    // Banner states
    const [showBannerModal, setShowBannerModal] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
    const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', image: '', link: '/products', active: true });

    // Reward states
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
    const [rewardForm, setRewardForm] = useState<Partial<LoyaltyReward>>({ ...emptyReward });

    // Discount states
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
    const [discountForm, setDiscountForm] = useState<Partial<DiscountRule>>({ name: '', type: 'percentage', value: 0, active: true });

    // Review states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentReview, setCurrentReview] = useState<Review | null>(null);
    const [reviewReplyText, setReviewReplyText] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | Order['status']>('all');
    const [orderSearchQuery, setOrderSearchQuery] = useState('');

    // Helper data
    const [lastSeenOrders, setLastSeenOrders] = useState<number>(() => {
        const saved = localStorage.getItem('admin-last-seen-orders');
        return saved ? parseInt(saved) : 0;
    });

    // Admin Geographic Settings (Map)
    const [adminMapInstance, setAdminMapInstance] = useState<any>(null);
    const [adminMarker, setAdminMarker] = useState<any>(null);

    // تحديث وقت رؤية الطلبات عند الدخول لتبويب الطلبات
    useEffect(() => {
        if (activeTab === 'orders' && state.orders.length > 0) {
            const latestTimestamp = Math.max(...state.orders.map(o => o.createdAt));
            if (latestTimestamp > lastSeenOrders) {
                setLastSeenOrders(latestTimestamp);
                localStorage.setItem('admin-last-seen-orders', latestTimestamp.toString());
            }
        }
    }, [activeTab, state.orders, lastSeenOrders]);

    // Load Leaflet Assets
    useEffect(() => {
        if (activeTab === 'shipping') {
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }
            if (!document.getElementById('leaflet-js')) {
                const script = document.createElement('script');
                script.id = 'leaflet-js';
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                document.head.appendChild(script);
            }
        }
    }, [activeTab]);

    // Admin Map Initialization
    useEffect(() => {
        if (activeTab === 'shipping' && !adminMapInstance && typeof L !== 'undefined') {
            const timer = setTimeout(() => {
                const lat = settingsForm.storeLat || 24.7136;
                const lng = settingsForm.storeLng || 46.6753;

                const map = L.map('admin-store-map').setView([lat, lng], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

                const m = L.marker([lat, lng], { draggable: true }).addTo(map);

                m.on('dragend', (e: any) => {
                    const pos = e.target.getLatLng();
                    setSettingsForm(prev => ({ ...prev, storeLat: pos.lat, storeLng: pos.lng }));
                });

                map.on('click', (e: any) => {
                    const pos = e.latlng;
                    m.setLatLng(pos);
                    setSettingsForm(prev => ({ ...prev, storeLat: pos.lat, storeLng: pos.lng }));
                });

                setAdminMapInstance(map);
                setAdminMarker(m);
            }, 100);
            return () => clearTimeout(timer);
        }

        // Update marker if form values change manually
        if (adminMarker && adminMapInstance) {
            const lat = settingsForm.storeLat || 24.7136;
            const lng = settingsForm.storeLng || 46.6753;
            adminMarker.setLatLng([lat, lng]);
            adminMapInstance.panTo([lat, lng]);
        }
    }, [activeTab, typeof L, settingsForm.storeLat, settingsForm.storeLng, adminMarker, adminMapInstance]);

    // Helper data
    const unreadMessages = state.messages.filter(m => !m.read && !m.isFromAdmin).length;
    const totalRevenue = state.orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0);
    const newOrdersCount = state.orders.filter(o => o.createdAt > lastSeenOrders).length;
    const pendingOrdersCount = state.orders.filter(o => o.status === 'pending').length;

    const statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار', processing: 'جاري التجهيز', shipped: 'تم الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي',
    };
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

    const allTabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
        { id: 'products', label: 'المنتجات', icon: <Package size={18} /> },
        { id: 'categories', label: 'الأصناف', icon: <Tags size={18} /> },
        { id: 'orders', label: 'الطلبات', icon: <ShoppingBag size={18} />, badge: newOrdersCount || undefined },
        { id: 'customers', label: 'العملاء', icon: <Users size={18} /> },
        { id: 'messages', label: 'الرسائل', icon: <MessageCircle size={18} />, badge: unreadMessages || undefined },
        { id: 'discounts', label: 'التخفيضات', icon: <Percent size={18} /> },
        { id: 'reviews', label: 'التقييمات', icon: <Star size={18} /> },
        { id: 'banners', label: 'البانرات', icon: <Image size={18} /> },
        { id: 'rewards', label: 'المكافآت', icon: <Gift size={18} /> },
        { id: 'reports', label: 'التقارير', icon: <BarChart3 size={18} /> },
        { id: 'shipping', label: 'التوصيل والتواصل', icon: <Truck size={18} /> },
        { id: 'settings', label: 'الإعدادات', icon: <Settings size={18} /> },
    ];

    const tabs = allTabs.filter(tab => {
        if (role === 'moderator') {
            return ['dashboard', 'products', 'orders'].includes(tab.id);
        }
        return true;
    });

    // ====================================================
    // PRODUCT CRUD
    // ====================================================
    const openAddProduct = () => {
        setProductForm({ ...emptyProduct, categoryId: state.categories[0]?.id || '' });
        setEditingProductId(null);
        setTagsInput('');
        setShowProductModal(true);
    };

    const openEditProduct = (product: Product) => {
        setProductForm({ ...product });
        setEditingProductId(product.id);
        setTagsInput(product.tags?.join(', ') || '');
        setShowProductModal(true);
    };

    const saveProduct = () => {
        if (!productForm.name || !productForm.price || !productForm.image || !productForm.categoryId) {
            showToast('يرجى ملء جميع الحقول المطلوبة (الاسم، السعر، الصورة، الصنف)', 'error');
            return;
        }
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        const product: Product = {
            id: editingProductId || `PROD-${Date.now()}`,
            name: productForm.name || '',
            nameEn: productForm.nameEn || '',
            description: productForm.description || '',
            price: productForm.price || 0,
            originalPrice: productForm.originalPrice || undefined,
            discount: productForm.originalPrice && productForm.price
                ? Math.round(((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100)
                : undefined,
            image: productForm.image || '',
            images: productForm.images || [],
            categoryId: productForm.categoryId || '',
            weight: productForm.weight || '',
            tags,
            specifications: productForm.specifications || {},
            stockQuantity: productForm.stockQuantity ?? 0,
            lowStockThreshold: productForm.lowStockThreshold ?? 5,
            inStock: (productForm.stockQuantity ?? 0) > 0,
            featured: productForm.featured ?? false,
            rating: productForm.rating || 5,
            reviewCount: productForm.reviewCount || 0,
        };

        if (editingProductId) {
            dispatch({ type: 'UPDATE_PRODUCT', product });
            showToast('تم تحديث المنتج بنجاح ✅', 'success');
        } else {
            dispatch({ type: 'ADD_PRODUCT', product });
            showToast('تم إضافة المنتج بنجاح 🎉', 'success');
        }

        // تحديث إجباري للحالة لضمان ظهور الصورة
        setTimeout(() => {
            setShowProductModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
    };

    const renderRewards = () => (
        <div>
            <div className="admin-section-header">
                <div>
                    <h2>💎 إدارة نظام المكافآت</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>أضف الجوائز التي يمكن للعملاء استبدال نقاطهم بها</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingRewardId(null); setRewardForm({ ...emptyReward }); setShowRewardModal(true); }}>
                    <Plus size={18} /> إضافة مكافأة
                </button>
            </div>

            <div className="responsive-grid grid-cols-3">
                {state.rewards.map(reward => (
                    <div key={reward.id} className="stat-card" style={{ borderTop: `4px solid ${reward.color}`, background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <span style={{ fontSize: '2rem' }}>{reward.icon}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="nav-icon-btn small" onClick={() => { setEditingRewardId(reward.id); setRewardForm(reward); setShowRewardModal(true); }}><Edit size={14} /></button>
                                <button className="nav-icon-btn small danger" onClick={() => {
                                    if (window.confirm('هل أنت متأكد من حذف هذه المكافأة؟')) {
                                        dispatch({ type: 'DELETE_REWARD', rewardId: reward.id });
                                        showToast('تم حذف المكافأة بنجاح');
                                    }
                                }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{reward.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 16 }}>{reward.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                                🪙 {reward.pointsCost} نقطة
                            </div>
                            <div style={{ color: reward.color, fontSize: '0.9rem', fontWeight: 700 }}>
                                {reward.discountType === 'percentage' ? `${reward.discountValue}% خصم` : `${reward.discountValue} ${s.currencySymbol} خصم `}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {state.rewards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎁</div>
                    <h3>لا يوجد مكافآت حالياً</h3>
                    <p style={{ color: 'var(--text-light)' }}>ابدأ بإضافة أول مكافأة لعملائك</p>
                </div>
            )}
        </div>
    );
    // ====================================================
    // CATEGORY CRUD
    // ====================================================
    const openAddCategory = () => {
        setCategoryForm({ ...emptyCategory });
        setEditingCategoryId(null);
        setShowCategoryModal(true);
    };

    const openEditCategory = (cat: Category) => {
        setCategoryForm({ ...cat });
        setEditingCategoryId(cat.id);
        setShowCategoryModal(true);
    };

    const saveCategory = () => {
        if (!categoryForm.name || !categoryForm.icon) {
            showToast('يرجى ملء اسم الصنف والأيقونة', 'error');
            return;
        }
        const category: Category = {
            id: editingCategoryId || `CAT - ${Date.now()} `,
            name: categoryForm.name || '',
            nameEn: categoryForm.nameEn || '',
            icon: categoryForm.icon || '📦',
            image: categoryForm.image || '',
            description: categoryForm.description || '',
        };
        if (editingCategoryId) {
            dispatch({ type: 'UPDATE_CATEGORY', category });
            showToast('تم تحديث الصنف ✅');
        } else {
            dispatch({ type: 'ADD_CATEGORY', category });
            showToast('تم إضافة الصنف 🎉');
        }
        setShowCategoryModal(false);
    };

    // ====================================================
    // RENDER SECTIONS
    // ====================================================

    const renderDashboard = () => {
        const outOfStockCount = state.products.filter(p => (p.stockQuantity ?? 0) <= 0).length;
        const lowStockCount = state.products.filter(p => {
            const qty = p.stockQuantity ?? 0;
            return qty > 0 && qty <= (p.lowStockThreshold ?? 5);
        }).length;

        return (
            <div>
                {/* تنبيه المخزون في لوحة التحكم */}
                {(outOfStockCount > 0 || lowStockCount > 0) && (
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {outOfStockCount > 0 && (
                            <div onClick={() => setActiveTab('products')} style={{ cursor: 'pointer', flex: 1, minWidth: '250px', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s' }}>
                                <span style={{ fontSize: '1.8rem' }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#f44336', fontSize: '1.1rem' }}>{outOfStockCount} منتج نفد</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>اضغط لمراجعة المنتجات وإعادة التعبئة</div>
                                </div>
                            </div>
                        )}
                        {lowStockCount > 0 && (
                            <div onClick={() => setActiveTab('products')} style={{ cursor: 'pointer', flex: 1, minWidth: '250px', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s' }}>
                                <span style={{ fontSize: '1.8rem' }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#FF9800', fontSize: '1.1rem' }}>{lowStockCount} مخزون منخفض</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>منتجات تحتاج إعادة تعبئة قريباً</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="admin-stats">
                    {[
                        { label: 'إجمالي المبيعات', value: `${totalRevenue.toFixed(0)} ${s.currencySymbol} `, icon: '💰' },
                        { label: 'عدد الطلبات', value: state.orders.length, icon: '📦' },
                        { label: 'طلبات معلقة', value: pendingOrdersCount, icon: '⏳' },
                        { label: 'المنتجات', value: state.products.length, icon: '🛍️' },
                        { label: 'العملاء', value: state.customers.length, icon: '👥' },
                        { label: 'رسائل جديدة', value: unreadMessages, icon: '✉️' },
                        { label: 'منتجات نفدت', value: outOfStockCount, icon: '🚫' },
                    ].map((s, i) => (
                        <div className="stat-card" key={i}>
                            <div className="stat-card-header">
                                <span className="stat-card-icon">{s.icon}</span>
                            </div>
                            <div className="stat-card-value">{s.value}</div>
                            <div className="stat-card-label">{s.label}</div>
                        </div>
                    ))}
                </div>
                <h3 style={{ marginBottom: '16px' }}>📈 أحدث الطلبات</h3>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead><tr><th>رقم</th><th>العميل</th><th>المجموع</th><th>الحالة</th><th>التاريخ</th></tr></thead>
                        <tbody>
                            {[...state.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 600 }}>{order.id}</td>
                                    <td>{order.customerName}</td>
                                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{order.total.toFixed(0)} {state.settings.currencySymbol}</td>
                                    <td><span className={`status-badge status-${order.status}`}>{statusLabels[order.status]}</span></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{formatDate(order.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };

    const renderProducts = () => {
        const outOfStockProducts = state.products.filter(p => (p.stockQuantity ?? 0) <= 0);
        const lowStockProducts = state.products.filter(p => {
            const qty = p.stockQuantity ?? 0;
            const threshold = p.lowStockThreshold ?? 5;
            return qty > 0 && qty <= threshold;
        });

        return (
            <div>
                {/* تنبيهات المخزون */}
                {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
                    <div style={{ marginBottom: '20px', display: 'grid', gap: '12px' }}>
                        {outOfStockProducts.length > 0 && (
                            <div style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.3rem' }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#f44336', marginBottom: 2 }}>منتجات نفدت من المخزون ({outOfStockProducts.length})</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{outOfStockProducts.map(p => p.name).join('، ')}</div>
                                </div>
                            </div>
                        )}
                        {lowStockProducts.length > 0 && (
                            <div style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#FF9800', marginBottom: 2 }}>مخزون منخفض ({lowStockProducts.length})</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{lowStockProducts.map(p => `${p.name} (${p.stockQuantity})`).join('، ')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="admin-section-header">
                    <h3>🛍️ إدارة المنتجات ({state.products.length})</h3>
                    <button className="btn btn-primary" onClick={openAddProduct}><Plus size={18} /> إضافة منتج</button>
                </div>
                {state.products.length === 0 ? (
                    <div className="empty-state">لا توجد منتجات حالياً. أضف منتجك الأول!</div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead><tr><th>الصورة</th><th>المنتج</th><th>الصنف</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th>مميز</th><th>إجراءات</th></tr></thead>
                            <tbody>
                                {state.products.map(p => {
                                    const qty = p.stockQuantity ?? 0;
                                    const threshold = p.lowStockThreshold ?? 5;
                                    const stockColor = qty <= 0 ? '#f44336' : qty <= threshold ? '#FF9800' : '#4CAF50';
                                    return (
                                        <tr key={p.id} style={{ opacity: qty <= 0 ? 0.7 : 1 }}>
                                            <td><img src={p.image} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} /></td>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td>{state.categories.find(c => c.id === p.categoryId)?.icon} {state.categories.find(c => c.id === p.categoryId)?.name}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.price} {s.currencySymbol}</span>
                                                {p.originalPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', marginRight: 8, fontSize: '0.8rem' }}>{p.originalPrice}</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{
                                                        background: `${stockColor}18`, color: stockColor, fontWeight: 800,
                                                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem',
                                                        border: `1px solid ${stockColor}40`, minWidth: '36px', textAlign: 'center',
                                                    }}>{qty}</span>
                                                    {qty <= 0 && <span style={{ fontSize: '0.7rem', color: '#f44336' }}>نفد!</span>}
                                                    {qty > 0 && qty <= threshold && <span style={{ fontSize: '0.7rem', color: '#FF9800' }}>منخفض</span>}
                                                </div>
                                            </td>
                                            <td><span className={`status-badge ${qty > 0 ? 'status-confirmed' : 'status-cancelled'}`}>{qty > 0 ? 'متوفر' : 'نفد'}</span></td>
                                            <td>{p.featured ? '⭐' : '—'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-secondary btn-small" onClick={() => openEditProduct(p)}><Edit size={14} /></button>
                                                    <button className="btn btn-danger btn-small" onClick={() => { if (confirm('حذف هذا المنتج؟')) { dispatch({ type: 'DELETE_PRODUCT', productId: p.id }); showToast('تم الحذف', 'warning'); } }}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    };

    const renderCategories = () => (
        <div>
            <div className="admin-section-header">
                <h3>📂 إدارة الأصناف ({state.categories.length})</h3>
                <button className="btn btn-primary" onClick={openAddCategory}><Plus size={18} /> إضافة صنف</button>
            </div>
            {state.categories.length === 0 ? (
                <div className="empty-state">لا توجد أصناف. أضف صنفك الأول!</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {state.categories.map(cat => (
                        <div key={cat.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span style={{ fontSize: '2.5rem' }}>{cat.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cat.name}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{cat.nameEn}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 4 }}>{state.products.filter(p => p.categoryId === cat.id).length} منتج</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-secondary btn-small" onClick={() => openEditCategory(cat)}><Edit size={14} /></button>
                                <button className="btn btn-danger btn-small" onClick={() => { if (confirm('حذف هذا الصنف؟')) { dispatch({ type: 'DELETE_CATEGORY', categoryId: cat.id }); showToast('تم الحذف', 'warning'); } }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderOrders = () => {
        const filteredOrders = state.orders.filter(o => {
            const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
            const q = orderSearchQuery.toLowerCase();
            const matchesSearch = o.customerName.toLowerCase().includes(q) ||
                o.customerPhone.includes(q) ||
                o.id.toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        }).sort((a, b) => b.createdAt - a.createdAt);

        return (
            <div>
                <div className="admin-section-header">
                    <h3>📦 إدارة الطلبات ({filteredOrders.length})</h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الهاتف أو الرقم..."
                            value={orderSearchQuery}
                            onChange={e => setOrderSearchQuery(e.target.value)}
                            style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', width: 220 }}
                        />
                        <select
                            value={orderStatusFilter}
                            onChange={e => setOrderStatusFilter(e.target.value as any)}
                            style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}
                        >
                            <option value="all">كل الحالات</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="processing">جاري التجهيز</option>
                            <option value="shipped">تم الشحن</option>
                            <option value="delivered">تم التوصيل</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    </div>
                </div>
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">لا توجد طلبات تطابق البحث</div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead><tr><th>رقم</th><th>العميل</th><th>الهاتف</th><th>المنتجات</th><th>المجموع</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)', fontFamily: 'monospace' }} title={order.id}>
                                            {order.id.split('-')[0].toUpperCase()}
                                        </td>
                                        <td>{order.customerName}</td>
                                        <td dir="ltr" style={{ fontSize: '0.85rem' }}>{order.customerPhone}</td>
                                        <td>
                                            <div style={{ fontSize: '0.82rem' }}>
                                                {order.items.slice(0, 2).map(item => <div key={item.product.id}>{item.product.name} ×{item.quantity}</div>)}
                                                {order.items.length > 2 && <div style={{ color: 'var(--text-light)' }}>+{order.items.length - 2} آخر</div>}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{order.total.toFixed(0)} {s.currencySymbol}</td>
                                        <td><span className={`status-badge status-${order.status}`}>{statusLabels[order.status]}</span></td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{formatDate(order.createdAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <select
                                                    value={order.status}
                                                    onChange={e => { dispatch({ type: 'UPDATE_ORDER_STATUS', orderId: order.id, status: e.target.value as any }); showToast('تم تحديث الحالة ✅'); }}
                                                    style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.8rem' }}
                                                >
                                                    <option value="pending">قيد الانتظار</option>
                                                    <option value="processing">جاري التجهيز</option>
                                                    <option value="shipped">تم الشحن</option>
                                                    <option value="delivered">تم التوصيل</option>
                                                    <option value="cancelled">ملغي</option>
                                                </select>
                                                <button className="btn btn-secondary btn-small" title="طباعة فاتورة" onClick={() => generateInvoicePDF(order, state.settings)}><FileText size={14} /></button>
                                                <button className="btn btn-danger btn-small" onClick={() => { if (confirm('حذف هذا الطلب؟')) { dispatch({ type: 'DELETE_ORDER', orderId: order.id }); showToast('تم الحذف', 'warning'); } }}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderCustomers = () => (
        <AdminUsers />
    );


    const chatEndRef = useRef<HTMLDivElement>(null);
    const isFirstChatLoad = useRef(true);

    // تحديث الرسائل كـ "مقروءة" تلقائياً عند فتح المحادثة ووصول رسائل جديدة
    useEffect(() => {
        if (selectedChatPhone) {
            const unreadInActiveChat = state.messages.filter(
                m => (m.senderPhone === selectedChatPhone || m.userId === selectedChatPhone) &&
                    !m.read && !m.isFromAdmin
            );

            unreadInActiveChat.forEach(m => {
                dispatch({ type: 'MARK_MESSAGE_READ', messageId: m.id });
            });
        }
    }, [selectedChatPhone, state.messages.length, dispatch]);

    useEffect(() => {
        if (selectedChatPhone) {
            if (isFirstChatLoad.current) {
                isFirstChatLoad.current = false;
                return;
            }
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            isFirstChatLoad.current = true;
        }
    }, [selectedChatPhone, state.messages.length]);

    const renderMessages = () => {
        // Group messages by phone
        const grouped: Record<string, typeof state.messages> = {};
        state.messages.forEach(m => {
            const key = m.senderPhone || m.userId || 'unknown';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(m);
        });

        const phones = Object.keys(grouped);
        const activeChat = selectedChatPhone
            ? [...grouped[selectedChatPhone]].sort((a, b) => a.createdAt - b.createdAt)
            : null;

        return (
            <div>
                <div className="admin-section-header">
                    <h3>💬 المحادثات ({phones.length})</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: activeChat ? '280px 1fr' : '1fr', gap: 16, minHeight: 400 }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                        {phones.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>لا توجد رسائل</div>
                        ) : phones.map(phone => {
                            const msgs = [...grouped[phone]].sort((a, b) => a.createdAt - b.createdAt);
                            const lastMsg = msgs[msgs.length - 1];
                            const unread = msgs.filter(m => !m.read && !m.isFromAdmin).length;
                            return (
                                <div key={phone} onClick={() => { setSelectedChatPhone(phone); msgs.forEach(m => { if (!m.read) dispatch({ type: 'MARK_MESSAGE_READ', messageId: m.id }); }); }}
                                    style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedChatPhone === phone ? 'rgba(200,134,10,0.1)' : 'transparent' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 700 }}>{lastMsg.senderName}</div>
                                        {unread > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{unread}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 4 }}>{lastMsg.content.slice(0, 40)}...</div>
                                </div>
                            );
                        })}
                    </div>
                    {activeChat && (
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>{activeChat[0]?.senderName} — {selectedChatPhone}</div>
                                <button
                                    className="btn btn-danger btn-small"
                                    title="حذف المحادثة بالكامل"
                                    onClick={() => {
                                        if (confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟ لا يمكن التراجع')) {
                                            const original = activeChat[0];
                                            dispatch({ type: 'CLEAR_USER_MESSAGES', userId: original.userId, phone: original.senderPhone });
                                            setSelectedChatPhone(null);
                                            showToast('تم حذف المحادثة بنجاح 🗑️', 'warning');
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '500px' }}>
                                {activeChat.map(msg => (
                                    <div key={msg.id} style={{ alignSelf: msg.isFromAdmin ? 'flex-end' : 'flex-start', maxWidth: '70%', background: msg.isFromAdmin ? 'var(--accent)' : 'var(--bg)', color: msg.isFromAdmin ? '#fff' : 'var(--text)', borderRadius: 12, padding: '10px 14px', fontSize: '0.9rem' }}>
                                        {msg.content}
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 4 }}>{formatDate(msg.createdAt)}</div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="اكتب رد..." onKeyDown={e => e.key === 'Enter' && sendReply()}
                                    style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                                <button className="btn btn-primary" onClick={sendReply}><Send size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const sendReply = () => {
        if (!replyText.trim() || !selectedChatPhone) return;
        const msgs = state.messages.filter(m => (m.senderPhone || m.userId) === selectedChatPhone);
        const original = msgs[0];
        dispatch({
            type: 'ADD_MESSAGE',
            message: {
                id: `MSG - ${Date.now()} `,
                userId: original?.userId,
                senderName: 'المتجر',
                senderPhone: selectedChatPhone,
                content: replyText,
                isFromAdmin: true,
                read: true,
                status: 'read',
                createdAt: Date.now(),
            }
        });
        setReplyText('');
        showToast('تم إرسال الرد ✅');
    };

    const renderDiscounts = () => {
        const rewardCoupons = state.discountRules.filter(r => r.userId || r.name.startsWith('REW-'));
        const generalRules = state.discountRules.filter(r => !r.userId && !r.name.startsWith('REW-'));

        return (
            <div>
                <div className="admin-section-header">
                    <h3>🏷️ إدارة التخفيضات</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div className="tabs-mini" style={{ display: 'flex', background: 'var(--bg)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setDiscountSubTab('rules')}
                                style={{
                                    padding: '6px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
                                    background: discountSubTab === 'rules' ? 'var(--accent)' : 'transparent',
                                    color: discountSubTab === 'rules' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer', transition: '0.3s'
                                }}
                            >
                                قواعد الخصم ({generalRules.length})
                            </button>
                            <button
                                onClick={() => setDiscountSubTab('customer_coupons')}
                                style={{
                                    padding: '6px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
                                    background: discountSubTab === 'customer_coupons' ? '#9c27b0' : 'transparent',
                                    color: discountSubTab === 'customer_coupons' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer', transition: '0.3s'
                                }}
                            >
                                كوبونات العملاء ({rewardCoupons.length})
                            </button>
                        </div>
                        <button className="btn btn-primary" onClick={() => {
                            setEditingDiscountId(null);
                            setDiscountForm({ name: '', type: 'percentage', value: 0, active: true });
                            setShowDiscountModal(true);
                        }}>
                            <Plus size={18} /> إضافة تخفيض
                        </button>
                    </div>
                </div>

                {discountSubTab === 'rules' ? (
                    generalRules.length === 0 ? (
                        <div className="empty-state">لا توجد قواعد خصم عامة حالياً</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {generalRules.map(rule => (
                                <div key={rule.id} style={{ background: 'var(--surface)', border: `1px solid ${rule.active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: 20, opacity: rule.active ? 1 : 0.6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rule.name}</div>
                                        <span className={`status-badge ${rule.active ? 'status-confirmed' : 'status-cancelled'}`}>{rule.active ? 'نشط' : 'معطل'}</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 12 }}>
                                        {rule.type === 'percentage' ? `${rule.value}%` : `${rule.value} ${s.currencySymbol}`}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary btn-small" onClick={() => {
                                            setEditingDiscountId(rule.id);
                                            setDiscountForm(rule);
                                            setShowDiscountModal(true);
                                        }}>
                                            <Edit size={14} /> تعديل
                                        </button>
                                        <button className="btn btn-secondary btn-small" onClick={() => { dispatch({ type: 'TOGGLE_DISCOUNT_RULE', ruleId: rule.id }); showToast(rule.active ? 'تم التعطيل' : 'تم التفعيل'); }}>
                                            {rule.active ? <EyeOff size={14} /> : <Eye size={14} />} {rule.active ? 'تعطيل' : 'تفعيل'}
                                        </button>
                                        <button className="btn btn-danger btn-small" onClick={() => { if (confirm('حذف هذا التخفيض؟')) { dispatch({ type: 'REMOVE_DISCOUNT_RULE', ruleId: rule.id }); showToast('تم الحذف', 'warning'); } }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    rewardCoupons.length === 0 ? (
                        <div className="empty-state">لا توجد كوبونات مكافآت مستخرجة من قبل العملاء</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                            {rewardCoupons.map(rule => {
                                const customer = state.customers.find(c => String(c.id) === String(rule.userId));
                                return (
                                    <div key={rule.id} style={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 20,
                                        padding: 20,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#9c27b0' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 4 }}>كود الخصم:</div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#9c27b0', fontFamily: 'monospace' }}>{rule.name}</div>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: 8,
                                                background: rule.active ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                                color: rule.active ? 'var(--success)' : 'var(--error)'
                                            }}>
                                                {rule.active ? 'صالح' : 'مستخدم/منتهي'}
                                            </span>
                                        </div>

                                        <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 12, marginBottom: 15 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 4 }}>العميل:</div>
                                            {customer ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                                        {customer.name[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{customer.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{customer.phone}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                    {rule.userId ? `معرف المستخدم: ${rule.userId.slice(0, 8)}...` : 'عميل مجهول (كود قديم)'}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)' }}>
                                                {rule.type === 'percentage' ? `${rule.value}%` : `${rule.value} ${s.currencySymbol}`}
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginRight: 4 }}>خصم</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-secondary btn-small" style={{ padding: '6px' }} onClick={() => { dispatch({ type: 'TOGGLE_DISCOUNT_RULE', ruleId: rule.id }); }} title={rule.active ? 'إلغاء التنشيط' : 'تنشيط'}>
                                                    {rule.active ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button className="btn btn-danger btn-small" style={{ padding: '6px' }} onClick={() => { if (confirm('حذف هذا الكوبون؟')) { dispatch({ type: 'REMOVE_DISCOUNT_RULE', ruleId: rule.id }); } }} title="حذف الكوبون">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        );
    };

    const renderReviews = () => (
        <div>
            <h3 style={{ marginBottom: '20px' }}>⭐ تقييمات العملاء ({state.reviews.length})</h3>
            {state.reviews.length === 0 ? (
                <div className="empty-state">لا توجد تقييمات بعد</div>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {state.reviews.map(review => {
                        const product = state.products.find(p => p.id === review.productId);
                        return (
                            <div key={review.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{review.customerName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>على: {product?.name || 'منتج محذوف'}</div>
                                    </div>
                                    <div style={{ display: 'flex', color: '#FFB300' }}>
                                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.9rem', marginBottom: 15 }}>{review.comment}</p>
                                {review.adminReply && (
                                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 10, marginBottom: 15, borderRight: '4px solid var(--accent)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent)', marginBottom: 4 }}>رد المتجر:</div>
                                        <div style={{ fontSize: '0.85rem' }}>{review.adminReply}</div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-primary btn-small" onClick={() => {
                                        setCurrentReview(review);
                                        setReviewReplyText(review.adminReply || '');
                                        setShowReviewModal(true);
                                    }}>{review.adminReply ? 'تعديل الرد' : '💬 الرد'}</button>
                                    <button className="btn btn-danger btn-small" onClick={() => { if (confirm('حذف التقييم؟')) { dispatch({ type: 'DELETE_REVIEW', reviewId: review.id }); showToast('تم الحذف', 'warning'); } }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderBanners = () => (
        <div>
            <div className="admin-section-header">
                <h3>🖼️ البانرات الترويجية ({state.banners.length})</h3>
                <button className="btn btn-primary" onClick={() => {
                    setEditingBannerId(null);
                    setBannerForm({ title: '', subtitle: '', image: '', link: '/products', active: true });
                    setShowBannerModal(true);
                }}>
                    <Plus size={18} /> إضافة بانر
                </button>
            </div>
            {state.banners.length === 0 ? (
                <div className="empty-state">🖼️ لا توجد بانرات — أضف بانرات ترويجية لتظهر في الصفحة الرئيسية</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                    {state.banners.map(banner => (
                        <div key={banner.id} style={{ background: 'var(--surface)', border: `1px solid ${banner.active ? 'var(--accent)' : 'var(--border)'} `, borderRadius: 16, overflow: 'hidden', opacity: banner.active ? 1 : 0.6 }}>
                            <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                                <img src={banner.image} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: 16 }}>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{banner.title}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: 4 }}>{banner.subtitle}</div>
                                </div>
                                <span className={`status - badge ${banner.active ? 'status-confirmed' : 'status-cancelled'} `} style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.75rem' }}>
                                    {banner.active ? 'نشط' : 'معطل'}
                                </span>
                            </div>
                            <div style={{ padding: 14, display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-small" onClick={() => { dispatch({ type: 'UPDATE_BANNER', banner: { ...banner, active: !banner.active } }); showToast(banner.active ? 'تم تعطيل البانر' : 'تم تفعيل البانر'); }}>
                                    {banner.active ? <EyeOff size={14} /> : <Eye size={14} />} {banner.active ? 'تعطيل' : 'تفعيل'}
                                </button>
                                <button className="btn btn-secondary btn-small" onClick={() => {
                                    setEditingBannerId(banner.id);
                                    setBannerForm({ title: banner.title, subtitle: banner.subtitle, image: banner.image, link: banner.link, active: banner.active });
                                    setShowBannerModal(true);
                                }}><Edit size={14} /> تعديل</button>
                                <button className="btn btn-danger btn-small" onClick={() => { if (confirm('حذف هذا البانر؟')) { dispatch({ type: 'DELETE_BANNER', bannerId: banner.id }); showToast('تم حذف البانر', 'warning'); } }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderShippingSettings = () => (
        <div>
            <h3 style={{ marginBottom: '24px' }}>🚚 إعدادات التوصيل والتواصل</h3>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>🌐 روابط التواصل الاجتماعي</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>رابط إنستقرام</label>
                        <input value={settingsForm.instagramLink || ''} onChange={e => setSettingsForm(prev => ({ ...prev, instagramLink: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>رابط فيسبوك</label>
                        <input value={settingsForm.facebookLink || ''} onChange={e => setSettingsForm(prev => ({ ...prev, facebookLink: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>رابط سناب شات</label>
                        <input value={settingsForm.snapchatLink || ''} onChange={e => setSettingsForm(prev => ({ ...prev, snapchatLink: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>🚚 تكاليف التوصيل والحد الأدنى</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>رسوم التوصيل الثابتة ({settingsForm.currencySymbol})</label>
                        <input type="number" value={settingsForm.deliveryFee || 0} onChange={e => setSettingsForm(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>توصيل مجاني من (مبلغ)</label>
                        <input type="number" value={settingsForm.freeShippingThreshold || 0} onChange={e => setSettingsForm(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>سعر الكيلومتر (توصيل ذكي)</label>
                        <input type="number" step="0.1" value={settingsForm.deliveryPricePerKm || 0} onChange={e => setSettingsForm(prev => ({ ...prev, deliveryPricePerKm: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>الحد الأدنى للطلب</label>
                        <input type="number" value={settingsForm.minOrder || 0} onChange={e => setSettingsForm(prev => ({ ...prev, minOrder: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>خط عرض المتجر (Lat)</label>
                            <input type="number" step="0.000001" value={settingsForm.storeLat || 0} onChange={e => setSettingsForm(prev => ({ ...prev, storeLat: Number(e.target.value) }))}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>خط طول المتجر (Lng)</label>
                            <input type="number" step="0.000001" value={settingsForm.storeLng || 0} onChange={e => setSettingsForm(prev => ({ ...prev, storeLng: Number(e.target.value) }))}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                        </div>
                    </div>
                </div>

                {/* Map Integration */}
                <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>📍 حدد موقع المتجر على الخريطة</label>
                        <button
                            className="btn btn-secondary btn-small"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition((pos) => {
                                        const { latitude, longitude } = pos.coords;
                                        setSettingsForm(prev => ({ ...prev, storeLat: latitude, storeLng: longitude }));
                                        showToast('تم تحديد موقعك الحالي 📍');
                                    });
                                }
                            }}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                            <Navigation size={14} /> استخدام موقعي الحالي
                        </button>
                    </div>
                    <div id="admin-store-map" style={{ height: 300, borderRadius: 16, border: '1px solid var(--border)' }}></div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>
                        يمكنك سحب الدبوس أو الضغط على أي مكان في الخريطة لتحديث إحداثيات المتجر تلقائياً.
                    </p>
                </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>🎁 نظام نقاط الولاء</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="checkbox"
                            id="loyaltyEnabled"
                            checked={settingsForm.loyaltyEnabled}
                            onChange={e => setSettingsForm(prev => ({ ...prev, loyaltyEnabled: e.target.checked }))}
                            style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor="loyaltyEnabled" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>تفعيل نظام النقاط</label>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>عدد الريالات لكل 1 نقطة</label>
                        <input
                            type="number"
                            value={settingsForm.loyaltyPointsRatio}
                            onChange={e => setSettingsForm(prev => ({ ...prev, loyaltyPointsRatio: Number(e.target.value) }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}
                            min="1"
                        />
                    </div>
                </div>
            </div>

            <button className="btn btn-primary" onClick={() => { dispatch({ type: 'UPDATE_SETTINGS', settings: settingsForm }); showToast('تم حفظ إعدادات التوصيل والتواصل ✅'); }}>
                <Save size={18} /> حفظ التغييرات
            </button>
        </div >
    );

    const renderSettings = () => (
        <div>
            <h3 style={{ marginBottom: '24px' }}>⚙️ إعدادات المتجر</h3>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {[
                        { label: 'اسم المتجر', key: 'storeName' as const },
                        { label: 'الشعار (إيموجي أو رابط صورة)', key: 'storeLogo' as const, isLogo: true },
                        { label: 'الوصف', key: 'storeDescription' as const },
                        { label: 'الشعار النصي', key: 'storeTagline' as const },
                        { label: 'رقم الواتساب', key: 'whatsappNumber' as const },
                        { label: 'العملة', key: 'currency' as const },
                        { label: 'رمز العملة', key: 'currencySymbol' as const },
                    ].map(field => (
                        <div key={field.key}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>{field.label}</label>
                            {(field as any).isLogo ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        value={settingsForm.storeLogo || ''}
                                        onChange={e => setSettingsForm(prev => ({ ...prev, storeLogo: e.target.value }))}
                                        style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}
                                    />
                                    <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}>
                                        {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                                        {uploading ? 'جاري الرفع...' : '📸 رفع شعار'}
                                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setUploading(true);
                                            try {
                                                const url = await uploadImage(file, 'settings');
                                                if (url) {
                                                    // تحديث النموذج محلياً
                                                    setSettingsForm(prev => ({ ...prev, storeLogo: url }));
                                                    // حفظ الإعدادات فوراً في قاعدة البيانات لضمان عدم الضياع
                                                    dispatch({ type: 'UPDATE_SETTINGS', settings: { ...settingsForm, storeLogo: url } });
                                                    showToast('تم رفع وحفظ شعار المتجر بنجاح 📸');
                                                } else {
                                                    showToast('فشل الرفع: تأكد من تشغيل كود SQL وتوفر الإنترنت', 'error');
                                                }
                                            } catch (err) {
                                                showToast('حدث خطأ غير متوقع', 'error');
                                            } finally {
                                                setUploading(false);
                                                e.target.value = '';
                                            }
                                        }} />
                                    </label>
                                </div>
                            ) : (
                                <input
                                    value={(settingsForm as any)[field.key] || ''}
                                    onChange={e => setSettingsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}
                                />
                            )}
                        </div>
                    ))}
                </div>

            </div>

            <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>الشروط والأحكام</label>
                <textarea
                    value={settingsForm.termsConditions || ''}
                    onChange={e => setSettingsForm(prev => ({ ...prev, termsConditions: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical' }}
                />
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { dispatch({ type: 'UPDATE_SETTINGS', settings: settingsForm }); showToast('تم حفظ الإعدادات الأساسية ✅'); }}>
                <Save size={18} /> حفظ الإعدادات الأساسية
            </button>

            {/* Danger Zone */}
            <div style={{ marginTop: 32, background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 16, padding: 24 }}>
                <h4 style={{ color: '#dc2626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>⚠️ منطقة الخطر (إفراغ البيانات)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>هذه العمليات نهائية ولا يمكن التراجع عنها. يمكنك مسح أقسام معينة أو تصفير البرنامج بالكامل.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <button className="btn btn-danger" onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف كافة المنتجات والأصناف والبنرات؟ سيتم مسحها من السيرفر تماماً!')) {
                            dispatch({ type: 'CLEAR_PRODUCTS' });
                            dispatch({ type: 'CLEAR_CATEGORIES' });
                            dispatch({ type: 'DELETE_BANNER', bannerId: 'b1' });
                            dispatch({ type: 'DELETE_BANNER', bannerId: 'b2' });
                            showToast('تم حذف كافة المنتجات والأصناف والبنرات بنجاح 🗑️', 'warning');
                        }
                    }} style={{ background: '#7f1d1d' }}>
                        <Trash2 size={16} /> إفراغ المنتجات والأصناف (بياناتي)
                    </button>

                    <button className="btn btn-danger" onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف كافة الطلبات وتصفيير المبيعات؟')) {
                            dispatch({ type: 'CLEAR_ORDERS' });
                            showToast('تم حذف كافة الطلبات بنجاح 🗑️', 'warning');
                        }
                    }}>
                        <Trash2 size={16} /> تصفير الطلبات والمبيعات
                    </button>

                    <button className="btn btn-danger" onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف كافة الرسائل والدردشات؟')) {
                            dispatch({ type: 'CLEAR_MESSAGES' });
                            showToast('تم حذف كافة الرسائل بنجاح 🗑️', 'warning');
                        }
                    }}>
                        <MessageSquare size={16} /> إفراغ كافة الرسائل
                    </button>

                    <button className="btn btn-danger" onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف كافة التقييمات؟')) {
                            dispatch({ type: 'CLEAR_REVIEWS' });
                            showToast('تم حذف كافة التقييمات بنجاح 🗑️', 'warning');
                        }
                    }}>
                        <Star size={16} /> حذف كافة التقييمات
                    </button>

                    <button className="btn btn-danger" onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من حذف كافة العملاء؟')) {
                            dispatch({ type: 'CLEAR_CUSTOMERS' });
                            showToast('تم حذف قائمة العملاء بنجاح 🗑️', 'warning');
                        }
                    }}>
                        <Users size={16} /> إفراغ قائمة العملاء
                    </button>

                    <button className="btn btn-danger" onClick={() => {
                        if (confirm('⚠️ هل أنت متأكد من حذف كافة المكافآت؟')) {
                            dispatch({ type: 'CLEAR_REWARDS' });
                            showToast('تم حذف المكافآت بنجاح 🗑️', 'warning');
                        }
                    }}>
                        <Gift size={16} /> حذف كافة المكافآت
                    </button>

                    {/* Factory Reset - THE BIG RED BUTTON */}
                    <button className="btn btn-danger" style={{ gridColumn: '1 / -1', marginTop: 8, padding: '16px', fontSize: '1rem', fontWeight: 'bold', background: '#991b1b' }} onClick={() => {
                        if (confirm('🚨🚨🚨 تحذير شديد الخطورة: هل أنت متأكد من رغبتك في إعادة ضبط المصنع؟ سيتم حذف كل شيء (منتجات، أصناف، عملاء، مبيعات، إعدادات) وسيعود البرنامج للصفر تماماً!')) {
                            dispatch({ type: 'FACTORY_RESET' });
                            showToast('تمت إعادة ضبط المصنع بنجاح، البرنامج عاد للصفر 🔄', 'error');
                        }
                    }}>
                        <RefreshCw size={20} /> إعادة ضبط المصنع (حذف شامل لكل شيء)
                    </button>
                </div>
            </div>
        </div >
    );

    // ====================================================
    // RENDER CONTENT SWITCH
    // ====================================================
    // ====================================================
    // REPORTS - using ReportsPanel component
    // ====================================================
    const renderReports = () => <ReportsPanel />;

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return renderDashboard();
            case 'products': return renderProducts();
            case 'categories': return renderCategories();
            case 'orders': return renderOrders();
            case 'customers': return renderCustomers();
            case 'messages': return renderMessages();
            case 'discounts': return renderDiscounts();
            case 'reviews': return renderReviews();
            case 'banners': return renderBanners();
            case 'settings': return renderSettings();
            case 'rewards': return renderRewards();
            case 'reports': return renderReports();
            case 'shipping': return renderShippingSettings();
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div style={{ marginBottom: '24px', textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {s.storeLogo?.startsWith('<svg') ? (
                            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: s.storeLogo }} />
                        ) : s.storeLogo?.startsWith('http') ? (
                            <img src={s.storeLogo} alt="Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
                        ) : (
                            <span>{s.storeLogo}</span>
                        )}
                        لوحة التحكم
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>مرحباً {adminName}</div>
                </div>
                <nav className="admin-sidebar-nav">
                    <button className="admin-nav-item" onClick={() => navigate('/')} style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', marginBottom: '8px', paddingBottom: '12px' }}>
                        <Home size={18} />
                        المتجر الرئيسي (خروج)
                    </button>
                    {tabs.map(tab => (
                        <button key={tab.id} className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.icon}
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span style={{ marginRight: 'auto', background: 'var(--error)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={async () => { await logout(); navigate('/login'); showToast('تم تسجيل الخروج'); }}>
                    <LogOut size={16} /> تسجيل الخروج
                </button>
            </aside>

            {/* Main Content */}
            <main className="admin-content">
                <div className="admin-header">
                    <h1>{tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}</h1>
                    <select value={activeTab} onChange={e => setActiveTab(e.target.value as AdminTab)} className="admin-mobile-select">
                        {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                    </select>
                </div>
                {renderContent()}
            </main>

            {/* ================== MODALS ================== */}

            {/* Product Modal */}
            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProductId ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}</h2>
                            <button className="nav-icon-btn" onClick={() => setShowProductModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="responsive-grid grid-cols-2">
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>اسم المنتج *</label>
                                    <input value={productForm.name || ''} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>اسم بالإنجليزية</label>
                                    <input value={productForm.nameEn || ''} onChange={e => setProductForm(p => ({ ...p, nameEn: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>السعر *</label>
                                    <input type="number" value={productForm.price || ''} onChange={e => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>السعر الأصلي (قبل الخصم)</label>
                                    <input type="number" value={productForm.originalPrice || ''} onChange={e => setProductForm(p => ({ ...p, originalPrice: Number(e.target.value) || undefined }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الصورة الرئيسية *</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input value={productForm.image || ''} onChange={e => setProductForm(p => ({ ...p, image: e.target.value }))} placeholder="رابط الصورة أو ارفع من جهازك"
                                            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                        <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}>
                                            {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                                            {uploading ? 'جاري الرفع...' : '📸 رفع صورة'}
                                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploading(true);
                                                const uploadTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000));
                                                const url = await Promise.race([uploadImage(file, 'products'), uploadTimeout]);
                                                setUploading(false);
                                                if (url) { setProductForm(p => ({ ...p, image: url })); showToast('تم رفع الصورة بنجاح 📸'); }
                                                else showToast('فشل رفع الصورة أو انتهت المهلة', 'error');
                                                e.target.value = '';
                                            }} />
                                        </label>
                                    </div>
                                    {productForm.image && (
                                        <div style={{ marginTop: 10 }}>
                                            <img src={productForm.image} alt="معاينة" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الصنف *</label>
                                    <select value={productForm.categoryId || ''} onChange={e => setProductForm(p => ({ ...p, categoryId: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }}>
                                        <option value="">اختر الصنف</option>
                                        {state.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الوزن</label>
                                    <input value={productForm.weight || ''} onChange={e => setProductForm(p => ({ ...p, weight: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الوصف</label>
                                    <textarea value={productForm.description || ''} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={3}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الكلمات المفتاحية (فاصلة بين كل كلمة)</label>
                                    <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="عسل, طبيعي, سدر"
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                {/* حقول المخزون */}
                                <div style={{ gridColumn: '1 / -1', background: 'var(--bg)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>📦 إدارة المخزون</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>الكمية المتاحة *</label>
                                            <input type="number" min="0" value={productForm.stockQuantity ?? 0} onChange={e => setProductForm(p => ({ ...p, stockQuantity: Math.max(0, Number(e.target.value)) }))}
                                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>حد التنبيه (مخزون منخفض)</label>
                                            <input type="number" min="1" value={productForm.lowStockThreshold ?? 5} onChange={e => setProductForm(p => ({ ...p, lowStockThreshold: Math.max(1, Number(e.target.value)) }))}
                                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)' }} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                                        💡 سيتم تحديد حالة التوفر تلقائياً بناءً على الكمية. إذا وصلت الكمية إلى 0 سيظهر المنتج كـ"نفد".
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={productForm.featured ?? false} onChange={e => setProductForm(p => ({ ...p, featured: e.target.checked }))} />
                                        ⭐ منتج مميز
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={saveProduct}><Save size={16} /> {editingProductId ? 'تحديث' : 'إضافة'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategoryId ? '✏️ تعديل الصنف' : '➕ إضافة صنف جديد'}</h2>
                            <button className="nav-icon-btn" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>اسم الصنف *</label>
                                    <input value={categoryForm.name || ''} onChange={e => setCategoryForm(c => ({ ...c, name: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>اسم بالإنجليزية</label>
                                    <input value={categoryForm.nameEn || ''} onChange={e => setCategoryForm(c => ({ ...c, nameEn: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الأيقونة (إيموجي) *</label>
                                    <input value={categoryForm.icon || ''} onChange={e => setCategoryForm(c => ({ ...c, icon: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '1.5rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>صورة الصنف</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input value={categoryForm.image || ''} onChange={e => setCategoryForm(c => ({ ...c, image: e.target.value }))} placeholder="رابط الصورة أو ارفع من جهازك"
                                            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                        <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}>
                                            {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                                            {uploading ? 'جاري...' : '📸 رفع'}
                                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploading(true);
                                                const uploadTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000));
                                                const url = await Promise.race([uploadImage(file, 'categories'), uploadTimeout]);
                                                setUploading(false);
                                                if (url) { setCategoryForm(c => ({ ...c, image: url })); showToast('تم رفع الصورة بنجاح 📸'); }
                                                else showToast('فشل رفع الصورة أو انتهت المهلة', 'error');
                                                e.target.value = '';
                                            }} />
                                        </label>
                                    </div>
                                    {categoryForm.image && (
                                        <div style={{ marginTop: 8 }}>
                                            <img src={categoryForm.image} alt="معاينة" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الوصف</label>
                                    <textarea value={categoryForm.description || ''} onChange={e => setCategoryForm(c => ({ ...c, description: e.target.value }))} rows={2}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={saveCategory}><Save size={16} /> {editingCategoryId ? 'تحديث' : 'إضافة'}</button>
                        </div>
                    </div>
                </div>
            )}
            {showBannerModal && (
                <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBannerId ? '✈️ تعديل البانر' : '➕ إضافة بانر جديد'}</h2>
                            <button className="nav-icon-btn" onClick={() => setShowBannerModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>عنوان البانر *</label>
                                    <input value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))} placeholder="عرض جديد!"
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>الوصف</label>
                                    <input value={bannerForm.subtitle} onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="خصومات مميزة على منتجات مختارة"
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>صورة البانر *</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input value={bannerForm.image} onChange={e => setBannerForm(f => ({ ...f, image: e.target.value }))} placeholder="رابط الصورة أو ارفع من جهازك"
                                            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                        <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--accent)', color: '#000', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}>
                                            {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                                            {uploading ? 'جاري...' : '📸 رفع'}
                                            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploading(true);
                                                const uploadTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000));
                                                const url = await Promise.race([uploadImage(file, 'banners'), uploadTimeout]);
                                                setUploading(false);
                                                if (url) { setBannerForm(f => ({ ...f, image: url })); showToast('تم رفع الصورة بنجاح 📸'); }
                                                else showToast('فشل رفع الصورة أو انتهت المهلة', 'error');
                                                e.target.value = '';
                                            }} />
                                        </label>
                                    </div>
                                    {bannerForm.image && (
                                        <div style={{ marginTop: 10 }}>
                                            <img src={bannerForm.image} alt="معاينة" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>رابط التوجيه (اختر من القائمة)</label>
                                    <select
                                        onChange={e => {
                                            if (e.target.value) setBannerForm(f => ({ ...f, link: e.target.value }));
                                        }}
                                        style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', marginBottom: 10, cursor: 'pointer' }}
                                    >
                                        <option value="">🎯 سهم التوجيه: اختر وجهة التوجيه...</option>
                                        <optgroup label="🏛️ أقسام رئيسية">
                                            <option value="/">الصفحة الرئيسية</option>
                                            <option value="/products">📦 كل المنتجات</option>
                                            <option value="/rewards">🎁 المكافآت وكوبونات التوفير</option>
                                            <option value="/track">🚚 تتبع الطلبات</option>
                                            <option value="/orders">📑 طلباتي</option>
                                        </optgroup>
                                        <optgroup label="📂 الأصناف">
                                            {state.categories.map(c => (
                                                <option key={c.id} value={`/products?category=${c.id}`}>
                                                    {c.icon} {c.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="🍯 المنتجات">
                                            {state.products.map(p => (
                                                <option key={p.id} value={`/product/${p.id}`}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>الرابط الفعلي:</span>
                                        <input
                                            value={bannerForm.link}
                                            onChange={e => setBannerForm(f => ({ ...f, link: e.target.value }))}
                                            placeholder="/products"
                                            style={{ flex: 1, padding: '4px 0', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700, outline: 'none', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowBannerModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={() => {
                                if (!bannerForm.title || !bannerForm.image) { showToast('أدخل العنوان والصورة', 'error'); return; }
                                if (editingBannerId) {
                                    dispatch({ type: 'UPDATE_BANNER', banner: { id: editingBannerId, ...bannerForm } });
                                    showToast('تم تحديث البانر ✅');
                                } else {
                                    dispatch({ type: 'ADD_BANNER', banner: { id: `BNR - ${Date.now()} `, ...bannerForm } });
                                    showToast('تم إضافة البانر ✅');
                                }
                                setShowBannerModal(false);
                            }}><Save size={16} /> {editingBannerId ? 'تحديث' : 'إضافة'}</button>
                        </div>
                    </div>
                </div>
            )}
            {showRewardModal && (
                <div className="modal-overlay" onClick={() => setShowRewardModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingRewardId ? '✏️ تعديل المكافأة' : '➕ إضافة مكافأة جديدة'}</h2>
                            <button className="nav-icon-btn" onClick={() => setShowRewardModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>عنوان المكافأة *</label>
                                        <input value={rewardForm.title || ''} onChange={e => setRewardForm(f => ({ ...f, title: e.target.value }))} placeholder="مثلاً: خصم 50 ريال"
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>أيقونة</label>
                                        <input value={rewardForm.icon || ''} onChange={e => setRewardForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎁"
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', textAlign: 'center' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>التكلفة (نقاط) *</label>
                                        <input type="number" value={rewardForm.pointsCost || ''} onChange={e => setRewardForm(f => ({ ...f, pointsCost: Number(e.target.value) }))}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>لون السمّة</label>
                                        <input type="color" value={rewardForm.color || '#4CAF50'} onChange={e => setRewardForm(f => ({ ...f, color: e.target.value }))}
                                            style={{ width: '100%', height: 42, padding: 4, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>قيمة الخصم *</label>
                                        <input type="number" value={rewardForm.discountValue || ''} onChange={e => setRewardForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>نوع الخصم</label>
                                        <select value={rewardForm.discountType} onChange={e => setRewardForm(f => ({ ...f, discountType: e.target.value as any }))}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)' }}>
                                            <option value="percentage">نسبة مئوية (%)</option>
                                            <option value="fixed">مبلغ ثابت ({s.currencySymbol})</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>وصف المكافأة</label>
                                    <textarea value={rewardForm.description || ''} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowRewardModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={() => {
                                if (!rewardForm.title || !rewardForm.pointsCost || !rewardForm.discountValue) { showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return; }
                                if (editingRewardId) {
                                    dispatch({ type: 'UPDATE_REWARD', reward: { id: editingRewardId, ...rewardForm } as LoyaltyReward });
                                    showToast('تم تحديث المكافأة ✅');
                                } else {
                                    dispatch({ type: 'ADD_REWARD', reward: { id: `RWD-${Date.now()}`, ...rewardForm } as LoyaltyReward });
                                    showToast('تم إضافة المكافأة ✅');
                                }
                                setShowRewardModal(false);
                            }}><Save size={16} /> {editingRewardId ? 'تحديث' : 'إضافة'}</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Discount Modal */}
            {showDiscountModal && (
                <div className="modal-overlay" onClick={() => setShowDiscountModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingDiscountId ? 'تعديل التخفيض' : 'إضافة تخفيض جديد'}</h2>
                            <button className="nav-icon-btn" onClick={() => setShowDiscountModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>اسم الكوبون / قاعدة الخصم</label>
                                <input
                                    type="text"
                                    placeholder="مثال: SAVE20"
                                    value={discountForm.name}
                                    onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>نوع الخصم</label>
                                <select
                                    value={discountForm.type}
                                    onChange={e => setDiscountForm({ ...discountForm, type: e.target.value as 'percentage' | 'fixed' })}
                                >
                                    <option value="percentage">نسبة مئوية (%)</option>
                                    <option value="fixed">مبلغ ثابت ({s.currencySymbol})</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>القيمة</label>
                                <input
                                    type="number"
                                    value={discountForm.value}
                                    onChange={e => setDiscountForm({ ...discountForm, value: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <input
                                    type="checkbox"
                                    id="discount-active"
                                    checked={discountForm.active}
                                    onChange={e => setDiscountForm({ ...discountForm, active: e.target.checked })}
                                />
                                <label htmlFor="discount-active" style={{ marginBottom: 0 }}>تفعيل الخصم حالياً</label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDiscountModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={() => {
                                if (!discountForm.name || !discountForm.value) {
                                    showToast('يرجى إكمال البيانات', 'error');
                                    return;
                                }
                                if (editingDiscountId) {
                                    dispatch({ type: 'UPDATE_DISCOUNT_RULE', rule: { ...discountForm, id: editingDiscountId } as DiscountRule });
                                    showToast('تم تحديث التخفيض ✅');
                                } else {
                                    dispatch({ type: 'ADD_DISCOUNT_RULE', rule: { ...discountForm, id: `DISC-${Date.now()}` } as DiscountRule });
                                    showToast('تم إضافة التخفيض 🎉');
                                }
                                setShowDiscountModal(false);
                            }}>
                                {editingDiscountId ? 'حفظ التغييرات' : 'إضافة التخفيض'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Review Reply Modal */}
            {showReviewModal && currentReview && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>الرد على التقييم (من {currentReview.customerName})</h2>
                            <button className="nav-icon-btn" onClick={() => setShowReviewModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 15 }}>« {currentReview.comment} »</p>
                            <div className="form-group">
                                <label>رد المتجر</label>
                                <textarea
                                    value={reviewReplyText}
                                    onChange={e => setReviewReplyText(e.target.value)}
                                    placeholder="اكتب ردك هنا..."
                                    rows={4}
                                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={() => {
                                dispatch({ type: 'ADD_REVIEW', review: { ...currentReview, adminReply: reviewReplyText, repliedAt: Date.now() } } as any);
                                showToast('تم حفظ الرد ✅');
                                setShowReviewModal(false);
                            }}>حفظ الرد</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
