import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Truck, Shield, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import LogoRenderer from '../components/LogoRenderer';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
    const { state } = useStore();
    const s = state.settings;
    const featuredProducts = state.products.filter(p => p.featured);
    const features = [
        { icon: <Award size={22} />, title: 'جودة عالية', desc: 'نضمن لك أعلى معايير الجودة' },
        { icon: <Truck size={22} />, title: 'شحن سريع', desc: 'توصيل سريع لباب بيتك' },
        { icon: <Shield size={22} />, title: 'ضمان المنتجات', desc: 'ضمان شامل على جميع المنتجات' },
        { icon: <Star size={22} />, title: 'أسعار منافسة', desc: 'أفضل الأسعار في السوق' },
    ];

    const renderLogo = (logo: string, size = 24, styles = {}) => {
        return <LogoRenderer logo={logo} size={size} styles={styles} />;
    };

    // Banner slider
    const activeBanners = state.banners.filter(b => b.active);
    const [currentBanner, setCurrentBanner] = useState(0);

    useEffect(() => {
        if (activeBanners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % activeBanners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeBanners.length]);

    return (
        <div className="page">
            {/* Hero Banner Carousel */}
            <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
                {activeBanners.length > 0 ? (
                    <>
                        {/* Hidden spacer to maintain height */}
                        <div style={{ visibility: 'hidden', position: 'relative' }}>
                            <div className="hero-bg">
                                <img src={activeBanners[0].image} alt="" />
                            </div>
                            <div className="hero-decoration" />
                            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                                <div className="hero-content">
                                    <div className="hero-badge"><span>{renderLogo(s.storeLogo, 20)}</span><span>أهلاً بك في {s.storeName}</span></div>
                                    <h1>{activeBanners[0].title}</h1>
                                    <p>{activeBanners[0].subtitle}</p>
                                    <div className="hero-actions">
                                        <span className="btn btn-primary btn-large">تصفح المنتجات <ArrowLeft size={20} /></span>
                                        <span className="btn btn-secondary btn-large">📱 تواصل واتساب</span>
                                    </div>
                                    <div className="hero-stats">
                                        <div className="hero-stat"><div className="number">{state.products.length}</div><div className="label">منتج متوفر</div></div>
                                        <div className="hero-stat"><div className="number">+{state.customers.length || 0}</div><div className="label">عميل سعيد</div></div>
                                        <div className="hero-stat">
                                            <div className="number">
                                                {state.reviews.length > 0
                                                    ? (state.reviews.reduce((acc, r) => acc + r.rating, 0) / state.reviews.length).toFixed(1)
                                                    : '5.0'}
                                            </div>
                                            <div className="label">تقييم العملاء</div>
                                        </div>
                                        <div className="hero-stat"><div className="number">{state.categories.length}</div><div className="label">قسم متنوع</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Actual visible banners */}
                        {activeBanners.map((banner, i) => (
                            <div key={banner.id} style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                opacity: i === currentBanner ? 1 : 0,
                                transition: 'opacity 0.8s ease',
                                zIndex: i === currentBanner ? 10 : 0,
                                pointerEvents: i === currentBanner ? 'auto' : 'none'
                            }}>
                                <div className="hero-bg">
                                    <img src={banner.image} alt={banner.title} />
                                </div>
                                <div className="hero-decoration" />
                                <div className="container" style={{ position: 'relative', height: '100%', zIndex: 11 }}>
                                    <div className="hero-content">
                                        <div className="hero-badge">
                                            <span>{renderLogo(s.storeLogo, 20)}</span>
                                            <span>أهلاً بك في {s.storeName}</span>
                                        </div>
                                        <h1>{banner.title}</h1>
                                        <p>{banner.subtitle}</p>
                                        <div className="hero-actions">
                                            <Link to={banner.link} className="btn btn-primary btn-large">
                                                تصفح المنتجات
                                                <ArrowLeft size={20} />
                                            </Link>
                                            <a
                                                href={`https://wa.me/${s.whatsappNumber}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary btn-large"
                                            >
                                                📱 تواصل واتساب
                                            </a>
                                        </div>
                                        <div className="hero-stats">
                                            <div className="hero-stat"><div className="number">{state.products.length}</div><div className="label">منتج متوفر</div></div>
                                            <div className="hero-stat"><div className="number">+{state.customers.length || 0}</div><div className="label">عميل سعيد</div></div>
                                            <div className="hero-stat">
                                                <div className="number">
                                                    {state.reviews.length > 0
                                                        ? (state.reviews.reduce((acc, r) => acc + r.rating, 0) / state.reviews.length).toFixed(1)
                                                        : '5.0'}
                                                </div>
                                                <div className="label">تقييم العملاء</div>
                                            </div>
                                            <div className="hero-stat"><div className="number">{state.categories.length}</div><div className="label">قسم متنوع</div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Banner dots */}
                        {activeBanners.length > 1 && (
                            <div style={{
                                position: 'absolute', bottom: '24px', left: '50%',
                                transform: 'translateX(-50%)', zIndex: 10,
                                display: 'flex', gap: '10px',
                            }}>
                                {activeBanners.map((_, i) => (
                                    <button key={i} onClick={() => setCurrentBanner(i)} style={{
                                        width: i === currentBanner ? '28px' : '10px',
                                        height: '10px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: i === currentBanner ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* Fallback if no banners */
                    <>
                        <div className="hero-bg is-logo">
                            <img src="/hero-logo.svg" alt={s.storeName} />
                        </div>
                        <div className="hero-decoration" />
                        <div className="container">
                            <div className="hero-content">
                                <div className="hero-badge"><span>{renderLogo(s.storeLogo, 20)}</span><span>أهلاً بك في {s.storeName}</span></div>
                                <h1>{s.storeTagline}</h1>
                                <p>{s.storeDescription}</p>
                                <div className="hero-actions">
                                    <Link to="/products" className="btn btn-primary btn-large">تصفح المنتجات <ArrowLeft size={20} /></Link>
                                    <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">📱 تواصل واتساب</a>
                                </div>
                                <div className="hero-stats">
                                    <div className="hero-stat"><div className="number">+{state.products.length * 10}</div><div className="label">منتج متوفر</div></div>
                                    <div className="hero-stat"><div className="number">+2000</div><div className="label">عميل سعيد</div></div>
                                    <div className="hero-stat"><div className="number">4.9</div><div className="label">تقييم العملاء</div></div>
                                    <div className="hero-stat"><div className="number">{state.categories.length}</div><div className="label">قسم متنوع</div></div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Categories Section */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">📋 تصفح بسهولة</div>
                        <h2>أقسام المتجر</h2>
                        <p>اختر القسم الذي يناسبك وتصفح منتجاتنا المميزة</p>
                    </div>
                    <div className="categories-grid">
                        {state.categories.map((cat, i) => (
                            <Link to={`/products?category=${cat.id}`} key={cat.id}>
                                <div className="category-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <img src={cat.image} alt={cat.name} loading="lazy" />
                                    <div className="category-card-overlay">
                                        <div className="category-card-icon">{cat.icon}</div>
                                        <h3>{cat.name}</h3>
                                        <p>{cat.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section className="section" style={{ background: 'var(--bg-alt)' }}>
                    <div className="container">
                        <div className="section-header">
                            <div className="section-badge">⭐ الأكثر مبيعاً</div>
                            <h2>منتجات مميزة</h2>
                            <p>أفضل المنتجات المختارة بعناية لك</p>
                        </div>
                        <div className="products-grid">
                            {featuredProducts.map((product, i) => (
                                <ProductCard key={product.id} product={product} index={i} />
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <Link to="/products" className="btn btn-secondary btn-large">
                                عرض جميع المنتجات
                                <ArrowLeft size={18} />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">🏆 لماذا نحن؟</div>
                        <h2>ما يميزنا</h2>
                        <p>نقدم لك أفضل تجربة تسوق</p>
                    </div>
                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="feature-card-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section" style={{ background: 'var(--bg-alt)' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>{renderLogo(s.storeLogo, 80)}</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        جاهز للطلب؟
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>
                        تواصل معنا الآن واحصل على أفضل المنتجات بأسعار مميزة
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/products" className="btn btn-primary btn-large">ابدأ التسوق</Link>
                        <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">
                            📱 واتساب مباشر
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
