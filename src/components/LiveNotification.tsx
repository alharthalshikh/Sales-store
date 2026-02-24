import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { ShoppingBag, X, CheckCircle } from 'lucide-react';

interface Notification {
    id: string;
    name: string;
    city: string;
    product: string;
    image: string;
    time: string;
    visible: boolean;
    isReal?: boolean;
}

export default function LiveNotification() {
    const { state } = useStore();
    const [notification, setNotification] = useState<Notification | null>(null);

    // دالة لمسح الاسم الأول فقط للخصوصية
    const getFirstName = (fullName: string) => {
        if (!fullName) return 'عميل';
        return fullName.trim().split(' ')[0];
    };

    // دالة لحساب الوقت النسبي
    const getTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `قبل ${minutes} دقيقة`;
        if (hours < 24) return `قبل ${hours} ساعة`;
        return `قبل ${days} يوم`;
    };

    const showNotification = useCallback(() => {
        // نفضل استخدام الطلبات الحقيقية إذا وجدت
        const realOrders = state.orders.filter(o => o.status !== 'cancelled').slice(0, 10);

        let newNotif: Notification;

        if (realOrders.length > 0) {
            // اختيار طلب عشوائي من آخر ١٠ طلبات حقيقية
            const order = realOrders[Math.floor(Math.random() * realOrders.length)];
            const mainItem = order.items[0];

            if (!mainItem) return;

            newNotif = {
                id: order.id + Date.now(),
                name: getFirstName(order.customerName),
                city: order.customerAddress.split('-')[0].split(',')[0].trim(), // محاولة استخراج المدينة
                product: mainItem.product.name,
                image: mainItem.product.image,
                time: getTimeAgo(order.createdAt),
                visible: true,
                isReal: true
            };
        } else if (state.products.length > 0) {
            // بيانات تجريبية "احتياطية" في حال عدم وجود طلبات بعد
            const cities = ['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام'];
            const names = ['أحمد', 'فهد', 'نورة', 'سارة', 'عبدالله'];
            const product = state.products[Math.floor(Math.random() * state.products.length)];

            newNotif = {
                id: 'demo-' + Date.now(),
                name: names[Math.floor(Math.random() * names.length)],
                city: cities[Math.floor(Math.random() * cities.length)],
                product: product.name,
                image: product.image,
                time: 'منذ قليل',
                visible: true,
                isReal: false
            };
        } else {
            return;
        }

        setNotification(newNotif);

        // إخفاء تلقائي بعد ٧ ثوانٍ
        const hideTimeout = setTimeout(() => {
            setNotification(prev => prev && prev.id === newNotif.id ? { ...prev, visible: false } : prev);
        }, 7000);

        // الإزالة من الواجهة بعد انتهاء الحركة
        const removeTimeout = setTimeout(() => {
            setNotification(prev => prev && prev.id === newNotif.id ? null : prev);
        }, 7600);

        return () => {
            clearTimeout(hideTimeout);
            clearTimeout(removeTimeout);
        };
    }, [state.orders, state.products]);

    useEffect(() => {
        // أول تنبيه بعد ٢٠ ثانية من فتح الموقع
        const firstTimer = setTimeout(showNotification, 20000);

        // تكرار التنبيه كل ٣٠ - ٦٠ ثانية
        const interval = setInterval(() => {
            showNotification();
        }, 35000 + Math.random() * 30000);

        return () => {
            clearTimeout(firstTimer);
            clearInterval(interval);
        };
    }, [showNotification]);

    if (!notification) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '24px',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '12px 16px',
                maxWidth: '360px',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(16px)',
                transform: notification.visible ? 'translateY(0)' : 'translateY(120%)',
                opacity: notification.visible ? 1 : 0,
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
            }}
            onClick={() => setNotification(prev => prev ? { ...prev, visible: false } : null)}
        >
            <div style={{
                width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                border: '2px solid var(--accent)',
            }}>
                <img src={notification.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--accent)' }}>{notification.name}</span>
                    <span>من {notification.city}</span>
                    {notification.isReal && <span title="طلب حقيقي مؤكد"><CheckCircle size={12} style={{ color: '#4caf50' }} /></span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    اشترى <strong>{notification.product}</strong>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShoppingBag size={10} /> {notification.time}
                </div>
            </div>

            <button
                onClick={e => { e.stopPropagation(); setNotification(prev => prev ? { ...prev, visible: false } : null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
            >
                <X size={16} />
            </button>
        </div>
    );
}
