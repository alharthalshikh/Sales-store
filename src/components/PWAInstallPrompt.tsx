import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import ConfirmModal from './ConfirmModal';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
    const { state } = useStore();
    const s = state.settings;
    const [showInstructions, setShowInstructions] = useState(false);
    const [instructionText, setInstructionText] = useState('');

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(ua);
        setPlatform(isIOS ? 'ios' : (/android/.test(ua) ? 'android' : 'other'));

        // 🛡️ التحقق من التثبيت المسبق
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || localStorage.getItem('pwa_installed') === 'true';

        if (isStandalone) return;

        // التحقق من وجود المطالبة المخزنة عالمياً
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).deferredPrompt = e;
        };

        const handlePromptReady = () => {
            if ((window as any).deferredPrompt) {
                setDeferredPrompt((window as any).deferredPrompt);
            }
        };

        const handleAppInstalled = () => {
            localStorage.setItem('pwa_installed', 'true');
            setIsVisible(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('pwa-prompt-ready', handlePromptReady);
        window.addEventListener('appinstalled', handleAppInstalled);

        // 🚀 إظهار الإعلان بعد 5 ثوانٍ من الدخول
        const timer = setTimeout(() => setIsVisible(true), 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('pwa-prompt-ready', handlePromptReady);
            window.removeEventListener('appinstalled', handleAppInstalled);
            clearTimeout(timer);
        };
    }, []);

    const handleInstall = async () => {
        // إذا كان هناك مطالبة تثبيت جاهزة، نستخدمها مباشرة
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('pwa_installed', 'true');
                    setIsVisible(false);
                }
                return;
            } catch (error) {
                console.error('Error during PWA installation:', error);
            }
        }

        // إذا لم يكن هناك مطالبة مباشرة (مثل آيفون أو متصفحات معينة)، نظهر التعليمات
        if (platform === 'ios') {
            setInstructionText('📱 للتثبيت على آيفون:\n1. اضغط على أيقونة المشاركة (Share) أسفل الشاشة\n2. مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)');
            setShowInstructions(true);
        } else {
            // حل بديل لسامسونج والمتصفحات الأخرى التي لا تدعم التثبيت البرمجي المباشر
            setInstructionText('⚙️ للتثبيت يدوياً:\n1. اضغط على قائمة الخيارات (⋮) أو (≡) بالمتصفح\n2. ابحث عن "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
            setShowInstructions(true);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false); // سيظهر مرة أخرى في الزيارة القادمة
    };

    if (!isVisible) return null;

    return (
        <div className="pwa-prompt-overlay">
            <div className="pwa-prompt-card">
                <button className="pwa-close-btn" onClick={handleDismiss} aria-label="إغلاق">
                    <X size={20} />
                </button>

                <div className="pwa-content">
                    <div className="pwa-header">
                        <div className="pwa-icon-box">
                            <Download size={22} color="var(--accent)" />
                        </div>
                        <h3 className="pwa-title">تثبيت تطبيق {s.storeName}</h3>
                    </div>

                    <p className="pwa-description">
                        {platform === 'ios'
                            ? 'للحصول على أفضل تجربة، أضف المتجر إلى شاشتك الرئيسية عبر زر المشاركة.'
                            : 'قم بتثبيت المتجر على شاشتك الرئيسية للوصول السريع وتجربة تسوق أفضل.'}
                    </p>

                    <div className="pwa-actions">
                        <button className="pwa-install-btn" onClick={handleInstall}>
                            {platform === 'ios' ? 'كيفية التثبيت؟' : 'تثبيت الآن'}
                        </button>
                        <button className="pwa-later-btn" onClick={handleDismiss}>
                            لاحقاً
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .pwa-prompt-overlay {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    width: 320px;
                    max-width: calc(100vw - 48px);
                    animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%) scale(0.9); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }

                .pwa-prompt-card {
                    background: rgba(30, 23, 16, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    padding: 18px;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow);
                }

                .pwa-close-btn {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    background: none;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    transition: all 0.3s;
                    padding: 4px;
                    border-radius: 50%;
                    z-index: 2;
                }

                .pwa-close-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: var(--accent);
                }

                .pwa-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    padding-right: 20px;
                }

                .pwa-icon-box {
                    width: 40px;
                    height: 40px;
                    background: rgba(200, 134, 10, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border);
                    flex-shrink: 0;
                }

                .pwa-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0;
                }

                .pwa-description {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 18px;
                    text-align: right;
                }

                .pwa-actions {
                    display: flex;
                    flex-direction: row-reverse;
                    gap: 12px;
                    align-items: center;
                }

                .pwa-install-btn {
                    flex: 1;
                    background: var(--gradient);
                    color: #1a1408;
                    border: none;
                    border-radius: 14px;
                    padding: 10px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px var(--accent-glow);
                }

                .pwa-install-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px var(--accent-glow);
                    filter: brightness(1.1);
                }

                .pwa-later-btn {
                    padding: 10px 16px;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .pwa-later-btn:hover {
                    color: var(--accent);
                }

                @media (max-width: 480px) {
                    .pwa-prompt-overlay {
                        bottom: 16px;
                        right: 16px;
                        left: 16px;
                        width: auto;
                        max-width: none;
                    }
                    
                    .pwa-prompt-card {
                        padding: 16px;
                    }
                }
            `}</style>

            <ConfirmModal
                isOpen={showInstructions}
                title="تعليمات التثبيت"
                message={instructionText}
                onConfirm={() => setShowInstructions(false)}
                onCancel={() => setShowInstructions(false)}
                confirmText="موافق"
                cancelText="إغلاق"
                type="warning"
            />
        </div>
    );
}
