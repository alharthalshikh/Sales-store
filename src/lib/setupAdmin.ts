// ============================================================
// 🔧 سكربت إعداد حساب الأدمن الأول (Firebase)
// ============================================================
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function setupAdmin() {
    const ADMIN_EMAIL = 'alharth465117@gmail.com';
    const ADMIN_PASSWORD = '77927792h';
    const ADMIN_NAME = 'الحارث الشيخ';

    try {
        // محاولة تسجيل الدخول أولاً
        const { user } = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        await setDoc(doc(db, 'users', user.uid), {
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            role: 'admin',
            is_active: true,
            is_suspended: false,
            updated_at: new Date().toISOString()
        }, { merge: true });
        return { success: true, user };
    } catch (loginError: any) {
        if (loginError.code === 'auth/user-not-found') {
            try {
                const { user } = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                await setDoc(doc(db, 'users', user.uid), {
                    email: ADMIN_EMAIL,
                    name: ADMIN_NAME,
                    role: 'admin',
                    is_active: true,
                    is_suspended: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                return { success: true, user };
            } catch (signupError: any) {
                return { success: false, error: signupError.message };
            }
        }
        return { success: false, error: loginError.message };
    }
}

export default setupAdmin;
