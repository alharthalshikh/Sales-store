import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    updateUser,
    toggleUserStatus,
    toggleUserSuspension,
    deleteUser,
    getUsersStats
} from '@/services/userService';
import {
    Shield,
    Fingerprint,
    Globe,
    Smartphone,
    Battery,
    Trash2,
    Edit2,
    Ban,
    Search,
    Filter,
    UserCircle,
    MapPin,
    Calendar,
    Mail,
    Phone,
    UserCheck,
    UserMinus,
    Loader2,
    X,
    MoreVertical,
    Unlock,
    Activity
} from 'lucide-react';
import { showToast } from '@/components/ToastContainer';

export default function AdminUsers() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const { data: users = [], isLoading, isError, refetch: refetchUsers } = useQuery({
        queryKey: ['users', roleFilter, searchQuery],
        queryFn: () => getUsers({ role: roleFilter, searchQuery }),
        retry: 1
    });

    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['users-stats'],
        queryFn: getUsersStats,
        retry: 1
    });

    const handleRetry = () => {
        refetchUsers();
        refetchStats();
    };

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['users-stats'] });
        },
        onError: (error: any) => {
            showToast(error.message || 'حدث خطأ ما', 'error');
        }
    };

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }: any) => toggleUserStatus(id, isActive),
        ...mutationOptions,
        onSuccess: () => {
            showToast('تم تحديث حالة المستخدم');
            mutationOptions.onSuccess();
        }
    });

    const toggleSuspensionMutation = useMutation({
        mutationFn: ({ id, isSuspended }: any) => toggleUserSuspension(id, isSuspended),
        ...mutationOptions,
        onSuccess: () => {
            showToast('تم تحديث حظر المستخدم');
            mutationOptions.onSuccess();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        ...mutationOptions,
        onSuccess: () => {
            showToast('تم حذف المستخدم بنجاح');
            mutationOptions.onSuccess();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => updateUser(id, data),
        ...mutationOptions,
        onSuccess: () => {
            showToast('تم تحديث بيانات المستخدم');
            setIsEditModalOpen(false);
            mutationOptions.onSuccess();
        }
    });

    const handleEdit = (user: any) => {
        setEditForm({ ...user, password: '' });
        setIsEditModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={28} /> إدارة المستخدمين
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>إدارة الحسابات، الصلاحيات، ومتابعة النشاط التقني والأمان</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="stat-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                        <div style={{ background: 'rgba(200, 134, 10, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <UserCircle size={20} color="var(--accent)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>الإجمالي</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats ? stats.total : (isLoading ? '...' : '-')}</div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                        <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <UserCheck size={20} color="var(--success)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>النشطين</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats ? stats.active : (isLoading ? '...' : '-')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="stat-card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={18} />
                    <input
                        type="text"
                        placeholder="ابحث بالاسم، البريد أو الهاتف..."
                        style={{ width: '100%', padding: '12px 45px 12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', fontSize: '0.95rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                    <Filter size={18} color="var(--text-light)" />
                    <select
                        style={{ flex: 1, padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', fontSize: '0.95rem' }}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">كل الأدوار</option>
                        <option value="admin">مدير (Admin)</option>
                        <option value="moderator">مشرف (Moderator)</option>
                        <option value="customer">عميل (Customer)</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>الدور</th>
                            <th style={{ textAlign: 'center' }}>الحالة</th>
                            <th style={{ textAlign: 'center' }}>بصمة الجهاز</th>
                            <th style={{ textAlign: 'center' }}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                                    <Loader2 className="spin" size={40} color="var(--accent)" />
                                    <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>جاري تحميل البيانات...</p>
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--error)', marginBottom: '16px', fontSize: '1.1rem' }}>⚠️ فشل الاتصال بقاعدة البيانات</div>
                                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
                                        يبدو أن هناك مشكلة في الشبكة أو أن هناك "بروكسي" يمنع الاتصال. يرجى التأكد من الإنترنت أو إيقاف أي VPN.
                                    </p>
                                    <button className="btn btn-primary" onClick={handleRetry} style={{ padding: '8px 25px' }}>
                                        محاولة مرة أخرى
                                    </button>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)' }}>
                                    لا يوجد مستخدمين يطابقون البحث
                                </td>
                            </tr>
                        ) : users.map((user: any) => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#1a1408', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, justifyContent: 'center' }}>
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', gap: '8px' }}>
                                                <span>{user.email}</span>
                                                {user.phone && <span style={{ color: 'var(--border)' }}>|</span>}
                                                <span>{user.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                                        background: user.role === 'admin' ? 'rgba(200, 134, 10, 0.2)' :
                                            user.role === 'moderator' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: user.role === 'admin' ? 'var(--accent)' :
                                            user.role === 'moderator' ? '#9c27b0' : 'var(--text-secondary)',
                                        border: `1px solid ${user.role === 'admin' ? 'var(--border)' :
                                            user.role === 'moderator' ? 'rgba(156, 39, 176, 0.3)' : 'transparent'}`
                                    }}>
                                        {user.role === 'admin' ? 'مدير عام' :
                                            user.role === 'moderator' ? 'مشرف' : 'عميل'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                        <span className={`status-badge ${user.is_active ? 'status-confirmed' : 'status-cancelled'}`}>
                                            {user.is_active ? 'نشط' : 'غير نشط'}
                                        </span>
                                        {user.is_suspended && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: 700 }}>محظور نهائياً</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="btn btn-secondary btn-small"
                                        style={{ padding: '6px 12px', display: 'inline-flex', gap: '6px', fontSize: '0.75rem' }}
                                    >
                                        <Fingerprint size={14} /> بصمة الجهاز
                                    </button>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button className="nav-icon-btn" style={{ width: '36px', height: '36px' }} title="تعديل" onClick={() => handleEdit(user)}><Edit2 size={16} /></button>
                                        <button
                                            className="nav-icon-btn"
                                            style={{ width: '36px', height: '36px', color: user.is_suspended ? 'var(--success)' : 'var(--warning)' }}
                                            title={user.is_suspended ? "إلغاء الحظر" : "حظر"}
                                            onClick={() => toggleSuspensionMutation.mutate({ id: user.id, isSuspended: user.is_suspended })}
                                        >
                                            {user.is_suspended ? <Unlock size={16} /> : <Ban size={16} />}
                                        </button>
                                        <button
                                            className="nav-icon-btn danger"
                                            style={{ width: '36px', height: '36px', color: 'var(--error)' }}
                                            title="حذف"
                                            onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) deleteMutation.mutate(user.id) }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Device Info Modal */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Fingerprint size={24} color="var(--accent)" /> بصمة الأمان: {selectedUser.name}
                            </h2>
                            <button className="nav-icon-btn" onClick={() => setSelectedUser(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--accent)', fontWeight: 700 }}>
                                        <Smartphone size={20} /> تفاصيل الجهاز
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-light)' }}>نظام التشغيل:</span>
                                            <span>{selectedUser.device_info?.os || 'غير متوفر'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-light)' }}>المتصفح:</span>
                                            <span>{selectedUser.device_info?.browser || 'غير متوفر'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-light)' }}>عنوان IP:</span>
                                            <span dir="ltr">{selectedUser.device_info?.ip || '0.0.0.0'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Battery size={16} color="var(--success)" />
                                            <span>مستوى البطارية: {selectedUser.device_info?.battery || '-%'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--accent)', fontWeight: 700 }}>
                                        <MapPin size={20} /> الموقع والنشاط
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-light)' }}>آخر تواجد:</span>
                                            <span>{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('ar-SA') : 'لم يتم التسجيل'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-light)' }}>الموقع التقريبي:</span>
                                            <span>{selectedUser.last_location?.city || 'غير محدد'}</span>
                                        </div>
                                        <div style={{ marginTop: '10px' }}>
                                            <a
                                                href={`https://www.google.com/maps?q=${selectedUser.last_location?.lat},${selectedUser.last_location?.lng}`}
                                                target="_blank"
                                                className="btn btn-primary"
                                                style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                                            >
                                                <Globe size={16} /> فتح في الموقع الجغرافي
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(244, 67, 54, 0.05)', borderRadius: '12px', border: '1px solid rgba(244, 67, 54, 0.1)' }}>
                                <div style={{ fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Activity size={18} /> نصيحة أمان
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    إذا تم رصد دخول من جهاز غريب أو موقع غير معتاد، يفضل التواصل مع العميل أو حظر الحساب مؤقتاً لحين التحقق.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✏️ تعديل بيانات المستخدم</h2>
                            <button className="nav-icon-btn" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px' }}>اسم المستخدم</label>
                                    <input
                                        type="text"
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px' }}>رقم الهاتف</label>
                                    <input
                                        type="text"
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                                        value={editForm.phone || ''}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px' }}>البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                                    value={editForm.email || ''}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px' }}>الدور (الصلاحية)</label>
                                    <select
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                                        value={editForm.role || 'customer'}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    >
                                        <option value="customer">عميل عادي</option>
                                        <option value="moderator">مشرف</option>
                                        <option value="admin">مدير متجر</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '6px' }}>تعديل كلمة المرور</label>
                                    <input
                                        type="password"
                                        placeholder="اتركها فارغة لعدم التغيير"
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)' }}
                                        value={editForm.password || ''}
                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={() => updateMutation.mutate({ id: editForm.id, data: editForm })}>حفظ التغييرات</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
