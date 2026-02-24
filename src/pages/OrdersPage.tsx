import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { Star, RotateCcw, ChevronLeft, Package, Clock, Hash } from 'lucide-react';
import { Order } from '../types';

export default function OrdersPage() {
    const navigate = useNavigate();
    const { state, dispatch } = useStore();
    const { user } = useAuth();
    const s = state.settings;

    // Filter categories
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Get user orders
    const userOrders = state.orders.filter(o => {
        if (!user) return false;
        return o.userId === user.id;
    }).sort((a, b) => b.createdAt - a.createdAt);

    // Categories with "All"
    const filters = [
        { id: 'all', name: 'الكل', icon: '📋' },
        ...state.categories.map(c => ({ id: c.id, name: c.name, icon: c.icon }))
    ];

    // Filtered orders (if category filter is possible by items in order)
    const filteredOrders = userOrders.filter(order => {
        if (selectedCategory === 'all') return true;
        return order.items.some(item => item.product.categoryId === selectedCategory);
    });

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', label: 'تم التوصيل' };
            case 'shipped': return { bg: 'rgba(156, 39, 176, 0.15)', text: '#ce93d8', label: 'تم الشحن' };
            case 'processing': return { bg: 'rgba(33, 150, 243, 0.15)', text: '#90caf9', label: 'جاري التجهيز' };
            case 'pending': return { bg: 'rgba(255, 152, 0, 0.15)', text: '#ffb74d', label: 'قيد الانتظار' };
            case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', label: 'ملغي' };
            default: return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', label: 'غير معروف' };
        }
    };

    const handleRepeatOrder = (order: Order) => {
        // Clear cart and add items from order
        dispatch({ type: 'CLEAR_CART' });
        order.items.forEach(item => {
            dispatch({ type: 'ADD_TO_CART', product: item.product, quantity: item.quantity });
        });
        dispatch({ type: 'SET_CART_OPEN', isOpen: true });
    };

    return (
        <div className="page" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <header style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(var(--bg-rgb), 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border)'
            }}>
                <button onClick={() => navigate(-1)} style={{
                    background: 'var(--surface)',
                    border: 'none',
                    borderRadius: '12px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text)',
                    cursor: 'pointer'
                }}>
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>طلباتي</h1>
            </header>

            <div className="container" style={{ paddingTop: '20px' }}>

                {/* Horizontal Category Filters */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '4px 4px 20px',
                    marginBottom: '10px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }} className="no-scrollbar">
                    {filters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedCategory(filter.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                borderRadius: '25px',
                                border: '1px solid',
                                borderColor: selectedCategory === filter.id ? 'var(--accent)' : 'var(--border)',
                                background: selectedCategory === filter.id ? 'var(--accent)' : 'var(--surface)',
                                color: selectedCategory === filter.id ? '#000' : 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                boxShadow: selectedCategory === filter.id ? '0 4px 12px rgba(200, 134, 10, 0.3)' : 'none'
                            }}
                        >
                            <span>{filter.icon}</span>
                            {filter.name}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.6 }}>
                        <Package size={64} style={{ marginBottom: '20px', color: 'var(--accent)' }} />
                        <h3 style={{ marginBottom: '8px' }}>لا توجد طلبات بعد</h3>
                        <p style={{ fontSize: '0.9rem' }}>ابدأ بالتسوق الآن وأضف طلبك الأول!</p>
                        <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>تصفح المنتجات</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredOrders.map(order => {
                            const status = getStatusColor(order.status);
                            const firstItem = order.items[0];

                            return (
                                <div key={order.id} style={{
                                    background: 'var(--surface)',
                                    borderRadius: '24px',
                                    border: '1px solid var(--border)',
                                    padding: '20px',
                                    boxShadow: 'var(--shadow-md)',
                                    transition: 'transform 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Status Badge */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            background: status.bg,
                                            color: status.text,
                                            fontSize: '0.8rem',
                                            fontWeight: 700
                                        }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.text }} />
                                            {status.label}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(239, 68, 68, 0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🛵 توصيل
                                        </div>
                                    </div>

                                    {/* Order Content */}
                                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                        {/* Product Image */}
                                        <div style={{
                                            width: '85px',
                                            height: '85px',
                                            borderRadius: '18px',
                                            overflow: 'hidden',
                                            background: 'var(--bg-alt)',
                                            border: '1px solid var(--border)',
                                            flexShrink: 0
                                        }}>
                                            <img
                                                src={firstItem?.product.image || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&q=80'}
                                                alt=""
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>

                                        {/* Details */}
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)' }}>
                                                {firstItem?.product.name} {order.items.length > 1 && `و ${order.items.length - 1} آخرين`}
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)', fontSize: '0.82rem' }}>
                                                    <Clock size={14} />
                                                    {formatDate(order.createdAt)} | <Hash size={12} /> {order.id.slice(-7)}
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={15} fill={star <= 5 ? 'var(--accent)' : 'none'} color={star <= 5 ? 'var(--accent)' : 'var(--text-light)'} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div style={{
                                        borderTop: '1px solid var(--border)',
                                        paddingTop: '16px',
                                        marginTop: '16px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>إجمالي الطلب</span>
                                            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'rgba(239, 68, 68, 0.9)' }}>
                                                {order.total.toFixed(0)} <span style={{ fontSize: '0.9rem' }}>{s.currencySymbol}</span>
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleRepeatOrder(order)}
                                            style={{
                                                width: '100%',
                                                background: 'var(--accent)',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '16px',
                                                padding: '14px',
                                                fontSize: '1rem',
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 8px 20px rgba(200, 134, 10, 0.2)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                            onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                                        >
                                            <RotateCcw size={18} />
                                            تكرار الطلب
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .container {
                    padding-left: 20px;
                    padding-right: 20px;
                }
            `}</style>
        </div>
    );
}
