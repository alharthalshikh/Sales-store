import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../hooks/useStore';
import { ShoppingBag, X } from 'lucide-react';

const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر', 'أبها', 'تبوك', 'حائل', 'نجران', 'الطائف', 'ينبع', 'القصيم', 'خميس مشيط'];
const names = ['محمد', 'أحمد', 'عبدالله', 'خالد', 'فهد', 'سارة', 'نورة', 'مريم', 'هند', 'عمر', 'يوسف', 'ريم', 'لينا', 'سلطان', 'تركي'];
const timeAgo = ['قبل دقيقتين', 'قبل ٣ دقائق', 'قبل ٥ دقائق', 'قبل ١٠ دقائق', 'قبل ربع ساعة', 'الآن'];

interface Notification {
    id: number;
    name: string;
    city: string;
    product: string;
    image: string;
    time: string;
    visible: boolean;
}

export default function LiveNotification() {
    const { state } = useStore();
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = useCallback(() => {
        if (state.products.length === 0) return;

        const product = state.products[Math.floor(Math.random() * state.products.length)];
        const newNotif: Notification = {
            id: Date.now(),
            name: names[Math.floor(Math.random() * names.length)],
            city: cities[Math.floor(Math.random() * cities.length)],
            product: product.name,
            image: product.image,
            time: timeAgo[Math.floor(Math.random() * timeAgo.length)],
            visible: true,
        };

        setNotification(newNotif);

        // Auto hide after 5 seconds
        setTimeout(() => {
            setNotification(prev => prev && prev.id === newNotif.id ? { ...prev, visible: false } : prev);
        }, 5000);

        // Remove from DOM after animation
        setTimeout(() => {
            setNotification(prev => prev && prev.id === newNotif.id ? null : prev);
        }, 5500);
    }, [state.products]);

    useEffect(() => {
        // First notification after 15 seconds
        const firstTimer = setTimeout(showNotification, 15000);

        // Then every 25-50 seconds
        const interval = setInterval(() => {
            showNotification();
        }, 25000 + Math.random() * 25000);

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
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(16px)',
                transform: notification.visible ? 'translateX(0)' : 'translateX(-120%)',
                opacity: notification.visible ? 1 : 0,
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
            }}
            onClick={() => setNotification(prev => prev ? { ...prev, visible: false } : null)}
        >
            <div style={{
                width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                border: '2px solid var(--accent)',
            }}>
                <img src={notification.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent)' }}>{notification.name}</span> من {notification.city}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    اشترى <strong>{notification.product}</strong>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShoppingBag size={10} /> {notification.time}
                </div>
            </div>
            <button
                onClick={e => { e.stopPropagation(); setNotification(prev => prev ? { ...prev, visible: false } : null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
            >
                <X size={14} />
            </button>
        </div>
    );
}
