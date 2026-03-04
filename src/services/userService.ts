import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// ========== جلب كافة المستخدمين (المصدر الموحد: جدول users) ==========
export async function getUsers(filters: { role?: string, searchQuery?: string, limit?: number, offset?: number }) {
    const role = filters.role !== 'all' ? filters.role : undefined;
    const search = filters.searchQuery || '';
    const limit = filters.limit || 100; // زدنا الحد لنضمن رؤية الجميع
    const offset = filters.offset || 0;

    try {
        // الاستعلام من جدول واحد فقط وهو users
        let query = supabase.from('users').select('*');

        if (role) query = query.eq('role', role);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            // console.error('❌ Error fetching from users table:', error.message);
            return [];
        }

        let allUsers = data || [];

        // تطبيق البحث برمجياً
        if (search) {
            const s = search.toLowerCase();
            allUsers = allUsers.filter(u =>
                u.name?.toLowerCase().includes(s) ||
                u.email?.toLowerCase().includes(s) ||
                u.phone?.includes(s)
            );
        }

        return allUsers.slice(offset, offset + limit);
    } catch (e) {
        // console.error('❌ Unexpected error in getUsers:', e);
        return [];
    }
}

// ========== تحديث بيانات المستخدم والرتبة (الموحد) ==========
export async function updateUser(userId: string, data: any) {
    const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        updated_at: new Date().toISOString()
    };

    if (data.password && data.password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(data.password, salt);
    }

    // تحديث في سجل واحد فقط
    const { error } = await supabase.from('users').update(updateData).eq('id', userId);
    if (error) throw error;

    return true;
}

// ========== تفعيل/تعطيل الحساب ==========
export async function toggleUserStatus(userId: string, isActive: boolean) {
    const { error } = await supabase.from('users').update({ is_active: !isActive }).eq('id', userId);
    return !error;
}

// ========== حظر المستخدم ==========
export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
    const { error } = await supabase.from('users').update({ is_suspended: !isSuspended }).eq('id', userId);
    return !error;
}

// ========== حذف المستخدم نهائياً ==========
export async function deleteUser(userId: string) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    return !error;
}

// ========== إحصائيات لوحة التحكم الشاملة ==========
export async function getUsersStats() {
    try {
        const { data: users, error } = await supabase.from('users').select('role, is_active');
        if (error) throw error;

        const userData = users || [];

        return {
            total: userData.length,
            active: userData.filter(u => u.is_active).length,
            admins: userData.filter(u => u.role === 'admin' || u.role === 'moderator').length
        };
    } catch (e) {
        // console.error('❌ Error in getUsersStats:', e);
        return { total: 0, active: 0, admins: 0 };
    }
}
