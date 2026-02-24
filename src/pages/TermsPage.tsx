import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

export default function TermsPage() {
    const navigate = useNavigate();
    const { state } = useStore();
    const s = state.settings;

    // محتوى افتراضي في حال لم يضع المدير شروطاً
    const defaultTerms = `
مرحباً بك في ${s.storeName}!

باستخدامك لهذا المتجر، فإنك توافق على الشروط التالية:

🔹 سياسة الطلب والشراء
• جميع الأسعار المعروضة بالـ ${s.currency} وتشمل الضريبة.
• يتم تأكيد الطلب بعد مراجعته من فريقنا خلال ساعات العمل.
• يحق لنا رفض أي طلب في حال عدم توفر المنتج.

🔹 سياسة التوصيل
• يتم التوصيل خلال 1-3 أيام عمل حسب الموقع.
• رسوم التوصيل تُحسب حسب المنطقة وتُعرض عند إتمام الطلب.
• يجب أن يكون العنوان ورقم الهاتف صحيحين لضمان التوصيل.

🔹 سياسة الاستبدال والإرجاع
• يمكنك طلب استبدال المنتج خلال 24 ساعة من الاستلام.
• المنتجات الغذائية المفتوحة لا يمكن إرجاعها.
• يجب أن يكون المنتج بحالته الأصلية للاستبدال.

🔹 الخصوصية وحماية البيانات
• نحمي بياناتك الشخصية ولا نشاركها مع أطراف ثالثة.
• نستخدم تشفير SSL لحماية معاملاتك.
• يمكنك طلب حذف بياناتك في أي وقت.

🔹 نقاط الولاء
• تكسب نقطة واحدة مقابل كل 10 ${s.currencySymbol} تنفقها.
• يمكن استخدام النقاط كخصم على المشتريات المستقبلية.
• النقاط صالحة لمدة 12 شهراً من تاريخ اكتسابها.
• يحق لنا تعديل برنامج الولاء بإشعار مسبق.

🔹 حقوق الملكية
• جميع المحتويات والصور والعلامات التجارية مملوكة لـ ${s.storeName}.
• يُمنع نسخ أو إعادة استخدام المحتوى بدون إذن مسبق.

للتواصل معنا حول أي استفسار يتعلق بالشروط:
📱 واتساب: ${s.whatsappNumber}
    `.trim();

    const termsContent = (s as any).termsConditions || defaultTerms;
    const privacyContent = (s as any).privacyPolicy || '';

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px', maxWidth: '800px' }}>

                {/* رأس الصفحة */}
                <div style={{
                    background: 'var(--gradient)',
                    borderRadius: '24px',
                    padding: '40px 32px',
                    textAlign: 'center',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '-40%', left: '-20%',
                        width: '250px', height: '250px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%', filter: 'blur(40px)',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📜</div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                            الشروط والأحكام
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                            {s.storeName} — سياسة الاستخدام وحماية حقوقك
                        </p>
                    </div>
                </div>

                {/* المحتوى الأساسي */}
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '32px',
                    marginBottom: '24px',
                }}>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 2,
                        fontSize: '1rem',
                        color: 'var(--text)',
                    }}>
                        {termsContent}
                    </div>
                </div>

                {/* سياسة الخصوصية إن وجدت */}
                {privacyContent && (
                    <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '32px',
                        marginBottom: '24px',
                    }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', color: 'var(--accent)' }}>
                            🔒 سياسة الخصوصية
                        </h2>
                        <div style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 2,
                            fontSize: '1rem',
                            color: 'var(--text)',
                        }}>
                            {privacyContent}
                        </div>
                    </div>
                )}

                {/* تاريخ آخر تحديث */}
                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-light)',
                    fontSize: '0.85rem',
                    marginBottom: '24px',
                }}>
                    آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                {/* أزرار الرجوع */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => navigate(-1)}>
                        ↩️ رجوع
                    </button>
                    <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        📱 تواصل معنا
                    </a>
                </div>
            </div>
        </div>
    );
}
