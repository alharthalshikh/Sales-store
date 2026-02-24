import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MessageCircle, Tag, MapPin, Navigation } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../components/ToastContainer';
import { Order } from '../types';

declare var L: any; // Leaflet global

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state, dispatch, cartTotal, getFinalPrice } = useStore();
    const s = state.settings;
    const [form, setForm] = useState({
        name: user?.user_metadata?.full_name || '',
        phone: user?.user_metadata?.phone || '',
        address: '',
        notes: ''
    });

    useEffect(() => {
        if (!user) {
            showToast('يرجى تسجيل الدخول لإتمام عملية الشراء', 'error');
            navigate('/login');
        }

        // Load Leaflet
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
    }, [user]);

    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [distance, setDistance] = useState<number>(0);
    const [showMap, setShowMap] = useState(false);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);

    const reverseGeocode = async (lat: number, lng: number) => {
        setLoadingAddress(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`);
            const data = await response.json();
            if (data && data.display_name) {
                // نأخذ الجزء الأول من العنوان ليكون أكثر اختصاراً إذا فضل المستخدم ذلك، 
                // أو العنوان كاملاً. هنا سنأخذ العنوان كاملاً.
                setForm(prev => ({ ...prev, address: data.display_name }));
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        } finally {
            setLoadingAddress(false);
        }
    };

    const handleGetLocation = (map?: any, m?: any) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                updateLocation(latitude, longitude);

                const targetMap = map || mapInstance;
                const targetMarker = m || marker;

                if (targetMarker) targetMarker.setLatLng([latitude, longitude]);
                if (targetMap) targetMap.setView([latitude, longitude], 15);
                showToast('تم تحديد موقعك بدقة 📍', 'success');
            }, (err) => {
                if (err.code === 1) {
                    showToast('يرجى تفعيل إذن الموقع في المتصفح للحصول على موقعك التلقائي', 'error');
                } else {
                    showToast('تعذر الحصول على موقعك، يرجى تحديده يدوياً على الخريطة', 'error');
                }
            }, { timeout: 10000, enableHighAccuracy: true });
        } else {
            showToast('متصفحك لا يدعم تحديد الموقع التلقائي', 'error');
        }
    };

    useEffect(() => {
        if (showMap && typeof L !== 'undefined') {
            const timer = setTimeout(() => {
                // التأكد من عدم وجود خريطة سابقة قبل الإنشاء
                if (mapInstance) {
                    try { mapInstance.remove(); } catch (e) { }
                }

                const center = location || { lat: s.storeLat || 24.7136, lng: s.storeLng || 46.6753 };
                const map = L.map('delivery-map', {
                    zoomControl: true,
                    scrollWheelZoom: true
                }).setView([center.lat, center.lng], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);

                const m = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);

                m.on('dragend', (e: any) => {
                    const pos = e.target.getLatLng();
                    updateLocation(pos.lat, pos.lng);
                });

                map.on('click', (e: any) => {
                    const pos = e.latlng;
                    m.setLatLng(pos);
                    updateLocation(pos.lat, pos.lng);
                });

                setMapInstance(map);
                setMarker(m);

                // تحديد الموقع التلقائي فقط إذا لم يتم تحديده مسبقاً
                if (!location) {
                    handleGetLocation(map, m);
                }
            }, 300); // زيادة المهلة للتأكد من رندر الـ DOM
            return () => clearTimeout(timer);
        } else if (!showMap && mapInstance) {
            // تنظيف الخريطة عند الإغلاق
            try {
                mapInstance.remove();
                setMapInstance(null);
                setMarker(null);
            } catch (e) { }
        }
    }, [showMap]);
    const updateLocation = (lat: number, lng: number) => {
        setLocation({ lat, lng });
        if (s.storeLat && s.storeLng) {
            const d = calculateDistance(s.storeLat, s.storeLng, lat, lng);
            setDistance(d);
        }
        reverseGeocode(lat, lng);
    };

    const [sendVia, setSendVia] = useState<'whatsapp' | 'internal'>('whatsapp');
    const [acceptTerms, setAcceptTerms] = useState(false);

    // نظام الكوبونات
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ name: string; type: string; value: number } | null>(null);
    const [couponError, setCouponError] = useState('');

    // المبالغ والشحن
    const minOrder = s.minOrder || 0;
    const freeShippingThreshold = s.freeShippingThreshold || 0;
    const isUnderMinOrder = cartTotal < minOrder;
    const isFreeShipping = freeShippingThreshold > 0 && cartTotal >= freeShippingThreshold;

    // حساب رسوم التوصيل بناء على المسافة
    const distanceFee = distance * (s.deliveryPricePerKm || 0);
    const shippingFee = isFreeShipping ? 0 : (s.deliveryFee || 0) + distanceFee;

    // حساب الخصم والمجموع النهائي
    const couponDiscount = appliedCoupon
        ? appliedCoupon.type === 'percentage'
            ? (cartTotal * appliedCoupon.value) / 100
            : Math.min(appliedCoupon.value, cartTotal)
        : 0;
    const finalTotal = cartTotal - couponDiscount + shippingFee;

    const handleApplyCoupon = () => {
        setCouponError('');
        if (!couponCode.trim()) { setCouponError('أدخل كود الكوبون'); return; }

        const rule = state.discountRules.find(r =>
            r.name.toLowerCase() === couponCode.trim().toLowerCase() && r.active
        );

        if (!rule) {
            setCouponError('كوبون غير صالح أو منتهي الصلاحية');
            setAppliedCoupon(null);
            return;
        }

        const now = Date.now();
        if (rule.startDate && now < rule.startDate) { setCouponError('هذا الكوبون لم يبدأ صلاحيته بعد'); return; }
        if (rule.endDate && now > rule.endDate) { setCouponError('هذا الكوبون منتهي الصلاحية'); return; }

        setAppliedCoupon({ name: rule.name, type: rule.type, value: rule.value });
        showToast(`تم تطبيق الكوبون "${rule.name}" بنجاح! 🎉`, 'success');
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    if (state.cart.length === 0) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
                    <h2>السلة فارغة</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '24px' }}>أضف منتجات إلى سلتك أولاً</p>
                    <button className="btn btn-primary" onClick={() => navigate('/products')}>تصفح المنتجات</button>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone) { showToast('يرجى ملء الاسم ورقم الهاتف', 'error'); return; }
        if (!acceptTerms) { showToast('يرجى الموافقة على الشروط والأحكام أولاً', 'error'); return; }

        // إنشاء رقم طلب تقني متوافق مع قاعدة البيانات (UUID) ورقم مكتبي للقراءة (Human Readable)
        const technicalId = crypto.randomUUID();
        const displayId = `ORD-${Date.now().toString().slice(-6)}`;
        const earnedPoints = s.loyaltyEnabled ? Math.floor(finalTotal / (s.loyaltyPointsRatio || 10)) : 0;

        const order: Order = {
            id: technicalId, // يجب أن يكون UUID ليتوافق مع قاعدة البيانات
            items: state.cart,
            total: finalTotal,
            customerName: form.name,
            customerPhone: form.phone,
            customerAddress: form.address,
            customerLat: location?.lat,
            customerLng: location?.lng,
            customerNotes: form.notes,
            status: 'pending',
            paymentMethod: 'cod',
            loyaltyPointsEarned: earnedPoints,
            userId: user?.id,
            createdAt: Date.now(),
        };
        dispatch({ type: 'ADD_ORDER', order });

        const itemsList = state.cart.map(item => {
            const price = getFinalPrice(item.product);
            return `• ${item.product.name} × ${item.quantity} = ${(price * item.quantity).toFixed(0)} ${s.currencySymbol}`;
        }).join('\n');

        const couponLine = appliedCoupon ? `\n🎟️ كوبون: ${appliedCoupon.name} (-${couponDiscount.toFixed(0)} ${s.currencySymbol})` : '';

        const shippingLine = shippingFee > 0 ? `\n🚚 رسوم التوصيل: ${shippingFee.toFixed(0)} ${s.currencySymbol}${distance > 0 ? ` (${distance.toFixed(1)} كم)` : ''}` : '';
        const message = `🛒 طلب جديد من ${s.storeName}\n\n📋 رقم الطلب: ${displayId}\n\n👤 الاسم: ${form.name}\n📱 الهاتف: ${form.phone}\n📍 العنوان: ${form.address || 'غير محدد'}\n${location ? `📌 الموقع: https://www.google.com/maps?q=${location.lat},${location.lng}` : ''}\n\n📦 المنتجات:\n${itemsList}${couponLine}${shippingLine}\n\n💰 المجموع الكلي: ${finalTotal.toFixed(0)} ${s.currencySymbol}\n🎁 نقاط الولاء المكتسبة: ${earnedPoints}\n\n📝 ملاحظات: ${form.notes || 'لا يوجد'}`;

        if (sendVia === 'whatsapp') {
            window.open(`https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            dispatch({
                type: 'ADD_MESSAGE',
                message: {
                    id: crypto.randomUUID(), // UUID متوافق
                    senderName: form.name,
                    senderPhone: form.phone,
                    content: message,
                    isFromAdmin: false,
                    orderId: order.id,
                    createdAt: Date.now(),
                    read: false,
                    status: 'unread'
                },
            });
        }

        dispatch({ type: 'CLEAR_CART' });

        // 🎟️ إبطال الكوبون بعد الاستخدام (إذا كان كوبون مكافأة)
        if (appliedCoupon && appliedCoupon.name.startsWith('REW-')) {
            const rule = state.discountRules.find(r => r.name === appliedCoupon.name);
            if (rule) {
                // 1. حذفه من السيرفر لمنع استخدامه مرة أخرى
                dispatch({ type: 'REMOVE_DISCOUNT_RULE', ruleId: rule.id });

                // 2. تحديث حالته في الذاكرة المحلية للمستخدم
                const userPhone = user?.phone || user?.user_metadata?.phone || '';
                if (userPhone) {
                    try {
                        const redeemed = JSON.parse(localStorage.getItem(`redeemed_coupons_${userPhone}`) || '[]');
                        const updated = redeemed.map((c: any) =>
                            c.code === appliedCoupon.name ? { ...c, used: true } : c
                        );
                        localStorage.setItem(`redeemed_coupons_${userPhone}`, JSON.stringify(updated));
                    } catch (e) {
                        console.error('Failed to update coupon status in localStorage:', e);
                    }
                }
            }
        }

        showToast('تم إرسال الطلب بنجاح! 🎉', 'success');
        navigate('/');
    };

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
                <div className="section-header" style={{ marginBottom: '30px' }}>
                    <div className="section-badge">📝 إتمام الطلب</div>
                    <h2>تفاصيل الطلب</h2>
                    <p>أكمل بياناتك لإرسال الطلب</p>
                </div>
                <div className="checkout-grid">
                    <form className="checkout-form" onSubmit={handleSubmit}>
                        <div className="form-group"><label>الاسم الكامل *</label><input type="text" placeholder="أدخل اسمك" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="form-group"><label>رقم الهاتف *</label><input type="tel" placeholder="05xxxxxxxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required dir="ltr" /></div>
                        <div className="form-group">
                            <label>العنوان السكني *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="أو سيتم تحديده تلقائياً من الخريطة..."
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    required
                                />
                                {loadingAddress && (
                                    <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--accent)' }}>
                                        جاري جلب العنوان...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 🗺️ اختيار الموقع */}
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={16} /> موقع التوصيل البدقيق
                            </label>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" onClick={() => setShowMap(true)} className="btn btn-secondary" style={{ flex: 1, gap: 8 }}>
                                    <Navigation size={16} /> {location ? 'تحديث الموقع' : 'تحديد على الخريطة'}
                                </button>
                                {location && (
                                    <div style={{ flex: 1.5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700 }}>
                                        ✅ تم التحديد ({distance.toFixed(1)} كم)
                                    </div>
                                )}
                            </div>
                        </div>

                        {showMap && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                                <div style={{ background: 'var(--bg)', borderRadius: 24, width: '100%', maxWidth: 600, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>حدد موقع التوصيل</h3>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="button" onClick={handleGetLocation} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>موقعي الحالي 📍</button>
                                            <button type="button" onClick={() => setShowMap(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                                        </div>
                                    </div>
                                    <div id="delivery-map" style={{ height: 400, width: '100%' }}></div>
                                    <div style={{ padding: 20 }}>
                                        <button type="button" onClick={() => setShowMap(false)} className="btn btn-primary" style={{ width: '100%' }}>تأكيد الموقع</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group"><label>ملاحظات إضافية</label><textarea placeholder="أي ملاحظات خاصة بالطلب..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

                        {/* 🎟️ حقل كوبون الخصم */}
                        <div style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '16px',
                            marginTop: '8px',
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                                <Tag size={16} /> كوبون خصم
                            </label>
                            {appliedCoupon ? (
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)',
                                    borderRadius: '12px', padding: '12px 16px',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>✅ {appliedCoupon.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            خصم {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${appliedCoupon.value} ${s.currencySymbol}`}
                                            {' '}= -{couponDiscount.toFixed(0)} {s.currencySymbol}
                                        </div>
                                    </div>
                                    <button type="button" onClick={removeCoupon} style={{
                                        background: 'rgba(244, 67, 54, 0.15)', color: '#F44336',
                                        border: 'none', borderRadius: '8px', padding: '6px 12px',
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                    }}>إزالة</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="أدخل كود الكوبون..."
                                            value={couponCode}
                                            onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                                            style={{ flex: 1, textTransform: 'uppercase' }}
                                            dir="ltr"
                                        />
                                        <button type="button" onClick={handleApplyCoupon} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                                            تطبيق
                                        </button>
                                    </div>
                                    {couponError && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>⚠️ {couponError}</div>}
                                </>
                            )}
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                            <input type="checkbox" id="terms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <label htmlFor="terms" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                أوافق على <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>الشروط والأحكام</a> وسياسة المتجر
                            </label>
                        </div>
                        <button type="submit" disabled={isUnderMinOrder} className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '24px', opacity: isUnderMinOrder ? 0.5 : 1, cursor: isUnderMinOrder ? 'not-allowed' : 'pointer' }}>
                            <Send size={20} /> {isUnderMinOrder ? `الحد الأدنى للطلب ${minOrder} ${s.currencySymbol}` : 'إرسال الطلب'}
                        </button>
                    </form>
                    <div className="checkout-summary">
                        <h3>🛒 ملخص الطلب</h3>
                        {state.cart.map(item => {
                            const price = getFinalPrice(item.product);
                            return (
                                <div key={item.product.id} className="summary-item">
                                    <div className="item-name"><span>{item.product.name}</span><span className="item-qty">×{item.quantity}</span></div>
                                    <span>{(price * item.quantity).toFixed(0)} {s.currencySymbol}</span>
                                </div>
                            );
                        })}
                        <hr className="summary-divider" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span>المجموع الفرعي</span>
                            <span>{cartTotal.toFixed(0)} {s.currencySymbol}</span>
                        </div>
                        {appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--success)' }}>
                                <span>🎟️ خصم الكوبون</span>
                                <span>-{couponDiscount.toFixed(0)} {s.currencySymbol}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span>🚚 رسوم التوصيل {distance > 0 && `(${distance.toFixed(1)} كم)`}</span>
                            <span>
                                {isFreeShipping ? (
                                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>مجاني</span>
                                ) : distance > 0 || !(s.deliveryPricePerKm || 0) ? (
                                    `${shippingFee.toFixed(0)} ${s.currencySymbol}`
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>يُحدد حسب المسافة 📍</span>
                                )}
                            </span>
                        </div>
                        <div className="summary-total">
                            <span>المجموع الكلي</span>
                            <span style={appliedCoupon ? { color: 'var(--success)' } : {}}>{finalTotal.toFixed(0)} {s.currencySymbol}</span>
                        </div>
                        {appliedCoupon && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center', marginTop: '8px' }}>
                                🎉 وفّرت {couponDiscount.toFixed(0)} {s.currencySymbol}!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
