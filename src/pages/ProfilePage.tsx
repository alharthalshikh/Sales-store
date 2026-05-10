import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { formatOrderId } from '../utils/formatOrderId';

// حساب مستوى الولاء بناءً على النقاط
function getLoyaltyTier(points: number) {
    if (points >= 1000) return { name: 'ماسي', icon: '💎', color: '#B9F2FF', gradient: 'linear-gradient(135deg, #000000 0%, #D4AF37 50%, #000000 100%)', next: null, progress: 100 };
    if (points >= 500) return { name: 'ذهبي', icon: '🥇', color: '#FFD700', gradient: 'linear-gradient(135deg, #1A1A1A 0%, #D4AF37 100%)', next: 1000, progress: (points / 1000) * 100 };
    if (points >= 200) return { name: 'فضي', icon: '🥈', color: '#C0C0C0', gradient: 'linear-gradient(135deg, #2c3e50 0%, #bdc3c7 100%)', next: 500, progress: (points / 500) * 100 };
    return { name: 'برونزي', icon: '🥉', color: '#CD7F32', gradient: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)', next: 200, progress: (points / 200) * 100 };
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const { state } = useStore();
    const { user, isAdmin, adminName, adminEmail, logout, userData } = useAuth();
    const s = state.settings;

    // حساب بيانات العميل من الطلبات (مع دعم الطلبات القديمة برقم الهاتف)
    const userPhone = userData?.phone || '';
    const userOrders = state.orders.filter(o =>
        (o.userId === user?.uid) || (o.customerPhone === userPhone && userPhone)
    );
    const totalSpent = userOrders.reduce((sum, o) => o.status === 'delivered' ? sum + o.total : sum, 0);
    const totalPoints = userOrders.reduce((sum, o) => o.status === 'delivered' ? sum + (o.loyaltyPointsEarned || 0) : sum, 0);
    const tier = getLoyaltyTier(totalPoints);

    const statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار',
        processing: 'جاري التجهيز',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي',
    };

    const statusColors: Record<string, string> = {
        pending: '#FF9800',
        processing: '#2196F3',
        shipped: '#9C27B0',
        delivered: '#4CAF50',
        cancelled: '#F44336',
    };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

    if (!user) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🔒</div>
                    <h2 style={{ marginBottom: '12px' }}>يرجى تسجيل الدخول</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>سجل دخولك لعرض ملفك الشخصي ونقاط الولاء</p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>تسجيل الدخول</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px', maxWidth: '900px' }}>

                {/* ===== بطاقة العضوية الرقمية ===== */}
                <div className="profile-loyalty-card" style={{
                    background: '#0A0A0A',
                    borderRadius: '24px',
                    padding: '40px 32px',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '32px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                }}>
                    {/* Decorative Gold Curves from the business card */}
                    <div style={{
                        position: 'absolute', top: '-40px', right: '-40px',
                        width: '180px', height: '180px',
                        background: 'linear-gradient(135deg, transparent 40%, #C5A059 45%, #E8D5B5 50%, #C5A059 55%, transparent 60%)',
                        borderRadius: '50%',
                        opacity: 0.8,
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-60px', left: '-60px',
                        width: '220px', height: '220px',
                        background: 'linear-gradient(135deg, transparent 40%, #C5A059 45%, #E8D5B5 50%, #C5A059 55%, transparent 60%)',
                        borderRadius: '50%',
                        opacity: 0.6,
                        transform: 'rotate(180deg)'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ 
                                fontSize: '4.5rem', 
                                fontWeight: 900, 
                                lineHeight: 1,
                                background: 'linear-gradient(to bottom, #E8D5B5, #C5A059, #8E6F3E)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                                marginBottom: '10px'
                            }}>HS</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '4px', color: '#E8D5B5' }}>HOME STORE</div>
                            <div style={{ fontSize: '0.85rem', color: '#C5A059', marginTop: '4px', opacity: 0.9 }}>كل ما تحتاجه تحت سقف واحد</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px solid rgba(197, 160, 89, 0.2)', paddingTop: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>Card Holder</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                                    {userData?.name || adminName || user?.displayName || 'VIP CUSTOMER'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>LOYALTY POINTS</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#C5A059' }}>{totalPoints}</div>
                            </div>
                        </div>

                        <div style={{ position: 'absolute', top: '-10px', left: '0' }}>
                            <div style={{ 
                                padding: '4px 12px', 
                                borderRadius: '12px', 
                                background: 'linear-gradient(90deg, #C5A059, #8E6F3E)',
                                fontSize: '0.7rem', 
                                fontWeight: 800,
                                color: '#000'
                            }}>
                                {tier.name} MEMBER
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== الإحصائيات السريعة ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {[
                        { label: 'إجمالي المشتريات', value: `${totalSpent.toFixed(0)} ${s.currencySymbol}`, icon: '💰', color: 'var(--accent)' },
                        { label: 'عدد الطلبات', value: userOrders.length, icon: '📦', color: '#2196F3' },
                        { label: 'نقاط الولاء', value: totalPoints, icon: '🎁', color: '#4CAF50' },
                        { label: 'قيمة النقاط', value: `${(totalPoints * 0.1).toFixed(0)} ${s.currencySymbol}`, icon: '💳', color: '#9C27B0' },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* ===== سجل الطلبات ===== */}
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '24px',
                }}>
                    <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>📋 سجل الطلبات</h3>
                    {userOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
                            <p>لم تقم بأي طلب بعد</p>
                            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/products')}>تصفح المنتجات</button>
                        </div>
                    ) : (
                        <div className="orders-scroll-container" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            maxHeight: '320px',
                            overflowY: 'auto',
                            paddingLeft: '8px', // space for scrollbar
                            direction: 'rtl'
                        }}>
                            {userOrders.map(order => (
                                <div key={order.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'var(--bg)',
                                    border: '1px solid var(--border)',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    flexShrink: 0
                                }}>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                                            رقم الطلب: {formatOrderId(order.id)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            {formatDate(order.createdAt)} · {order.items.length} منتج
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: 'var(--accent)' }}>
                                        {order.total.toFixed(0)} {s.currencySymbol}
                                    </div>
                                    <div style={{
                                        padding: '4px 14px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: '#fff',
                                        background: statusColors[order.status] || '#888',
                                    }}>
                                        {statusLabels[order.status]}
                                    </div>
                                    {order.loyaltyPointsEarned && order.status === 'delivered' ? (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                                            🎁 +{order.loyaltyPointsEarned} نقطة
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ===== أزرار الإجراءات ===== */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                            ⚙️ لوحة التحكم
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => navigate('/products')}>
                        🛒 تصفح المنتجات
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/messages')}>
                        💬 المحادثات
                    </button>
                    <button
                        className="btn"
                        style={{ background: 'var(--error)', color: '#fff' }}
                        onClick={async () => { await logout(); navigate('/login'); }}
                    >
                        🚪 تسجيل الخروج
                    </button>
                </div>

                <style>{`
                    .orders-scroll-container::-webkit-scrollbar {
                        width: 6px;
                    }
                    .orders-scroll-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .orders-scroll-container::-webkit-scrollbar-thumb {
                        background: var(--border);
                        border-radius: 10px;
                    }
                    .orders-scroll-container::-webkit-scrollbar-thumb:hover {
                        background: var(--accent);
                    }
                `}</style>
            </div>
        </div>
    );
}
