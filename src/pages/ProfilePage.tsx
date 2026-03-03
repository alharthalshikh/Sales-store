import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { formatOrderId } from '../utils/formatOrderId';

// حساب مستوى الولاء بناءً على النقاط
function getLoyaltyTier(points: number) {
    if (points >= 1000) return { name: 'ماسي', icon: '💎', color: '#B9F2FF', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', next: null, progress: 100 };
    if (points >= 500) return { name: 'ذهبي', icon: '🥇', color: '#FFD700', gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', next: 1000, progress: (points / 1000) * 100 };
    if (points >= 200) return { name: 'فضي', icon: '🥈', color: '#C0C0C0', gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)', next: 500, progress: (points / 500) * 100 };
    return { name: 'برونزي', icon: '🥉', color: '#CD7F32', gradient: 'linear-gradient(135deg, #C8860A 0%, #FFD700 100%)', next: 200, progress: (points / 200) * 100 };
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
                    background: tier.gradient,
                    borderRadius: '24px',
                    padding: '32px',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '32px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                }}>
                    {/* تأثير زجاجي في الخلفية */}
                    <div style={{
                        position: 'absolute', top: '-50%', right: '-20%',
                        width: '300px', height: '300px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        filter: 'blur(40px)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-30%', left: '-10%',
                        width: '200px', height: '200px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '50%',
                        filter: 'blur(30px)',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '4px' }}>بطاقة عضوية</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{s.storeName}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem' }}>{tier.icon}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>عضو {tier.name}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>صاحب البطاقة</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                    {userData?.name || adminName || user?.displayName || user?.email?.split('@')[0] || 'عميل'}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                                    {adminEmail || user?.email}
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>نقاط الولاء</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalPoints}</div>
                            </div>
                        </div>

                        {/* شريط التقدم للمستوى التالي */}
                        {tier.next && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8, marginBottom: '6px' }}>
                                    <span>التقدم نحو المستوى التالي</span>
                                    <span>{totalPoints} / {tier.next}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${tier.progress}%`,
                                        height: '100%',
                                        background: 'rgba(255,255,255,0.8)',
                                        borderRadius: '10px',
                                        transition: 'width 1s ease',
                                    }} />
                                </div>
                            </div>
                        )}
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
