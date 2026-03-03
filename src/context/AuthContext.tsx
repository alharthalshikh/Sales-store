// ============================================================
// 🔐 نظام المصادقة المطور - Supabase Auth
// ============================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    isAdmin: boolean;
    adminName: string;
    adminEmail: string;
    user: User | null;
    loading: boolean;
    role: string | null;
    isBanned: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    signUp: (email: string, password: string, metadata: { name: string, phone?: string }) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔒 إيميل المدير العام الثابت
const MASTER_ADMIN_EMAIL = 'alharth465117@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [role, setRole] = useState<string | null>(null);
    const [isBanned, setIsBanned] = useState(false);
    const [loading, setLoading] = useState(true);

    // سحب البيانات من الذاكرة المحلية فوراً لتسريع العرض
    useEffect(() => {
        const fallback = localStorage.getItem('admin-fallback');
        if (fallback) {
            try {
                const parsed = JSON.parse(fallback);
                setIsAdmin(true);
                setAdminName(parsed.name);
                setAdminEmail(parsed.email);
                setRole(parsed.role || 'admin');
            } catch (e) { }
        }
    }, []);

    const captureFingerprint = async (userId: string) => {
        try {
            // 1. استخبارات العتاد (Hardware Intelligence)
            const ua = window.navigator.userAgent;
            const hardware: any = {
                cores: (navigator as any).hardwareConcurrency || 'N/A',
                ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A',
                touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'نعم' : 'لا',
                gpu: 'Unknown',
                storage: 'N/A'
            };

            // تقدير مساحة القرص
            try {
                if (navigator.storage && navigator.storage.estimate) {
                    const { quota } = await navigator.storage.estimate();
                    hardware.storage = quota ? `${Math.round(quota / (1024 ** 3))} GB` : 'N/A';
                }
            } catch (e) { }

            // بصمة الهوية الرقمية (Canvas Fingerprint)
            let canvasID = 'N/A';
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.textBaseline = "top"; ctx.font = "16px 'Arial'";
                    ctx.fillText("SalesStore-ID-" + userId.slice(0, 5), 2, 2);
                    canvasID = btoa(canvas.toDataURL()).slice(-45, -5);
                }
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as any;
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) hardware.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            } catch (e) { }

            // 2. كشف الثغرات والبرمجيات (Software Forensics)
            let isIncognito = false;
            try {
                const { quota } = await (navigator as any).storage.estimate();
                if (quota < 120000000) isIncognito = true;
            } catch (e) { }

            let adBlock = false;
            try {
                await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors' }).catch(() => adBlock = true);
            } catch (e) { }

            const conn: any = (navigator as any).connection || {};
            const network = {
                type: conn.effectiveType || 'Unknown',
                downlink: conn.downlink ? `${conn.downlink} Mbps` : 'N/A',
                rtt: conn.rtt ? `${conn.rtt} ms` : 'N/A'
            };

            // 3. تحليل مستوى المخاطر (Risk Scoring Engine)
            let risk = 0;
            if (isIncognito) risk += 30;
            if (adBlock) risk += 5;

            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let deviceInfo: any = {
                os: ua.includes('Win') ? 'Windows' : ua.includes('Android') ? 'Android' : ua.includes('Mac') ? 'MacOS' : 'iOS',
                browser: ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Firefox',
                ip: '0.0.0.0',
                battery: '-%',
                screen: { res: `${window.screen.width}x${window.screen.height}`, depth: `${window.screen.colorDepth}-bit` },
                timezone,
                hardware,
                network,
                canvasID,
                isIncognito,
                adBlock,
                agent: ua,
                isp: 'Unknown',
                isVPN: false,
                riskScore: 0
            };

            let lastLocation = { city: 'غير محدد', country: 'غير معروف', country_code: '', lat: 0, lng: 0 };

            try {
                const res = await fetch('https://ipapi.co/json/');
                const geo = await res.json();
                if (geo) {
                    deviceInfo.ip = geo.ip;
                    deviceInfo.isp = geo.org;
                    if (geo.timezone && geo.timezone !== timezone) {
                        deviceInfo.isVPN = true;
                        risk += 40;
                    }
                    lastLocation = { city: geo.city, country: geo.country_name, country_code: geo.country_code, lat: geo.latitude, lng: geo.longitude };
                }
            } catch (e) { }

            // توليد معرف رقمي موحد (Unique Identity Hash)
            deviceInfo.riskScore = Math.min(risk, 100);
            deviceInfo.digest = btoa(`${deviceInfo.ip}-${deviceInfo.os}-${canvasID.slice(0, 8)}`).slice(0, 16);

            try {
                const b: any = await (navigator as any).getBattery?.();
                if (b) deviceInfo.battery = `${Math.round(b.level * 100)}%`;
            } catch (e) { }

            // 4. الحفظ النهائي (Update and Confirm)
            const { error: updateError } = await supabase.from('users').update({
                device_info: deviceInfo,
                last_location: lastLocation,
                last_login: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).eq('id', userId);

            if (updateError) {
                console.warn("⚠️ فشل في تحديث البصمة الرقمية:", updateError.message);
            } else {
                console.log("✅ تمت أرشفة البصمة الجنائية بنجاح للهدف:", userId.slice(0, 8));
            }

        } catch (error) {
            console.error("🕵️ نظام البصمة: خطأ فادح:", error);
        }
    };

    const checkAdmin = async (userId: string, email: string): Promise<boolean> => {
        console.log("🧐 جاري فحص رتبة المستخدم:", email);

        // 🔒 خط الدفاع الأول: إيميل المدير العام = أدمن فوراً في الواجهة
        const isMasterAdmin = email === MASTER_ADMIN_EMAIL;
        if (isMasterAdmin) {
            console.log("👑 مرحباً بالمدير العام!");
            setIsAdmin(true);
            setRole('admin');
            setAdminName('الحارث الشيخ');
            setAdminEmail(email);
            localStorage.setItem('admin-fallback', JSON.stringify({
                email, name: 'الحارث الشيخ', role: 'admin'
            }));
        }

        try {
            // محاولة جلب البيانات من جدول users
            let { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            // إذا لم يكن موجوداً في جدول users، ننشئ له سجلاً
            if (!userData) {
                console.log("🆕 إنشاء ملف شخصي جديد للمستخدم...");
                const newRole = isMasterAdmin ? 'admin' : 'customer';
                const { data: newProfile } = await supabase.from('users').upsert({
                    id: userId,
                    email: email,
                    name: isMasterAdmin ? 'الحارث الشيخ' : (user?.user_metadata?.full_name || 'مستخدم جديد'),
                    phone: user?.user_metadata?.phone || '',
                    role: newRole,
                    is_active: true,
                    is_suspended: false
                }).select().single();
                userData = newProfile;
            }

            // تأمين المدير العام: إذا كان الإيميل هو إيميل المدير ولكن الرتبة خاطئة
            if (isMasterAdmin && userData && userData.role !== 'admin') {
                console.log("🔧 تصحيح رتبة المدير العام...");
                await supabase.from('users').update({ role: 'admin', is_active: true, is_suspended: false }).eq('id', userId);
                userData.role = 'admin';
            }

            if (userData) {
                setRole(userData.role);

                // التحقق من الحظر (لا ينطبق على المدير العام)
                if (userData.is_suspended && !isMasterAdmin) {
                    setIsBanned(true);
                    setIsAdmin(false);
                    return false;
                }
                setIsBanned(false);

                const isUserAdmin = userData.role === 'admin' || userData.role === 'moderator';
                setIsAdmin(isUserAdmin);

                if (isUserAdmin) {
                    setAdminName(userData.name || 'مدير');
                    setAdminEmail(email);
                    localStorage.setItem('admin-fallback', JSON.stringify({
                        email,
                        name: userData.name || 'مدير',
                        role: userData.role
                    }));
                } else {
                    localStorage.removeItem('admin-fallback');
                }

                // 🛡️ الآن نقوم بتحديث البصمة بما أننا تأكدنا من وجود السجل
                captureFingerprint(userId);

                return isUserAdmin;
            }

            // fallback: لو فشل كل شيء والمستخدم هو المدير العام
            return isMasterAdmin;
        } catch (e) {
            console.error("❌ Error checking admin:", e);
            return isMasterAdmin;
        }
    };

    useEffect(() => {
        let isMounted = true;

        const timeout = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 5000);

        let profileSubscription: any = null;

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!isMounted) return;
            if (session?.user) {
                setUser(session.user);
                await checkAdmin(session.user.id, session.user.email || '');

                profileSubscription = supabase
                    .channel(`profile-${session.user.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${session.user.id}`
                    }, (payload) => {
                        if (payload.new && (payload.new as any).is_suspended) {
                            setIsBanned(true);
                        } else if (payload.new && !(payload.new as any).is_suspended) {
                            setIsBanned(false);
                        }
                    })
                    .subscribe();
            }
            setLoading(false);
            clearTimeout(timeout);
        }).catch(() => {
            if (isMounted) setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!isMounted) return;

                if (profileSubscription) {
                    supabase.removeChannel(profileSubscription);
                }

                if (session?.user) {
                    setUser(session.user);
                    await checkAdmin(session.user.id, session.user.email || '');

                    profileSubscription = supabase
                        .channel(`profile-${session.user.id}`)
                        .on('postgres_changes', {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'users',
                            filter: `id=eq.${session.user.id}`
                        }, (payload) => {
                            if (payload.new && (payload.new as any).is_suspended) {
                                setIsBanned(true);
                            } else if (payload.new && !(payload.new as any).is_suspended) {
                                setIsBanned(false);
                            }
                        })
                        .subscribe();
                } else {
                    setUser(null);
                    setIsAdmin(false);
                    setIsBanned(false);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (profileSubscription) supabase.removeChannel(profileSubscription);
            clearTimeout(timeout);
        };
    }, []);

    const translateAuthError = (msg: string) => {
        if (msg.includes('Invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        if (msg.includes('Email not confirmed')) return 'يرجى تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك';
        if (msg.includes('User not found')) return 'المستخدم غير موجود';
        if (msg.includes('Password is too short')) return 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)';
        if (msg.includes('User already registered')) return 'هذا البريد الإلكتروني مسجل مسبقاً';
        if (msg.includes('Too many requests')) return 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى';
        if (msg.includes('Database error')) return 'حدث خطأ في قاعدة البيانات. يرجى المحاولة لاحقاً';
        return msg;
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const authTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('عذراً، الخادم لا يستجيب. يرجى التأكد من الإنترنت وحاول ثانية.')), 15000)
            );

            const authPromise = supabase.auth.signInWithPassword({ email, password });
            const { data, error } = await Promise.race([authPromise, authTimeout]) as any;

            if (error) {
                return { success: false, error: translateAuthError(error.message) };
            }

            if (data.user) {
                setUser(data.user);
                await checkAdmin(data.user.id, data.user.email || '');

                if (isBanned) {
                    await supabase.auth.signOut();
                    setUser(null);
                    return { success: false, error: 'عذراً، هذا الحساب محظور. يرجى التواصل مع الإدارة.' };
                }

                return { success: true };
            }
            return { success: false, error: 'حدث خطأ غير متوقع' };
        } catch (e: any) {
            return { success: false, error: e.message || 'خطأ في الاتصال' };
        }
    };

    const signUp = async (email: string, password: string, metadata: { name: string, phone?: string }): Promise<{ success: boolean; error?: string }> => {
        try {
            console.log("📝 جاري إنشاء حساب جديد:", email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: metadata.name,
                        phone: metadata.phone
                    }
                }
            });

            if (error) {
                return { success: false, error: translateAuthError(error.message) };
            }

            // إنشاء ملف المستخدم في جدول users مباشرة (المصدر الموحد)
            if (data.user) {
                await supabase.from('users').upsert({
                    id: data.user.id,
                    email: email,
                    name: metadata.name,
                    phone: metadata.phone || '',
                    role: 'customer',
                    is_active: true,
                    is_suspended: false
                });
                return { success: true };
            }

            return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب' };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    const logout = async () => {
        // 1. مسح الحالة محلياً فوراً لجعل الواجهة سريعة الاستجابة
        localStorage.removeItem('admin-fallback');
        setUser(null);
        setIsAdmin(false);
        setAdminName('');
        setAdminEmail('');
        setIsBanned(false);
        setRole(null);

        // 2. محاولة تسجيل الخروج من السيرفر في الخلفية دون تعطيل المستخدم
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Sign out error (ignored):", e);
        }
    };

    return (
        <AuthContext.Provider value={{ isAdmin, adminName, adminEmail, user, loading, role, isBanned, login, logout, signUp }}>
            {children}
        </AuthContext.Provider>
    );
}
