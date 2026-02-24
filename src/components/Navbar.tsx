import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Menu, X, Shield, User, Sun, Moon, Monitor } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import LogoRenderer from './LogoRenderer';

export default function Navbar() {
    const { state, dispatch, cartCount } = useStore();
    const { isAdmin, user } = useAuth();
    const { mode, setMode } = useTheme();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);


    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path: string) => location.pathname === path;
    const settings = state.settings;

    const renderLogo = (logo: string, className = "logo-icon", styles = {}) => {
        if (!logo) return null;
        if (logo.startsWith('<svg')) {
            return <div className={className} style={{ width: 45, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', ...styles }} dangerouslySetInnerHTML={{ __html: logo }} />;
        }
        if (logo.startsWith('http')) {
            return <img src={logo} alt="Logo" className={className} style={{ width: 45, height: 45, borderRadius: 8, objectFit: 'contain', ...styles }} />;
        }
        return <span className={className} style={{ fontSize: '1.5rem', ...styles }}>{logo}</span>;
    };

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="container navbar-content">
                    <Link to="/" className="navbar-brand">
                        {renderLogo(settings.storeLogo)}
                        <span>{settings.storeName}</span>
                    </Link>

                    <div className="navbar-links">
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>الرئيسية</Link>
                        <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>المنتجات</Link>
                        <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>المفضلة</Link>
                        <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>طلباتي</Link>
                        <Link to="/rewards" className={`nav-link ${isActive('/rewards') ? 'active' : ''}`}>المكافآت</Link>
                        <Link to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`}>المحادثات</Link>
                    </div>

                    <div className="navbar-actions">
                        {/* Theme Switcher */}
                        <div style={{ position: 'relative' }} className="hide-mobile">
                            <button
                                className="nav-icon-btn"
                                onClick={() => setShowThemeMenu(!showThemeMenu)}
                                title="تبديل المظهر"
                            >
                                {mode === 'light' ? <Sun size={20} /> : mode === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
                            </button>

                            {showThemeMenu && (
                                <div className="theme-dropdown" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    background: 'var(--bg-alt)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    zIndex: 1000,
                                    boxShadow: 'var(--shadow-lg)'
                                }}>
                                    <button
                                        onClick={() => { setMode('light'); setShowThemeMenu(false); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: mode === 'light' ? 'var(--surface-hover)' : 'transparent', border: 'none', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                                    >
                                        <Sun size={16} /> فاتح
                                    </button>
                                    <button
                                        onClick={() => { setMode('dark'); setShowThemeMenu(false); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: mode === 'dark' ? 'var(--surface-hover)' : 'transparent', border: 'none', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                                    >
                                        <Moon size={16} /> داكن
                                    </button>
                                    <button
                                        onClick={() => { setMode('system'); setShowThemeMenu(false); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: mode === 'system' ? 'var(--surface-hover)' : 'transparent', border: 'none', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                                    >
                                        <Monitor size={16} /> تلقائي
                                    </button>
                                </div>
                            )}
                        </div>

                        <Link to="/favorites" className="nav-icon-btn hide-mobile" title="المفضلة">
                            <Heart size={20} />
                            {state.unreadFavoritesCount > 0 && (
                                <span className="badge">{state.unreadFavoritesCount}</span>
                            )}
                        </Link>
                        <button
                            className="nav-icon-btn"
                            onClick={() => dispatch({ type: 'TOGGLE_CART' })}
                            title="السلة"
                        >
                            <ShoppingCart size={20} />
                            {cartCount > 0 && <span className="badge">{cartCount}</span>}
                        </button>
                        {!user ? (
                            <Link to="/login" className="nav-icon-btn" title="تسجيل الدخول">
                                <User size={20} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/profile" className="nav-icon-btn" title="ملفي الشخصي" style={{ color: isAdmin ? 'var(--accent)' : 'var(--text)' }}>
                                    <User size={20} />
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="nav-icon-btn hide-mobile" title="لوحة التحكم" style={{ color: 'var(--accent)' }}>
                                        <Shield size={20} />
                                    </Link>
                                )}
                            </>
                        )}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
                        >
                            <Menu size={22} />
                        </button>
                    </div>

                </div>
            </nav>

            {/* Mobile Menu */}
            <div
                className={`mobile-menu-overlay ${state.isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}
            />
            <div className={`mobile-menu ${state.isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-header">
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {renderLogo(settings.storeLogo, "", { width: 28, height: 28 })} {settings.storeName}
                    </span>
                    <button
                        className="nav-icon-btn"
                        onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="mobile-menu-links">
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        🏠 الرئيسية
                    </Link>
                    <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        🛍️ المنتجات
                    </Link>
                    <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        ❤️ المفضلة {state.unreadFavoritesCount > 0 && `(${state.unreadFavoritesCount})`}
                    </Link>
                    <Link to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        💬 المحادثات
                    </Link>
                    <Link to="/track" className={`nav-link ${isActive('/track') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        📦 تتبع طلبي
                    </Link>
                    <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        📋 طلباتي
                    </Link>
                    <Link to="/rewards" className={`nav-link ${isActive('/rewards') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                        🎁 المكافآت
                    </Link>
                    {user && (
                        <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })} style={{ color: 'var(--accent)' }}>
                            👤 ملفي الشخصي
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })} style={{ color: 'var(--accent)' }}>
                            🛡️ لوحة التحكم
                        </Link>
                    )}
                    {!user && (
                        <Link to="/login" className="nav-link" onClick={() => dispatch({ type: 'SET_MOBILE_MENU_OPEN', isOpen: false })}>
                            🔐 تسجيل الدخول
                        </Link>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '12px', padding: '0 16px' }}>مظهر المتجر</p>
                        <div style={{ display: 'flex', gap: '8px', padding: '0 16px' }}>
                            <button
                                onClick={() => setMode('light')}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', background: mode === 'light' ? 'var(--surface-hover)' : 'var(--bg-alt)', border: mode === 'light' ? '1px solid var(--accent)' : '1px solid var(--border)', color: mode === 'light' ? 'var(--accent)' : 'var(--text)', borderRadius: '12px', cursor: 'pointer' }}
                            >
                                <Sun size={18} />
                                <span style={{ fontSize: '0.75rem' }}>فاتح</span>
                            </button>
                            <button
                                onClick={() => setMode('dark')}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', background: mode === 'dark' ? 'var(--surface-hover)' : 'var(--bg-alt)', border: mode === 'dark' ? '1px solid var(--accent)' : '1px solid var(--border)', color: mode === 'dark' ? 'var(--accent)' : 'var(--text)', borderRadius: '12px', cursor: 'pointer' }}
                            >
                                <Moon size={18} />
                                <span style={{ fontSize: '0.75rem' }}>داكن</span>
                            </button>
                            <button
                                onClick={() => setMode('system')}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', background: mode === 'system' ? 'var(--surface-hover)' : 'var(--bg-alt)', border: mode === 'system' ? '1px solid var(--accent)' : '1px solid var(--border)', color: mode === 'system' ? 'var(--accent)' : 'var(--text)', borderRadius: '12px', cursor: 'pointer' }}
                            >
                                <Monitor size={18} />
                                <span style={{ fontSize: '0.75rem' }}>تلقائي</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
