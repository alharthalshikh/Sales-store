import React, { useMemo, useEffect, useState } from 'react';

export default function SplashScreen() {
    const [progress, setProgress] = useState(0);

    // محاكاة شريط التقدم لزيادة الواقعية
    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + Math.random() * 15 : prev));
        }, 200);
        return () => clearInterval(timer);
    }, []);

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

    const isLogoUrl = cached.logo && (cached.logo.startsWith('http') || cached.logo.startsWith('data:') || cached.logo.startsWith('/') || cached.logo.includes('.png') || cached.logo.includes('.jpg') || cached.logo.includes('.svg'));

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: '#050505',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, overflow: 'hidden'
        }}>
            {/* الخلفية المتوهجة */}
            <div style={{
                position: 'absolute', width: '300px', height: '300px',
                background: 'var(--accent)', filter: 'blur(120px)',
                opacity: 0.15, borderRadius: '50%',
                animation: 'float-glow 6s infinite ease-in-out'
            }} />

            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: '100px', height: '100px',
                    background: 'linear-gradient(135deg, var(--surface) 0%, #111 100%)',
                    borderRadius: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--border)',
                    overflow: 'hidden',
                    animation: 'pulse-premium 2s infinite ease-in-out'
                }}>
                    {isLogoUrl ? (
                        <img src={cached.logo} alt="" style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ fontSize: '3rem' }}>{cached.logo || '🛒'}</span>
                    )}
                </div>

                {cached.name && (
                    <h2 style={{
                        fontSize: '1.5rem', fontWeight: 800, color: '#fff',
                        marginBottom: '8px', letterSpacing: '1px',
                        background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>{cached.name}</h2>
                )}
                
                <p style={{
                    fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)',
                    marginBottom: '32px', fontWeight: 500
                }}>جاري تهيئة المتجر الفاخر...</p>

                {/* شريط التقدم */}
                <div style={{
                    width: '200px', height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px', overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: 'var(--gradient)',
                        borderRadius: '10px',
                        transition: 'width 0.4s ease-out',
                        boxShadow: '0 0 10px var(--accent)'
                    }} />
                </div>
            </div>

            <style>{`
                @keyframes pulse-premium {
                    0%, 100% { transform: scale(1); box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--border); }
                    50% { transform: scale(1.05); box-shadow: 0 25px 50px rgba(0,0,0,0.6), 0 0 15px var(--accent-glow); }
                }
                @keyframes float-glow {
                    0%, 100% { transform: translate(0, 0); opacity: 0.15; }
                    50% { transform: translate(30px, -20px); opacity: 0.25; }
                }
            `}</style>
        </div>
    );
}
