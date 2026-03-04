import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Star, Sparkles, Copy, Check, ArrowLeft, Trophy, Zap, Trash2 } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../components/ToastContainer';
import { LoyaltyReward } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function RewardsPage() {
    const { state, dispatch } = useStore();
    const { user, userData } = useAuth();
    const s = state.settings;
    const [copiedCode, setCopiedCode] = useState('');

    const userPhone = userData?.phone || '';
    const userUniqueId = user?.uid || userPhone || 'default';
    const [redeemedCoupons, setRedeemedCoupons] = useState<{ code: string; reward: LoyaltyReward; used?: boolean }[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(`redeemed_coupons_${userUniqueId}`) || localStorage.getItem(`redeemed_coupons_${userPhone}`) || '[]');
        } catch { return []; }
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const handleDeleteCoupon = (code: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'حذف الكوبون',
            message: 'هل تريد حذف هذا الكوبون من قائمتك؟',
            onConfirm: () => {
                // 1. حذفه من القائمة المحلية
                const newCoupons = redeemedCoupons.filter(c => c.code !== code);
                setRedeemedCoupons(newCoupons);
                localStorage.setItem(`redeemed_coupons_${userUniqueId}`, JSON.stringify(newCoupons));

                // 2. محاولة حذفه من قاعدة البيانات (في حال لم يتم استخدامه وحذفه مسبقاً)
                const rule = state.discountRules.find(r => r.name === code);
                if (rule) {
                    dispatch({ type: 'REMOVE_DISCOUNT_RULE', ruleId: rule.id });
                }
                showToast('تم حذف الكوبون بنجاح');
            }
        });
    };

    // حساب نقاط المستخدم من الطلبات
    const userOrders = state.orders.filter(o =>
        (o.userId === user?.uid || (o.customerPhone === userPhone && userPhone)) &&
        o.status === 'delivered'
    );
    const totalPoints = userOrders.reduce((sum, o) => sum + (o.loyaltyPointsEarned || 0), 0);

    // نقاط مستخدمة (مستهلكة)
    const [usedPoints, setUsedPoints] = useState(() => {
        try {
            return Number(localStorage.getItem(`used_points_${userUniqueId}`) || localStorage.getItem(`used_points_${userPhone}`) || '0');
        } catch { return 0; }
    });
    // التأكد من عدم وجود قيم سالبة (الأمان)
    const availablePoints = Math.max(0, totalPoints - usedPoints);

    const handleRedeem = (reward: LoyaltyReward) => {
        if (availablePoints < reward.pointsCost) {
            showToast('نقاطك غير كافية لهذه المكافأة', 'error');
            return;
        }

        // Generate coupon code
        const code = `REW-${reward.id.slice(-4)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

        // Add discount rule
        dispatch({
            type: 'ADD_DISCOUNT_RULE',
            rule: {
                id: `RULE-${Date.now()}`,
                name: code, // الكود الذي سيدخله المستخدم في السلة
                type: reward.discountType,
                value: reward.discountValue,
                active: true,
                userId: user?.uid, // ربط الكوبون بالمستخدم
            }
        });

        // Update used points
        const newUsed = usedPoints + reward.pointsCost;
        setUsedPoints(newUsed);
        localStorage.setItem(`used_points_${userUniqueId}`, String(newUsed));

        const newCoupons = [...redeemedCoupons, { code, reward, used: false }];
        setRedeemedCoupons(newCoupons);
        localStorage.setItem(`redeemed_coupons_${userUniqueId}`, JSON.stringify(newCoupons));

        showToast(`🎉 تم تفعيل "${reward.title}" بنجاح! استخدم الكوبون في صفحة الدفع`, 'success');
    };

    const handleCopy = (code: string) => {
        if (!code) return;

        // دالة احتياطية للنسخ في حال فشل الـ API الحديث
        const fallbackCopyTextToClipboard = (text: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                // console.error('Fallback: Oops, unable to copy', err);
                return false;
            } finally {
                textArea.remove();
            }
        };

        const performCopy = () => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(code).then(() => {
                    setCopiedCode(code);
                    showToast('تم نسخ الكوبون ✅');
                }).catch(() => {
                    if (fallbackCopyTextToClipboard(code)) {
                        setCopiedCode(code);
                        showToast('تم نسخ الكوبون ✅');
                    }
                });
            } else {
                if (fallbackCopyTextToClipboard(code)) {
                    setCopiedCode(code);
                    showToast('تم نسخ الكوبون ✅');
                } else {
                    showToast('فشل النسخ تلقائياً، يرجى نسخه يدوياً', 'error');
                }
            }
        };

        performCopy();
        setTimeout(() => setCopiedCode(''), 3000);
    };

    if (!user) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔐</div>
                    <h2 style={{ fontWeight: 800, marginBottom: '12px' }}>سجل الدخول أولاً</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>يجب تسجيل الدخول للوصول لمكافآتك</p>
                    <Link to="/login" className="btn btn-primary btn-large">تسجيل الدخول</Link>
                </div>
            </div>
        );
    }

    // Tier calculation
    const tier = totalPoints >= 1000 ? { name: 'ماسي', icon: '💎', color: '#2196F3' }
        : totalPoints >= 500 ? { name: 'ذهبي', icon: '🥇', color: '#FF9800' }
            : totalPoints >= 200 ? { name: 'فضي', icon: '🥈', color: '#9E9E9E' }
                : { name: 'برونزي', icon: '🥉', color: '#CD7F32' };

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
                <div className="section-header" style={{ marginBottom: '30px' }}>
                    <div className="section-badge">🎁 مكافآتي</div>
                    <h2>متجر المكافآت</h2>
                    <p>حوّل نقاطك إلى كوبونات خصم حقيقية</p>
                </div>

                {/* Points Overview Card */}
                <div style={{
                    background: 'var(--gradient)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '32px',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '-30px', left: '-30px', width: '120px', height: '120px',
                        background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px',
                        background: 'rgba(255,255,255,0.08)', borderRadius: '50%'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trophy size={16} /> رصيدك الحالي
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{availablePoints}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>نقطة متاحة</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{tier.icon}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '20px' }}>
                                عضوية {tier.name}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{totalPoints}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>مجموع النقاط</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{userOrders.length}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>الطلبات</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Redeemed Coupons */}
                {redeemedCoupons.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={20} style={{ color: 'var(--accent)' }} /> كوبوناتك المُفعّلة
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {redeemedCoupons.map((rc, i) => (
                                <div key={i} style={{
                                    background: 'var(--surface)', border: `2px ${rc.used ? 'solid' : 'dashed'} ${rc.used ? 'var(--border)' : 'var(--accent)'}`,
                                    borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    opacity: rc.used ? 0.8 : 1
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: rc.used ? 'var(--text-secondary)' : 'var(--text)' }}>
                                            {rc.reward.icon} {rc.reward.title}
                                            {rc.used && <span style={{ marginRight: '8px', fontSize: '0.75rem', color: 'var(--success)', background: 'rgba(76,175,80,0.1)', padding: '2px 8px', borderRadius: '10px' }}>تم الاستخدام</span>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            خصم {rc.reward.discountType === 'percentage' ? `${rc.reward.discountValue}%` : `${rc.reward.discountValue} ${s.currencySymbol}`}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {!rc.used ? (
                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => handleCopy(rc.code)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {copiedCode === rc.code ? <><Check size={14} /> تم</> : <><Copy size={14} /> نسخ</>}
                                            </button>
                                        ) : (
                                            <button
                                                className="nav-icon-btn"
                                                onClick={() => handleDeleteCoupon(rc.code)}
                                                style={{ color: 'var(--error)', padding: '6px' }}
                                                title="حذف الميكافأة المستخدمة"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rewards Grid */}
                <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gift size={20} style={{ color: 'var(--accent)' }} /> المكافآت المتاحة
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {state.rewards.map(reward => {
                        const canRedeem = availablePoints >= reward.pointsCost;
                        const progress = Math.min((availablePoints / reward.pointsCost) * 100, 100);
                        return (
                            <div key={reward.id} style={{
                                background: 'var(--surface)',
                                border: `1px solid ${canRedeem ? reward.color : 'var(--border)'}`,
                                borderRadius: '20px',
                                padding: '24px',
                                position: 'relative',
                                overflow: 'hidden',
                                opacity: canRedeem ? 1 : 0.7,
                                transition: 'all 0.3s ease',
                            }}>
                                {canRedeem && (
                                    <div style={{
                                        position: 'absolute', top: '0', left: '0', right: '0', height: '3px',
                                        background: reward.color,
                                    }} />
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{reward.icon}</div>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{reward.title}</h4>
                                    </div>
                                    <div style={{
                                        background: `${reward.color}20`, color: reward.color,
                                        padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem',
                                    }}>
                                        {reward.pointsCost} نقطة
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                                    {reward.description}
                                </p>

                                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>
                                    {reward.discountType === 'percentage' ? `خصم ${reward.discountValue}%` : `خصم ${reward.discountValue} ${s.currencySymbol}`}
                                </div>

                                {/* Progress bar */}
                                <div style={{ background: 'var(--bg)', borderRadius: '8px', height: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                                    <div style={{
                                        width: `${progress}%`, height: '100%',
                                        background: canRedeem ? reward.color : 'var(--text-light)',
                                        borderRadius: '8px', transition: 'width 1s ease',
                                    }} />
                                </div>

                                <button
                                    className={`btn ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => handleRedeem(reward)}
                                    disabled={!canRedeem}
                                >
                                    {canRedeem ? (
                                        <><Zap size={16} /> استبدل الآن</>
                                    ) : (
                                        <>تحتاج {reward.pointsCost - availablePoints} نقطة إضافية</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* How it works */}
                <div style={{
                    marginTop: '48px', background: 'var(--surface)', borderRadius: '20px',
                    padding: '32px', border: '1px solid var(--border)',
                }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>💡 كيف تعمل المكافآت؟</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {[
                            { step: '1', title: 'اطلب منتجاتك', desc: `كل ${state.settings.loyaltyPointsRatio} ريال = 1 نقطة`, icon: '🛒' },
                            { step: '2', title: 'اجمع النقاط', desc: 'النقاط تتراكم من كل طلب', icon: '⭐' },
                            { step: '3', title: 'استبدل المكافأة', desc: 'حوّل نقاطك لكوبونات خصم', icon: '🎁' },
                            { step: '4', title: 'استخدم الكوبون', desc: 'تطبّق تلقائياً عند الشراء', icon: '✅' },
                        ].map(s_item => (
                            <div key={s_item.step} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{s_item.icon}</div>
                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{s_item.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s_item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                confirmText="نعم، حذف"
                cancelText="إلغاء"
            />
        </div>
    );
}
