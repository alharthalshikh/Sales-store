import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    QueryConstraint
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';

// ========== جلب كافة المستخدمين (المصدر الموحد: Firestore) ==========
export async function getUsers(filters: { role?: string, searchQuery?: string, limit?: number, offset?: number }) {
    const role = filters.role !== 'all' ? filters.role : undefined;
    const search = filters.searchQuery || '';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    try {
        const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

        if (role) {
            constraints.unshift(where('role', '==', role));
        }

        const q = query(collection(db, USERS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);

        let allUsers = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        // تطبيق البحث برمجياً
        if (search) {
            const s = search.toLowerCase();
            allUsers = allUsers.filter((u: any) =>
                u.name?.toLowerCase().includes(s) ||
                u.email?.toLowerCase().includes(s) ||
                u.phone?.includes(s)
            );
        }

        return allUsers.slice(offset, offset + limit);
    } catch (e) {
        console.error('❌ Error fetching users from Firestore:', e);
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

    // إزالة حقول undefined
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
    });

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, updateData);

    return true;
}

// ========== تفعيل/تعطيل الحساب ==========
export async function toggleUserStatus(userId: string, isActive: boolean) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { is_active: !isActive });
        return true;
    } catch (e) {
        console.error('❌ Error toggling user status:', e);
        return false;
    }
}

// ========== حظر المستخدم ==========
export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { is_suspended: !isSuspended });
        return true;
    } catch (e) {
        console.error('❌ Error toggling suspension:', e);
        return false;
    }
}

// ========== حذف المستخدم نهائياً ==========
export async function deleteUser(userId: string) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await deleteDoc(userRef);
        return true;
    } catch (e) {
        console.error('❌ Error deleting user:', e);
        return false;
    }
}

// ========== إحصائيات لوحة التحكم الشاملة ==========
export async function getUsersStats() {
    try {
        const snapshot = await getDocs(collection(db, USERS_COLLECTION));
        const userData = snapshot.docs.map(d => d.data());

        return {
            total: userData.length,
            active: userData.filter((u: any) => u.is_active).length,
            admins: userData.filter((u: any) => u.role === 'admin' || u.role === 'moderator').length
        };
    } catch (e) {
        console.error('❌ Error in getUsersStats:', e);
        return { total: 0, active: 0, admins: 0 };
    }
}
