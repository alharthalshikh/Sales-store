import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { state } = useStore();
    const s = state.settings;

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // تحقق مما إذا كان المستخدم قد أغلق التنبيه سابقاً في هذه الجلسة
            const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
            if (!isDismissed) {
                // إظهار التنبيه بعد 5 ثوانٍ من دخول الموقع لضمان تجربة مستخدم جيدة
                setTimeout(() => setIsVisible(true), 5000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // حفظ قرار الإغلاق للجلسة الحالية فقط
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
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
                        قم بتثبيت المتجر على شاشتك الرئيسية للوصول السريع، والحصول على إشعارات فورية وتجربة تسوق أفضل.
                    </p>

                    <div className="pwa-actions">
                        <button className="pwa-install-btn" onClick={handleInstall}>
                            تثبيت الآن
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
                    width: 380px;
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
                    padding: 24px;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow);
                }

                .pwa-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    transition: all 0.3s;
                    padding: 4px;
                    border-radius: 50%;
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
                }

                .pwa-icon-box {
                    width: 44px;
                    height: 44px;
                    background: rgba(200, 134, 10, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border);
                }

                .pwa-title {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0;
                }

                .pwa-description {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 20px;
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
                    padding: 12px;
                    font-size: 0.95rem;
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
                    padding: 12px 20px;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 0.95rem;
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
                        padding: 20px;
                    }
                }
            `}</style>
        </div>
    );
}
