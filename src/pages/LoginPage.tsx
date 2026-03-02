import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock, Mail, Eye, EyeOff, LogIn, UserPlus,
  User, Phone, ChevronLeft, Search, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../hooks/useStore';
import LogoRenderer from '../components/LogoRenderer';

export default function LoginPage() {
  const { login, signUp, user, isAdmin, loading } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();
  const s = state.settings;

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!loading && user) {
      // لو المستخدم مسجل دخول بالفعل، نرجعه بدون ما نحفظ صفحة اللوقن في التاريخ
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    if (mode === 'login') {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('كلمات المرور غير متطابقة');
        setSubmitting(false);
        return;
      }

      const result = await signUp(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone
      });

      if (result.success) {
        setSuccessMsg('تم إنشاء الحساب بنجاح! 🎉 يمكنك الآن تسجيل الدخول مباشرة.');
        setMode('login');
        // تفريغ كلمة المرور ليقوم المستخدم بكتابتها مرة أخرى للتأكيد كما طلب المستخدم
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        setError(result.error || 'خطأ في إنشاء الحساب');
      }
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', animation: 'pulse 1.5s infinite', display: 'flex', justifyContent: 'center' }}>
            <LogoRenderer logo={s.storeLogo} size={120} />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-root">
      <div className="auth-container">
        {/* Branding */}
        <div className="auth-branding">
          <div className="auth-logo-box">
            <LogoRenderer logo={s.storeLogo} size={100} />
          </div>
          <h1 className="auth-brand-name">{s.storeName}</h1>
          <p className="auth-brand-tagline">لوحة إدارة المتجر السحابية</p>
        </div>

        {/* Card */}
        <div className="auth-card-new">
          <h2 className="auth-card-title">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="auth-card-subtitle">
            {mode === 'login'
              ? 'سجّل دخولك للوصول إلى لوحة التحكم'
              : `أنشئ حسابك للبدء في إدارة ${s.storeName}`}
          </p>

          <form onSubmit={handleSubmit} className="auth-form-new">
            {error && <div className="auth-msg error">⚠️ {error}</div>}
            {successMsg && <div className="auth-msg success">✅ {successMsg}</div>}

            {mode === 'signup' && (
              <div className="input-field-group">
                <div className="input-label-row">
                  <User size={18} className="icon-gold" />
                  <label>الاسم الكامل</label>
                </div>
                <input
                  type="text" name="name"
                  placeholder="أدخل اسمك الكامل (مثال: أحمد محمد)"
                  value={formData.name} onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="input-field-group">
              <div className="input-label-row">
                <Mail size={18} className="icon-gold" />
                <label>البريد الإلكتروني</label>
              </div>
              <input
                type="email" name="email"
                placeholder="example@email.com"
                value={formData.email} onChange={handleChange}
                required dir="ltr"
              />
            </div>

            {mode === 'signup' && (
              <div className="input-field-group">
                <div className="input-label-row">
                  <Phone size={18} className="icon-gold" />
                  <label>رقم الجوال <span className="opt-tag">(اختياري)</span></label>
                </div>
                <input
                  type="text" name="phone"
                  placeholder="أدخل رقم الهاتف"
                  value={formData.phone} onChange={handleChange}
                  dir="ltr"
                />
              </div>
            )}

            <div className="input-field-group">
              <div className="input-label-row">
                <Lock size={18} className="icon-gold" />
                <label>كلمة المرور</label>
              </div>
              <div className="pass-input-box">
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  placeholder="........"
                  value={formData.password} onChange={handleChange}
                  required dir="ltr"
                />
                <button type="button" className="btn-eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="input-field-group">
                <div className="input-label-row">
                  <Lock size={18} className="icon-gold" />
                  <label>تأكيد كلمة المرور</label>
                </div>
                <div className="pass-input-box">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                    placeholder="........"
                    value={formData.confirmPassword} onChange={handleChange}
                    required dir="ltr"
                  />
                  <button type="button" className="btn-eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? 'جاري المعالجة...' : mode === 'login' ? 'تسجيل الدخول' : (
                <span className="btn-content-flex">
                  إنشاء الحساب <ChevronLeft size={20} />
                </span>
              )}
            </button>

            <div className="auth-mode-switch">
              <p>
                {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="switch-btn">
                  {mode === 'login' ? 'أنشئ حساباً جديداً' : 'سجل دخولك'}
                </button>
              </p>
            </div>
          </form>
        </div>

        <Link to="/" className="auth-back-link">
          <ChevronLeft size={16} /> العودة للصفحة الرئيسية
        </Link>
      </div>

      <style>{`
        .auth-page-root {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 20px;
          color: var(--text);
          font-family: 'Tajawal', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .auth-page-root::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: var(--accent);
          filter: blur(150px);
          opacity: 0.05;
          top: -100px; right: -100px;
          z-index: 0;
        }

        .auth-container {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
        }

        .auth-branding {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-logo-box {
          min-width: 120px;
          height: 120px;
          padding: 0 24px;
          background: var(--surface);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 3.2rem;
          box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          border: 1.5px solid var(--border);
          backdrop-filter: blur(15px);
          white-space: nowrap;
          overflow: hidden;
          max-width: 90%;
        }

        .auth-logo-box img {
          max-height: 85px;
          width: auto;
          object-fit: contain;
        }

        .auth-brand-name {
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent);
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .auth-brand-tagline {
          color: var(--text-light);
          font-size: 0.9rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-card-new {
          background: var(--bg-alt);
          border-radius: 28px;
          padding: 40px 32px;
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          text-align: center;
          animation: fadeIn 0.6s ease-out forwards;
        }

        .auth-card-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 10px;
        }

        .auth-card-subtitle {
          color: var(--text-light);
          font-size: 0.9rem;
          margin-bottom: 35px;
        }

        .auth-form-new {
          text-align: right;
        }

        .input-field-group {
          margin-bottom: 24px;
        }

        .input-label-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .input-label-row label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text);
        }

        .icon-gold {
          color: var(--accent);
        }

        .opt-tag {
          font-size: 0.8rem;
          opacity: 0.5;
          font-weight: 400;
        }

        .auth-form-new input {
          width: 100%;
          background: rgba(30, 23, 16, 0.6);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 14px 18px;
          color: var(--text);
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .auth-form-new input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(42, 32, 24, 0.9);
          box-shadow: 0 0 0 4px var(--accent-glow);
          transform: translateY(-1px);
        }
        .pass-input-box {
          position: relative;
        }

        .pass-input-box input {
          padding-left: 50px;
        }

        .btn-eye-toggle {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.3s;
        }

        .btn-eye-toggle:hover {
          color: var(--accent);
        }

        .auth-submit-btn {
          width: 100%;
          background: var(--gradient);
          color: #1a1408;
          border: none;
          border-radius: 14px;
          padding: 16px;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
          box-shadow: 0 4px 15px var(--accent-glow);
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px var(--accent-glow);
          filter: brightness(1.15);
        }

        .auth-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        .btn-content-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .auth-mode-switch {
          margin-top: 25px;
          color: var(--text-light);
          font-size: 0.95rem;
          text-align: center;
        }

        .switch-btn {
          background: none;
          border: none;
          color: var(--primary-light);
          font-weight: 700;
          cursor: pointer;
          margin-right: 8px;
          transition: color 0.3s;
        }

        .switch-btn:hover {
          color: var(--accent);
          text-decoration: underline;
        }

        .auth-msg {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          text-align: right;
        }

        .auth-msg.error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.1);
        }

        .auth-msg.success {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.1);
        }

        .auth-back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 35px;
          color: var(--text-light);
          text-decoration: none;
          font-size: 0.95rem;
          transition: all 0.3s;
          padding: 8px;
          border-radius: 10px;
        }

        .auth-back-link:hover {
          color: var(--accent);
          background: rgba(200, 134, 10, 0.1);
          transform: translateX(-5px);
        }

        @media (max-width: 480px) {
          .auth-card-new {
            padding: 30px 20px;
            border-radius: 20px;
          }
        }
      `}</style>
    </div>
  );
}
