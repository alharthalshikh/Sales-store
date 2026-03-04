import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { supabase } from '../lib/supabase';
import { dbToOrder } from '../context/StoreContextItems';
import { Order } from '../types';
import { formatOrderId } from '../utils/formatOrderId';

export default function TrackOrderPage() {
    const navigate = useNavigate();
    const { state } = useStore();
    const s = state.settings;
    const [searchQuery, setSearchQuery] = useState('');
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cloudOrders, setCloudOrders] = useState<Order[]>([]);

    const spinStyle = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    const query = searchQuery.trim().toUpperCase();
    const idPart = query.startsWith('ORD-') ? query.replace('ORD-', '') : query;

    // يعتبر رقم طلب إذا بدأ بـ ORD- أو كان طوله 8 أحرف ويتكون من أرقام وحروف A-F
    const isOrderIdQuery = query.startsWith('ORD-') || (idPart.length === 8 && /^[0-9A-F]+$/.test(idPart));

    const localOrders = state.orders.filter(o => {
        const orderIdPart = o.id.split('-')[0].toUpperCase();
        if (isOrderIdQuery) {
            return orderIdPart.startsWith(idPart);
        }
        return o.customerPhone === searchQuery.trim();
    });

    const customerOrders = searched
        ? [...new Map([...localOrders, ...cloudOrders].map(o => [o.id, o])).values()]
            .sort((a, b) => b.createdAt - a.createdAt)
        : [];

    const statusSteps = [
        { key: 'pending', label: 'قيد الانتظار', icon: '⏳', color: '#FF9800' },
        { key: 'processing', label: 'جاري التجهيز', icon: '🔄', color: '#2196F3' },
        { key: 'shipped', label: 'تم الشحن', icon: '🚚', color: '#9C27B0' },
        { key: 'delivered', label: 'تم التوصيل', icon: '✅', color: '#4CAF50' },
    ];

    const getStatusIndex = (status: string) => {
        if (status === 'cancelled') return -1;
        return statusSteps.findIndex(s => s.key === status);
    };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setCloudOrders([]);
        // سنقوم بتفعيل حالة البحث بعد انتهاء العملية لضمان عدم ظهور نتائج قديمة أثناء البحث

        try {
            let supabaseQuery = supabase.from('orders').select('*');

            if (isOrderIdQuery) {
                // البحث عن الطلب الذي يبدأ معرفه بهذا الجزء (Case-insensitive)
                supabaseQuery = supabaseQuery.ilike('id', `${idPart.toLowerCase()}%`);
            } else {
                // البحث برقم الهاتف
                supabaseQuery = supabaseQuery.eq('customer_phone', searchQuery.trim());
            }

            const { data, error } = await supabaseQuery;
            if (error) throw error;

            if (data) {
                setCloudOrders(data.map(dbToOrder));
            }
        } catch (err) {
            // console.error('Track search error:', err);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px', maxWidth: '800px' }}>

                {/* رأس الصفحة */}
                <div style={{
                    background: 'var(--gradient)',
                    borderRadius: '24px',
                    padding: '40px 32px',
                    textAlign: 'center',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '-40%', right: '-20%',
                        width: '250px', height: '250px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%', filter: 'blur(40px)',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                            تتبع طلبك
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,1)', fontSize: '1rem', fontWeight: 600 }}>
                            أدخل رقم الهاتف أو رقم الطلب لمتابعة الحالة
                        </p>
                    </div>
                </div>

                {/* حقل البحث */}
                <form onSubmit={handleSearch} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '32px',
                }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                        🔍 ابحث برقم الهاتف أو رقم الطلب (مثال: ORD-XXXX)
                    </label>
                    <style>{spinStyle}</style>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="رقم الهاتف أو رقم الطلب..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setSearched(false); }}
                            dir="ltr"
                            disabled={loading}
                            style={{
                                flex: '1 1 250px',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: loading ? 'var(--bg-secondary)' : 'var(--bg)',
                                color: 'var(--text)',
                                fontSize: '1.1rem',
                                fontFamily: 'var(--font)',
                                letterSpacing: '0.5px',
                                opacity: loading ? 0.7 : 1,
                            }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                padding: '14px 28px',
                                fontSize: '1rem',
                                minWidth: '160px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }} />
                                    <span>جاري البحث</span>
                                </>
                            ) : (
                                <>🔍 بحث</>
                            )}
                        </button>
                    </div>
                </form>

                {/* عرض النتائج */}
                {searched && (
                    <>
                        {customerOrders.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '50px 20px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '20px',
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
                                <h3 style={{ marginBottom: '8px' }}>لم نجد طلبات</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                    تأكد من رقم الهاتف المُدخل أو تواصل معنا
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button className="btn btn-primary" onClick={() => navigate('/products')}>تصفح المنتجات</button>
                                    <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                        📱 واتساب
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>
                                    📋 {customerOrders.length} طلب مسجّل
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {customerOrders.map(order => {
                                        const currentStep = getStatusIndex(order.status);
                                        const isCancelled = order.status === 'cancelled';

                                        return (
                                            <div key={order.id} style={{
                                                background: 'var(--surface)',
                                                border: `1px solid ${isCancelled ? 'rgba(244,67,54,0.3)' : 'var(--border)'}`,
                                                borderRadius: '20px',
                                                padding: '24px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}>
                                                {isCancelled && (
                                                    <div style={{
                                                        position: 'absolute', top: '12px', left: '12px',
                                                        background: '#F44336', color: '#fff',
                                                        padding: '4px 14px', borderRadius: '20px',
                                                        fontSize: '0.8rem', fontWeight: 700,
                                                    }}>❌ ملغي</div>
                                                )}

                                                {/* رأس الطلب */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>رقم الطلب: {formatOrderId(order.id)}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                                            {formatDate(order.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)' }}>
                                                            {order.total.toFixed(0)} {s.currencySymbol}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                                            {order.items.length} منتج
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Timeline الحالة */}
                                                {!isCancelled && (
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                                            {/* خط التقدم */}
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '20px',
                                                                left: '10%',
                                                                right: '10%',
                                                                height: '4px',
                                                                background: 'var(--border)',
                                                                borderRadius: '4px',
                                                                zIndex: 0,
                                                            }}>
                                                                <div style={{
                                                                    width: `${currentStep >= 0 ? (currentStep / (statusSteps.length - 1)) * 100 : 0}%`,
                                                                    height: '100%',
                                                                    background: 'var(--gradient)',
                                                                    borderRadius: '4px',
                                                                    transition: 'width 1s ease',
                                                                }} />
                                                            </div>

                                                            {statusSteps.map((step, i) => {
                                                                const isActive = i <= currentStep;
                                                                const isCurrent = i === currentStep;
                                                                return (
                                                                    <div key={step.key} style={{
                                                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                                        zIndex: 1, flex: 1,
                                                                    }}>
                                                                        <div style={{
                                                                            width: '40px', height: '40px',
                                                                            borderRadius: '50%',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: '1.2rem',
                                                                            background: isActive ? step.color : 'var(--bg)',
                                                                            border: `3px solid ${isActive ? step.color : 'var(--border)'}`,
                                                                            boxShadow: isCurrent ? `0 0 15px ${step.color}40` : 'none',
                                                                            transition: 'all 0.5s ease',
                                                                        }}>
                                                                            {step.icon}
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '0.7rem',
                                                                            marginTop: '8px',
                                                                            fontWeight: isCurrent ? 700 : 400,
                                                                            color: isActive ? 'var(--text)' : 'var(--text-light)',
                                                                            textAlign: 'center',
                                                                        }}>
                                                                            {step.label}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                                }

                                                {/* تفاصيل المنتجات */}
                                                <div style={{
                                                    background: 'var(--bg)',
                                                    borderRadius: '12px',
                                                    padding: '14px',
                                                }}>
                                                    {order.items.map(item => (
                                                        <div key={item.product.id} style={{
                                                            display: 'flex', justifyContent: 'space-between',
                                                            padding: '6px 0',
                                                            borderBottom: '1px solid var(--border)',
                                                            fontSize: '0.85rem',
                                                        }}>
                                                            <span>{item.product.name} ×{item.quantity}</span>
                                                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                                                {(item.product.price * item.quantity).toFixed(0)} {s.currencySymbol}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* نقاط الولاء المكتسبة */}
                                                {/* نقاط الولاء المكتسبة - تظهر فقط بعد التوصيل */}
                                                {(order.loyaltyPointsEarned ?? 0) > 0 && order.status === 'delivered' && (
                                                    <div style={{
                                                        marginTop: '12px', textAlign: 'center',
                                                        fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600,
                                                    }}>
                                                        🎁 كسبت {order.loyaltyPointsEarned} نقطة ولاء من هذا الطلب
                                                    </div>
                                                )}


                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* رابط سريع */}
                {!searched && (
                    <div style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '20px' }}>
                        <p>ليس لديك طلب بعد؟</p>
                        <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={() => navigate('/products')}>
                            🛍️ تصفح المنتجات
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
