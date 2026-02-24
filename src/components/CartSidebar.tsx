import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function CartSidebar() {
    const { state, dispatch, cartTotal, cartCount, getFinalPrice } = useStore();
    const s = state.settings;

    return (
        <>
            {state.isCartOpen && (
                <div className="cart-overlay" onClick={() => dispatch({ type: 'SET_CART_OPEN', isOpen: false })} />
            )}
            <div className={`cart-sidebar ${state.isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>
                        <ShoppingCart size={22} />
                        السلة ({cartCount})
                    </h2>
                    <button className="nav-icon-btn" onClick={() => dispatch({ type: 'SET_CART_OPEN', isOpen: false })}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cart-items">
                    {state.cart.length === 0 ? (
                        <div className="cart-empty">
                            <div className="cart-empty-icon">🛒</div>
                            <h3>السلة فارغة</h3>
                            <p>أضف منتجات إلى سلتك للمتابعة</p>
                        </div>
                    ) : (
                        state.cart.map(item => {
                            const finalPrice = getFinalPrice(item.product);
                            return (
                                <div key={item.product.id} className="cart-item">
                                    <div className="cart-item-image">
                                        <img src={item.product.image} alt={item.product.name} />
                                    </div>
                                    <div className="cart-item-info">
                                        <div className="cart-item-name">{item.product.name}</div>
                                        <div className="cart-item-price">
                                            {finalPrice.toFixed(2)} {s.currencySymbol}
                                        </div>
                                        <div className="cart-item-controls">
                                            <button onClick={() => dispatch({ type: 'UPDATE_QUANTITY', productId: item.product.id, quantity: item.quantity - 1 })}>
                                                <Minus size={14} />
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => dispatch({ type: 'UPDATE_QUANTITY', productId: item.product.id, quantity: item.quantity + 1 })} disabled={item.quantity >= (item.product.stockQuantity || 0)}>
                                                <Plus size={14} />
                                            </button>
                                            <button className="cart-item-remove" onClick={() => dispatch({ type: 'REMOVE_FROM_CART', productId: item.product.id })}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {state.cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>المجموع الفرعي</span>
                            <span>{cartTotal.toFixed(2)} {s.currencySymbol}</span>
                        </div>
                        {((s.deliveryFee || 0) > 0 || (s.freeShippingThreshold || 0) > 0 || (s.deliveryPricePerKm || 0) > 0) && (
                            <div className="cart-total" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <span>🚚 رسوم التوصيل</span>
                                <span style={{ textAlign: 'left' }}>
                                    {(s.freeShippingThreshold || 0) > 0 && cartTotal >= (s.freeShippingThreshold || 0)
                                        ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>مجاني (عرض!)</span>
                                        : (s.deliveryPricePerKm || 0) > 0
                                            ? <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, display: 'block' }}>يتم تحديدها بعد تحديد الموقع 📍</span>
                                            : (s.deliveryFee || 0) > 0
                                                ? `${(s.deliveryFee || 0).toFixed(2)} ${s.currencySymbol}`
                                                : <span style={{ color: 'var(--success)', fontWeight: 700 }}>مجاني</span>
                                    }
                                </span>
                            </div>
                        )}
                        <div className="cart-total" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px', fontWeight: 800, fontSize: '1.2rem' }}>
                            <span>المجموع الكلي</span>
                            <span className="total-value">
                                {(cartTotal + (((s.freeShippingThreshold || 0) > 0 && cartTotal >= (s.freeShippingThreshold || 0)) ? 0 : (s.deliveryFee || 0))).toFixed(2)} {s.currencySymbol}
                            </span>
                        </div>

                        {(s.freeShippingThreshold || 0) > 0 && cartTotal < (s.freeShippingThreshold || 0) && (
                            <div style={{ background: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px', border: '1px solid rgba(76, 175, 80, 0.2)', fontWeight: 600 }}>
                                ✨ أضف {((s.freeShippingThreshold || 0) - cartTotal).toFixed(2)} {s.currencySymbol} إضافية للحصول على توصيل مجاني!
                            </div>
                        )}

                        {(s.minOrder || 0) > 0 && cartTotal < (s.minOrder || 0) && (
                            <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: 'var(--error)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px', border: '1px solid rgba(244, 67, 54, 0.2)' }}>
                                ⚠️ الحد الأدنى للطلب هو {(s.minOrder || 0)} {s.currencySymbol}<br />
                                متبقي {((s.minOrder || 0) - cartTotal).toFixed(2)} {s.currencySymbol} للمتابعة
                            </div>
                        )}

                        <Link
                            to="/checkout"
                            className={`btn btn-primary btn-large ${(s.minOrder || 0) > 0 && cartTotal < (s.minOrder || 0) ? 'disabled' : ''}`}
                            onClick={(e) => {
                                if ((s.minOrder || 0) > 0 && cartTotal < (s.minOrder || 0)) {
                                    e.preventDefault();
                                    return;
                                }
                                dispatch({ type: 'SET_CART_OPEN', isOpen: false });
                            }}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                opacity: (s.minOrder || 0) > 0 && cartTotal < (s.minOrder || 0) ? 0.5 : 1,
                                pointerEvents: (s.minOrder || 0) > 0 && cartTotal < (s.minOrder || 0) ? 'none' : 'auto'
                            }}
                        >
                            إتمام الطلب
                        </Link>
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '10px' }}
                            onClick={() => dispatch({ type: 'CLEAR_CART' })}
                        >
                            تفريغ السلة
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
