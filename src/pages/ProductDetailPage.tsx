import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, Star, Send, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../components/ToastContainer';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { state, dispatch, getAppliedDiscount, getFinalPrice } = useStore();
    const { user } = useAuth();
    const s = state.settings;
    const product = state.products.find(p => p.id === id);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);

    const allImages = product ? [product.image, ...(product.images || [])].filter(Boolean) : [];

    // تقليب تلقائي للصور
    React.useEffect(() => {
        if (allImages.length <= 1) return;
        const interval = setInterval(() => {
            setActiveImage(prev => (prev + 1) % allImages.length);
        }, 5000); // 5 ثواني للتغيير التلقائي
        return () => clearInterval(interval);
    }, [allImages.length]);

    // التقييمات من المتجر العام
    const reviews = state.reviews.filter(r => r.productId === id).sort((a, b) => b.createdAt - a.createdAt);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
    const [showVideo, setShowVideo] = useState(false);

    // دالة لتحويل روابط يوتيوب ودرايف إلى روابط تضمين (Embed)
    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('youtube.com/watch?v=')) {
            return url.replace('watch?v=', 'embed/');
        }
        if (url.includes('youtu.be/')) {
            return url.replace('youtu.be/', 'youtube.com/embed/');
        }
        if (url.includes('drive.google.com/file/d/')) {
            return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
        }
        return url;
    };

    if (!product) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
                    <h2>المنتج غير موجود</h2>
                    <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px' }}>العودة للمنتجات</Link>
                </div>
            </div>
        );
    }

    const category = state.categories.find(c => c.id === product.categoryId);
    const isFavorite = state.favorites.includes(product.id);
    const discount = getAppliedDiscount(product);
    const finalPrice = getFinalPrice(product);
    const relatedProducts = state.products.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

    // حساب متوسط التقييم الفعلي من البيانات العامة
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : product.rating;
    const totalReviews = reviews.length > 0 ? reviews.length : product.reviewCount;

    const renderStars = (rating: number, size: string = '1.2rem') => Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.floor(rating) ? 'var(--accent)' : 'var(--text-light)', fontSize: size }}>★</span>
    ));

    const renderClickableStars = (rating: number, onRate: (n: number) => void) => Array.from({ length: 5 }, (_, i) => (
        <span
            key={i}
            onClick={() => onRate(i + 1)}
            style={{
                color: i < rating ? '#FFD700' : 'var(--text-light)',
                fontSize: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.transform = 'scale(1.3)'}
            onMouseLeave={e => (e.target as HTMLElement).style.transform = 'scale(1)'}
        >★</span>
    ));

    const handleAddToCart = () => {
        if (!user) {
            showToast('يرجى تسجيل الدخول لإضافة المنتجات للسلة', 'error');
            // Using a delay or letting the toast show before redirect
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            return;
        }
        dispatch({ type: 'ADD_TO_CART', product, quantity });
        dispatch({ type: 'SET_CART_OPEN', isOpen: true });
        showToast(`تمت إضافة ${product.name} إلى السلة`, 'success');
    };

    const handleToggleFavorite = () => {
        if (!user) {
            showToast('يرجى تسجيل الدخول للإضافة للمفضلة', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            return;
        }
        dispatch({ type: 'TOGGLE_FAVORITE', productId: product.id });
        showToast(isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: product.name, text: product.description, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('تم نسخ الرابط', 'success');
        }
    };

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewForm.name.trim()) { showToast('أدخل اسمك', 'error'); return; }
        if (!reviewForm.comment.trim()) { showToast('اكتب تعليقك', 'error'); return; }

        dispatch({
            type: 'ADD_REVIEW',
            review: {
                id: `REV-${Date.now()}`,
                productId: product.id,
                customerName: reviewForm.name,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                createdAt: Date.now(),
            }
        });

        setReviewForm({ name: '', rating: 5, comment: '' });
        setShowReviewForm(false);
        showToast('شكراً لتقييمك! ⭐', 'success');
    };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="page product-detail">
            <div className="container">
                <div className="breadcrumb">
                    <Link to="/">الرئيسية</Link>
                    <span className="breadcrumb-separator"><ChevronLeft size={14} /></span>
                    <Link to="/products">المنتجات</Link>
                    {category && (
                        <>
                            <span className="breadcrumb-separator"><ChevronLeft size={14} /></span>
                            <Link to={`/products?category=${category.id}`}>{category.name}</Link>
                        </>
                    )}
                    <span className="breadcrumb-separator"><ChevronLeft size={14} /></span>
                    <span style={{ color: 'var(--accent)' }}>{product.name}</span>
                </div>

                <div className="product-detail-grid">
                    <div className="product-gallery">
                        <div className="product-gallery-main" style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                            {allImages.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={product.name}
                                    style={{
                                        position: i === 0 ? 'relative' : 'absolute',
                                        top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                                        opacity: i === activeImage ? 1 : 0,
                                        transition: 'opacity 0.8s ease-in-out',
                                        zIndex: i === activeImage ? 1 : 0
                                    }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://placehold.co/800x600?text=No+Image';
                                    }}
                                />
                            ))}

                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setActiveImage(prev => (prev - 1 + allImages.length) % allImages.length); }}
                                        style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', color: '#000', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    >
                                        <ChevronLeft size={24} style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setActiveImage(prev => (prev + 1) % allImages.length); }}
                                        style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', color: '#000', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
                                        {allImages.map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setActiveImage(i)}
                                                style={{ width: i === activeImage ? 24 : 8, height: 8, borderRadius: 4, background: i === activeImage ? 'var(--accent)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: '0.3s' }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {allImages.length > 1 && (
                            <div className="product-gallery-thumbs" style={{ marginTop: 15, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
                                {allImages.map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        style={{
                                            width: 80, height: 80, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                                            border: `2px solid ${activeImage === i ? 'var(--accent)' : 'transparent'}`,
                                            transition: '0.2s'
                                        }}
                                    >
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-info">
                        {discount > 0 && (
                            <span className="discount-badge" style={{ position: 'static', marginBottom: '16px', display: 'inline-block' }}>خصم {Math.round(discount)}%</span>
                        )}
                        <h1>{product.name}</h1>
                        <div className="product-meta">
                            {category && <span style={{ color: 'var(--primary-light)', fontWeight: 500 }}>{category.icon} {category.name}</span>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {renderStars(avgRating)}
                                <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>({totalReviews} تقييم)</span>
                            </div>
                        </div>

                        <div className="price-section">
                            <span className="price-current">{finalPrice.toFixed(0)} {s.currencySymbol}</span>
                            {product.originalPrice && <span className="price-original">{product.originalPrice.toFixed(0)} {s.currencySymbol}</span>}
                            {product.weight && <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>/ {product.weight}</span>}
                        </div>

                        <p className="description">{product.description}</p>

                        {product.tags && (
                            <div className="tags">
                                {product.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                            </div>
                        )}

                        {product.specifications && (
                            <div className="product-specs">
                                <h3>المواصفات</h3>
                                <div className="specs-grid">
                                    {Object.entries(product.specifications).map(([key, value]) => (
                                        <div key={key} className="spec-item">
                                            <span className="spec-label">{key}</span>
                                            <span className="spec-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* حالة المخزون */}
                        <div style={{ marginBottom: '20px' }}>
                            {product.stockQuantity > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        background: product.stockQuantity <= (product.lowStockThreshold || 5) ? 'rgba(255,152,0,0.1)' : 'rgba(76,175,80,0.1)',
                                        color: product.stockQuantity <= (product.lowStockThreshold || 5) ? '#FF9800' : '#4CAF50',
                                        border: `1px solid ${product.stockQuantity <= (product.lowStockThreshold || 5) ? 'rgba(255,152,0,0.2)' : 'rgba(76,175,80,0.2)'}`
                                    }}>
                                        {product.stockQuantity <= (product.lowStockThreshold || 5) ? `⚠️ مخزون منخفض: متبقي ${product.stockQuantity} فقط` : '✅ متوفر في المخزون'}
                                    </span>
                                </div>
                            ) : (
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    background: 'rgba(244,67,54,0.1)',
                                    color: '#f44336',
                                    border: '1px solid rgba(244,67,54,0.2)'
                                }}>
                                    🚫 نفدت الكمية حالياً
                                </span>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                الكمية {product.stockQuantity > 0 && product.stockQuantity < 10 && <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>(بحد أقصى {product.stockQuantity})</span>}
                            </label>
                            <div className="quantity-selector">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
                                <span className="qty-value">{quantity}</span>
                                <button
                                    onClick={() => {
                                        if (quantity >= (product.stockQuantity || 0)) {
                                            showToast(`عذراً، هذه هي آخر ${product.stockQuantity} قطع متوفرة من هذا المنتج`, 'warning');
                                        } else {
                                            setQuantity(quantity + 1);
                                        }
                                    }}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="product-detail-actions">
                            <button className="btn btn-primary btn-large" onClick={handleAddToCart} disabled={!product.inStock}>
                                <ShoppingCart size={20} />
                                {product.inStock ? `أضف للسلة - ${(finalPrice * quantity).toFixed(0)} ${s.currencySymbol}` : 'نفذت الكمية'}
                            </button>
                            <button className={`btn ${isFavorite ? 'btn-danger' : 'btn-secondary'}`} onClick={handleToggleFavorite}>
                                <Heart size={20} fill={isFavorite ? 'white' : 'none'} />
                            </button>
                            <button className="btn btn-secondary" onClick={handleShare}><Share2 size={20} /></button>
                        </div>

                        {product.videoUrl && (
                            <div style={{ marginTop: '20px' }}>
                                <button
                                    onClick={() => setShowVideo(true)}
                                    className="btn btn-secondary"
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'rgba(197, 160, 89, 0.1)',
                                        border: '1px solid var(--accent)',
                                        color: 'var(--accent)',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: '0.3s'
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                                        (e.currentTarget as HTMLElement).style.color = '#000';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(197, 160, 89, 0.1)';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                                    }}
                                >
                                    <Send size={20} style={{ transform: 'rotate(-45deg)' }} />
                                    🎬 استعراض المنتج بالفيديو
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🎥 Video Modal */}
                {showVideo && product.videoUrl && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        backdropFilter: 'blur(10px)'
                    }} onClick={() => setShowVideo(false)}>
                        <div style={{
                            width: '100%', maxWidth: '900px', aspectRatio: '16/9', background: '#000',
                            borderRadius: '24px', overflow: 'hidden', position: 'relative',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
                        }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setShowVideo(false)}
                                style={{
                                    position: 'absolute', top: 20, right: 20, zIndex: 10,
                                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                                    border: 'none', borderRadius: '50%', width: 44, height: 44,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>
                            <iframe
                                src={getEmbedUrl(product.videoUrl)}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}

                {/* ⭐ قسم التقييمات والمراجعات */}
                <div style={{ paddingTop: '50px' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
                    }}>
                        <div>
                            <h2 style={{ fontWeight: 800, marginBottom: '4px' }}>⭐ التقييمات والمراجعات</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {totalReviews > 0 ? `${totalReviews} تقييم - متوسط ${avgRating.toFixed(1)} من 5` : 'لا توجد تقييمات بعد'}
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowReviewForm(!showReviewForm)}
                        >
                            {showReviewForm ? 'إلغاء' : '✏️ أضف تقييمك'}
                        </button>
                    </div>

                    {/* ملخص التقييمات */}
                    {reviews.length > 0 && (
                        <div style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)' }}>
                                    {avgRating.toFixed(1)}
                                </div>
                                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
                                    {renderStars(avgRating, '1.4rem')}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                    {reviews.length} تقييم
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = reviews.filter(r => r.rating === star).length;
                                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                    return (
                                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.8rem', width: '20px', textAlign: 'center' }}>{star}</span>
                                            <span style={{ color: '#FFD700', fontSize: '0.9rem' }}>★</span>
                                            <div style={{ flex: 1, height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${pct}%`, height: '100%',
                                                    background: 'var(--gradient)', borderRadius: '4px',
                                                    transition: 'width 0.8s ease',
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', width: '30px' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* نموذج إضافة تقييم */}
                    {showReviewForm && (
                        <form onSubmit={handleSubmitReview} style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--accent)',
                            borderRadius: '20px',
                            padding: '24px',
                            marginBottom: '24px',
                        }}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>✏️ أضف تقييمك</h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>اسمك *</label>
                                <input
                                    type="text"
                                    placeholder="أدخل اسمك"
                                    value={reviewForm.name}
                                    onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                                        border: '1px solid var(--border)', background: 'var(--bg)',
                                        color: 'var(--text)', fontFamily: 'var(--font)',
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>تقييمك *</label>
                                <div style={{ display: 'flex', gap: '6px', direction: 'ltr' }}>
                                    {renderClickableStars(reviewForm.rating, (n) => setReviewForm({ ...reviewForm, rating: n }))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>تعليقك *</label>
                                <textarea
                                    placeholder="شاركنا تجربتك مع هذا المنتج..."
                                    value={reviewForm.comment}
                                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                                        border: '1px solid var(--border)', background: 'var(--bg)',
                                        color: 'var(--text)', fontFamily: 'var(--font)', resize: 'vertical',
                                    }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                <Send size={16} /> إرسال التقييم
                            </button>
                        </form>
                    )}

                    {/* قائمة التقييمات */}
                    {reviews.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {reviews.map(review => (
                                <div key={review.id} style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    padding: '18px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '38px', height: '38px',
                                                borderRadius: '50%',
                                                background: 'var(--gradient)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                                            }}>
                                                {review.customerName.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{review.customerName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{formatDate(review.createdAt)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {renderStars(review.rating, '0.9rem')}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                        {review.comment}
                                    </p>
                                    {review.adminReply && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px 16px',
                                            background: 'rgba(200,134,10,0.05)',
                                            borderRadius: '12px',
                                            borderRight: '3px solid var(--accent)',
                                            fontSize: '0.9rem'
                                        }}>
                                            <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: '4px', fontSize: '0.8rem' }}>
                                                رد المتجر ✨
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                {review.adminReply}
                                            </div>
                                            {review.repliedAt && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '6px' }}>
                                                    {formatDate(review.repliedAt)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {relatedProducts.length > 0 && (
                    <div style={{ paddingTop: '60px' }}>
                        <div className="section-header"><h2>منتجات مشابهة</h2></div>
                        <div className="products-grid">
                            {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
