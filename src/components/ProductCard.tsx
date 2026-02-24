import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { showToast } from './ToastContainer';

interface Props {
    product: Product;
    index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
    const { state, dispatch, getAppliedDiscount, getFinalPrice } = useStore();
    const { user } = useAuth();
    const isFavorite = state.favorites.includes(product.id);
    const discount = getAppliedDiscount(product);
    const finalPrice = getFinalPrice(product);
    const category = state.categories.find(c => c.id === product.categoryId);
    const settings = state.settings;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ opacity: i < Math.floor(rating) ? 1 : 0.3 }}>★</span>
        ));
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            showToast('يرجى تسجيل الدخول للإضافة للمفضلة', 'error');
            // Using a nicer way to redirect might be better, but standard for now
            window.location.href = '/login';
            return;
        }
        dispatch({ type: 'TOGGLE_FAVORITE', productId: product.id });
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            showToast('يرجى تسجيل الدخول لإضافة للمنتجات للسلة', 'error');
            window.location.href = '/login';
            return;
        }
        dispatch({ type: 'ADD_TO_CART', product });
        dispatch({ type: 'SET_CART_OPEN', isOpen: true });
    };

    return (
        <div className="product-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="product-card-image">
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/400x300?text=No+Image';
                    }}
                />
                {discount > 0 && (
                    <span className="discount-badge">خصم {Math.round(discount)}%</span>
                )}
                <div className="product-card-actions">
                    <button
                        className={`product-action-btn ${isFavorite ? 'favorited' : ''}`}
                        onClick={handleToggleFavorite}
                        title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                        <Heart size={18} fill={isFavorite ? 'white' : 'none'} />
                    </button>
                    <Link to={`/product/${product.id}`} className="product-action-btn" title="عرض التفاصيل">
                        <Eye size={18} />
                    </Link>
                </div>
                {(product.stockQuantity ?? 1) <= 0 && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'inherit', zIndex: 5,
                    }}>
                        <span style={{
                            background: '#f44336', color: '#fff', padding: '8px 16px', borderRadius: '8px',
                            fontWeight: 800, fontSize: '0.9rem',
                        }}>نفدت الكمية</span>
                    </div>
                )}
            </div>
            <div className="product-card-body">
                {category && (
                    <div className="product-card-category">{category.icon} {category.name}</div>
                )}
                <Link to={`/product/${product.id}`}>
                    <h3 className="product-card-name">{product.name}</h3>
                </Link>
                <div className="product-card-rating">
                    <div className="stars">{renderStars(product.rating)}</div>
                    <span className="rating-count">({product.reviewCount})</span>
                </div>
                <div className="product-card-price">
                    <span className="price-current">{finalPrice.toFixed(0)} {settings.currencySymbol}</span>
                    {product.originalPrice && (
                        <span className="price-original">{product.originalPrice.toFixed(0)} {settings.currencySymbol}</span>
                    )}
                </div>
                <div className="product-card-footer">
                    <button
                        className="btn btn-primary btn-small"
                        onClick={handleAddToCart}
                        disabled={!product.inStock}
                    >
                        <ShoppingCart size={16} />
                        {product.inStock ? 'أضف للسلة' : 'نفذت الكمية'}
                    </button>
                </div>
            </div>
        </div>
    );
}
