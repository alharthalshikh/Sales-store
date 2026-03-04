// ============================================================
// 🔧 سكربت إعداد حساب الأدمن الأول
// ============================================================
import { supabase } from '../lib/supabase';

export async function setupAdmin() {
    const ADMIN_EMAIL = 'alharth465117@gmail.com';
    const ADMIN_PASSWORD = '77927792h';
    const ADMIN_NAME = 'الحارث الشيخ';

    // console.log('🚀 جاري إنشاء حساب الأدمن...');

    const { data, error } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });

    if (error) {
        if (error.message.includes('already registered')) {
            // console.log('✅ المستخدم موجود مسبقاً، جاري تسجيل الدخول...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            });
            if (loginError) {
                // console.error('❌ خطأ في تسجيل الدخول:', loginError.message);
                return { success: false, error: loginError.message };
            }
            if (loginData.user) {
                // تحديث رتبة المدير في الجدول الموحد
                await supabase.from('users').upsert({
                    id: loginData.user.id,
                    email: ADMIN_EMAIL,
                    name: ADMIN_NAME,
                    role: 'admin',
                    is_active: true,
                });
                // console.log('✅ تم تسجيل الدخول وتأكيد صلاحيات الأدمن!');
                return { success: true, user: loginData.user };
            }
        }
        // console.error('❌ خطأ:', error.message);
        return { success: false, error: error.message };
    }

    if (data.user) {
        await supabase.from('users').upsert({
            id: data.user.id,
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            role: 'admin',
            is_active: true,
        });
        // console.log('✅ تم إنشاء حساب الأدمن بنجاح!');
        return { success: true, user: data.user };
    }

    return { success: false, error: 'خطأ غير معروف' };
}

export default setupAdmin;
