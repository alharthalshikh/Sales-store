import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

export default function Footer() {
    const { state } = useStore();
    const s = state.settings;

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <div className="footer-brand">
                            {s.storeLogo?.startsWith('<svg') ? (
                                <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: s.storeLogo }} />
                            ) : s.storeLogo?.startsWith('http') ? (
                                <img src={s.storeLogo} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
                            ) : (
                                <span>{s.storeLogo}</span>
                            )}
                            <span>{s.storeName}</span>
                        </div>
                        <p className="footer-desc">{s.storeDescription}</p>
                    </div>
                    <div>
                        <h4>روابط سريعة</h4>
                        <div className="footer-links">
                            <Link to="/">الرئيسية</Link>
                            <Link to="/products">المنتجات</Link>
                            <Link to="/favorites">المفضلة</Link>
                            <Link to="/messages">تواصل معنا</Link>
                            <Link to="/profile">ملفي الشخصي</Link>
                            <Link to="/track">تتبع طلبي</Link>
                            <Link to="/rewards">المكافآت</Link>
                            <Link to="/terms">الشروط والأحكام</Link>
                        </div>
                    </div>
                    <div>
                        <h4>الأصناف</h4>
                        <div className="footer-links">
                            {state.categories.map(cat => (
                                <Link key={cat.id} to={`/products?category=${cat.id}`}>
                                    {cat.icon} {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4>تواصل معنا</h4>
                        <div className="footer-links">
                            <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                                📱 واتساب
                            </a>
                            {s.instagramLink && (
                                <a href={s.instagramLink} target="_blank" rel="noopener noreferrer">
                                    📸 إنستقرام
                                </a>
                            )}
                            {s.facebookLink && (
                                <a href={s.facebookLink} target="_blank" rel="noopener noreferrer">
                                    📘 فيسبوك
                                </a>
                            )}
                            {s.snapchatLink && (
                                <a href={s.snapchatLink} target="_blank" rel="noopener noreferrer">
                                    👻 سناب شات
                                </a>
                            )}
                            <a href="#">📧 البريد الإلكتروني</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} {s.storeName}. جميع الحقوق محفوظة. <Link to="/terms" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>الشروط والأحكام</Link></p>
                </div>
            </div>
        </footer>
    );
}
