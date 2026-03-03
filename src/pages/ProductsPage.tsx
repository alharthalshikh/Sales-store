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
                    <button className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setSearchParams({})}>
                        الكل ({state.products.length})
                    </button>
                    {state.categories.map(cat => {
                        const catIdStr = String(cat.id).trim();
                        const count = state.products.filter(p => String(p.categoryId || '').trim() === catIdStr).length;
                        return (
                            <button key={cat.id} className={`filter-btn ${String(activeCategory).trim() === catIdStr ? 'active' : ''}`} onClick={() => setSearchParams({ category: cat.id })}>
                                {cat.icon} {cat.name} ({count})
                            </button>
                        );
                    })}
                    <input type="text" className="search-input" placeholder="🔍 ابحث عن منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '10px 18px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '50px', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <option value="featured">المميزة أولاً</option>
                        <option value="price-low">السعر: من الأقل</option>
                        <option value="price-high">السعر: من الأعلى</option>
                        <option value="rating">الأعلى تقييماً</option>
                    </select>
                </div>
                {filteredProducts.length === 0 ? (
                    <div className="favorites-empty">
                        <div className="favorites-empty-icon">🔍</div>
                        <h3>لا توجد منتجات</h3>
                        <p>جرب تغيير الفلتر أو البحث بكلمة أخرى</p>
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
