import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export default function SplashScreen() {
    // ✅ جلب آخر بيانات محفوظة لعرض الاسم والشعار الحقيقي أثناء التحميل
    const cached = useMemo(() => {
        try {
            const saved = localStorage.getItem('store-state-v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.settings) {
                    return {
                        name: parsed.settings.storeName || '',
                        logo: parsed.settings.storeLogo || '',
                    };
                }
            }
        } catch (e) { }
        return { name: '', logo: '' };
    }, []);

    const isLogoUrl = cached.logo && (cached.logo.startsWith('http') || cached.logo.startsWith('data:'));

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'opacity 0.5s ease'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--surface)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                border: '1px solid var(--border)',
                overflow: 'hidden'
            }}>
                {isLogoUrl ? (
                    <img src={cached.logo} alt="" style={{ maxWidth: '60px', maxHeight: '60px', objectFit: 'contain' }} />
                ) : (
                    <span style={{ fontSize: '2.5rem' }}>{cached.logo || '🛒'}</span>
                )}
            </div>
            {cached.name && (
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '8px'
                }}>{cached.name}</h2>
            )}
            <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '24px'
            }}>جاري تهيئة المتجر...</p>
            <Loader2 className="spin" size={32} color="var(--accent)" />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
