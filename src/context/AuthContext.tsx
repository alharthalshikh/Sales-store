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
