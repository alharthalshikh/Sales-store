import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
    const { state } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeCategory = searchParams.get('category') || 'all';
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured');

    const filteredProducts = useMemo(() => {
        let filtered = [...state.products];

        /* console.log('🔍 Filtering:', {
            total: filtered.length,
            activeCategory,
            searchQuery,
            sortBy
        }); */

        if (activeCategory && activeCategory !== 'all') {
            const normalizedCategory = String(activeCategory).trim();
            filtered = filtered.filter(p => {
                const pCatId = String(p.categoryId || '').trim();
                return pCatId === normalizedCategory;
            });
            // console.log('📂 After Category Filter:', filtered.length);
        }

        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.nameEn || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
            // console.log('🔎 After Search Filter:', filtered.length);
        }

        switch (sortBy) {
            case 'price-low': filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
            case 'price-high': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
            case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            case 'featured': filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
        }

        return filtered;
    }, [activeCategory, searchQuery, sortBy, state.products]);

    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeCategory]);

    React.useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (highlightId) {
            setTimeout(() => {
                const element = document.getElementById(`product-${highlightId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [searchParams]);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px' }}>
                <div className="section-header" style={{ marginBottom: '30px' }}>
                    <div className="section-badge">🛍️ تسوق الآن</div>
                    <h2>جميع المنتجات</h2>
                    <p>تصفح منتجاتنا المميزة واختر ما يناسبك</p>
                </div>
                <div className="filter-bar">
                    <button className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => { setSearchParams({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        الكل ({state.products.length})
                    </button>
                    {state.categories.map(cat => {
                        const catIdStr = String(cat.id).trim();
                        const count = state.products.filter(p => String(p.categoryId || '').trim() === catIdStr).length;
                        return (
                            <button key={cat.id} className={`filter-btn ${String(activeCategory).trim() === catIdStr ? 'active' : ''}`} onClick={() => { setSearchParams({ category: cat.id }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                {cat.icon} {cat.name} ({count})
                            </button>
                        );
                    })}
                    <div className="search-input-wrapper">
                        <input type="text" className="search-input" placeholder="ابحث عن منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select">
                        <option value="featured">✨ المميزة</option>
                        <option value="price-low">💰 الأقل سعراً</option>
                        <option value="price-high">📈 الأعلى سعراً</option>
                        <option value="rating">⭐ التقييم</option>
                    </select>
                </div>
                {filteredProducts.length === 0 ? (
                    <div className="favorites-empty">
                        <div className="favorites-empty-icon">🔍</div>
                        <h3>لا توجد نتائج بحث</h3>
                        <p>جرب كلمات أخرى أو تصفح الأقسام</p>
                    </div>
                ) : (
                    <div className="products-grid" style={{ paddingBottom: '60px' }}>
                        {filteredProducts.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
