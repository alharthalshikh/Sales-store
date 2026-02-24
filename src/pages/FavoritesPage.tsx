import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import ProductCard from '../components/ProductCard';

export default function FavoritesPage() {
    const { state, dispatch } = useStore();
    const favoriteProducts = state.products.filter(p => state.favorites.includes(p.id));

    useEffect(() => {
        dispatch({ type: 'RESET_FAVORITES_COUNT' });
    }, [dispatch]);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px' }}>
                <div className="section-header" style={{ marginBottom: '30px' }}>
                    <div className="section-badge">❤️ مفضلاتك</div>
                    <h2>قائمة المفضلة</h2>
                    <p>المنتجات التي أعجبتك وأضفتها لقائمتك</p>
                </div>
                {favoriteProducts.length === 0 ? (
                    <div className="favorites-empty">
                        <div className="favorites-empty-icon">❤️</div>
                        <h3 style={{ marginBottom: '12px', fontSize: '1.3rem' }}>لا توجد منتجات في المفضلة</h3>
                        <p style={{ marginBottom: '24px' }}>تصفح منتجاتنا وأضف ما يعجبك إلى المفضلة</p>
                        <Link to="/products" className="btn btn-primary">تصفح المنتجات</Link>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{favoriteProducts.length} منتج في المفضلة</span>
                        </div>
                        <div className="products-grid" style={{ paddingBottom: '60px' }}>
                            {favoriteProducts.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
