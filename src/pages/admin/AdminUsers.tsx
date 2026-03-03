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
                    <div className="modal cyber-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '980px', background: '#050507', border: '1px solid #1a1a2e', boxShadow: '0 0 50px rgba(200, 134, 10, 0.1)' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #1a1a2e', padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div className="radar-box">
                                    <div className="radar-ping"></div>
                                    <Shield size={24} color="var(--accent)" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>مركز الأمان والتحليل الجنائي (Security Forensic Hub)</h2>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>المعرف الرقمي الدائم: {selectedUser.device_info?.digest || 'N/A'}</div>
                                </div>
                            </div>
                            <button className="nav-icon-btn" onClick={() => setSelectedUser(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                                <div className="stat-pill">
                                    <label>مؤشر مستوى المخاطر:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="risk-gauge">
                                            <div className="risk-fill" style={{ width: `${selectedUser.device_info?.riskScore || 0}%`, background: (selectedUser.device_info?.riskScore || 0) > 60 ? '#f44336' : (selectedUser.device_info?.riskScore || 0) > 30 ? '#ff9800' : '#4caf50' }}></div>
                                        </div>
                                        <span style={{ fontWeight: 800, color: (selectedUser.device_info?.riskScore || 0) > 60 ? '#f44336' : (selectedUser.device_info?.riskScore || 0) > 30 ? '#ff9800' : '#4caf50' }}>
                                            {selectedUser.device_info?.riskScore || 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className={`security-badge ${selectedUser.device_info?.isIncognito ? 'danger' : 'success'}`}>
                                    {selectedUser.device_info?.isIncognito ? '🕵️ وضع التخفي نشط' : '✅ تصفح طبيعي'}
                                </div>
                                <div className={`security-badge ${selectedUser.device_info?.isVPN ? 'danger' : 'success'}`}>
                                    {selectedUser.device_info?.isVPN ? '🛡️ اتصال مشفر (VPN)' : '✅ اتصال مباشر'}
                                </div>
                                <div className={`security-badge ${selectedUser.device_info?.adBlock ? 'warning' : 'success'}`}>
                                    {selectedUser.device_info?.adBlock ? '🚫 حاجب إعلانات نشط' : '✅ لا يوجد حاجب'}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                                {/* 1. تفاصيل العتاد العميق */}
                                <div className="cyber-card">
                                    <div className="cyber-card-title"><Fingerprint size={18} /> الهوية الرقمية (Digital DNA)</div>
                                    <div className="cyber-list">
                                        <div className="cyber-item"><span>نظام التشغيل:</span> <strong>{selectedUser.device_info?.os}</strong></div>
                                        <div className="cyber-item"><span>المتصفح:</span> <strong>{selectedUser.device_info?.browser}</strong></div>
                                        <div className="cyber-item"><span>المعالج:</span> <strong>{selectedUser.device_info?.hardware?.cores} Logic Cores</strong></div>
                                        <div className="cyber-item"><span>الذاكرة:</span> <strong>{selectedUser.device_info?.hardware?.ram}</strong></div>
                                        <div className="cyber-item"><span>مساحة التخزين:</span> <strong>{selectedUser.device_info?.hardware?.storage}</strong></div>
                                        <div className="cyber-item"><span>الرسوميات:</span> <strong style={{ fontSize: '0.65rem', color: '#888' }}>{selectedUser.device_info?.hardware?.gpu}</strong></div>
                                        <div className="cyber-item" style={{ marginTop: '10px', background: '#000', padding: '10px', borderRadius: '10px', border: '1px solid #333' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: '4px' }}>ULTIMATE CANVAS SIGNATURE:</div>
                                            <div style={{ fontSize: '0.55rem', color: 'var(--accent)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{selectedUser.device_info?.canvasID || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. بيانات الشبكة والأمان */}
                                <div className="cyber-card">
                                    <div className="cyber-card-title"><Activity size={18} /> ذكاء الاتصال (Connection Intel)</div>
                                    <div className="cyber-list">
                                        <div className="cyber-item"><span>عنوان IP:</span> <strong dir="ltr" style={{ color: 'var(--accent)' }}>{selectedUser.device_info?.ip}</strong></div>
                                        <div className="cyber-item"><span>المزود (ISP):</span> <strong style={{ fontSize: '0.75rem' }}>{selectedUser.device_info?.isp}</strong></div>
                                        <div className="cyber-item"><span>سرعة النت:</span> <strong>{selectedUser.device_info?.network?.downlink}</strong></div>
                                        <div className="cyber-item"><span>تأخير الاستجابة:</span> <strong>{selectedUser.device_info?.network?.rtt}</strong></div>
                                        <div className="cyber-item"><span>دقة الشاشة:</span> <strong>{selectedUser.device_info?.screen?.res}</strong></div>
                                        <div className="cyber-item"><span>البطارية:</span> <strong style={{ color: 'var(--success)' }}>{selectedUser.device_info?.battery}</strong></div>
                                        <div className="cyber-item"><span>الحالة الآن:</span>
                                            {(() => {
                                                const isOnline = selectedUser.last_login && (Date.now() - new Date(selectedUser.last_login).getTime() < 300000);
                                                return (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOnline ? 'var(--success)' : '#666', fontWeight: 800 }}>
                                                        <span className={isOnline ? 'online-pulse' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? 'var(--success)' : '#444' }}></span>
                                                        {isOnline ? 'نشط حالياً' : 'غير متصل'}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. الموقع الجغرافي */}
                                <div className="cyber-card">
                                    <div className="cyber-card-title"><Globe size={18} /> الاستهداف الجغرافي (Geo-Spatial)</div>
                                    <div className="cyber-list">
                                        <div className="cyber-item">
                                            <span>الدولة:</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {selectedUser.last_location?.country_code && (
                                                    <img src={`https://flagcdn.com/24x18/${selectedUser.last_location.country_code.toLowerCase()}.png`} alt="" style={{ borderRadius: '2px' }} />
                                                )}
                                                <strong>{selectedUser.last_location?.country}</strong>
                                            </span>
                                        </div>
                                        <div className="cyber-item"><span>المدينة:</span> <strong>{selectedUser.last_location?.city}</strong></div>
                                        <div className="cyber-item"><span>المنطقة الزمنية:</span> <strong>{selectedUser.device_info?.timezone}</strong></div>
                                        <div className="cyber-item"><span>الحالة الآن:</span>
                                            {(() => {
                                                const isOnline = selectedUser.last_login && (Date.now() - new Date(selectedUser.last_login).getTime() < 300000);
                                                return (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOnline ? 'var(--success)' : '#666', fontWeight: 800 }}>
                                                        <span className={isOnline ? 'online-pulse' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? 'var(--success)' : '#444' }}></span>
                                                        {isOnline ? 'نشط الآن' : 'غير متصل'}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div style={{ marginTop: '15px' }}>
                                            <a href={`https://www.google.com/maps?q=${selectedUser.last_location?.lat},${selectedUser.last_location?.lng}`}
                                                target="_blank" rel="noreferrer" className="cyber-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <MapPin size={16} /> فتح الرادار الجغرافي
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', padding: '12px', background: '#000', borderRadius: '10px', border: '1px solid #1a1a2e' }}>
                                <div style={{ fontSize: '0.7rem', color: '#555', marginBottom: '5px' }}>FULL USER AGENT STRING:</div>
                                <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedUser.device_info?.agent}</div>
                            </div>
                        </div>

                        <style>{`
                            .cyber-modal { font-family: 'Segoe UI', sans-serif; border-radius: 20px; overflow: hidden; }
                            .radar-box { position: relative; width: 44px; height: 44px; background: rgba(200, 134, 10, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(200, 134, 10, 0.3); }
                            .radar-ping { position: absolute; width: 100%; height: 100%; border: 2px solid var(--accent); border-radius: 50%; animation: ping 2s infinite; }
                            @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                            .stat-pill { background: #0c0c11; border: 1px solid #1a1a2e; padding: 10px 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 5px; }
                            .stat-pill label { font-size: 0.7rem; color: #666; font-weight: 700; text-transform: uppercase; }
                            .risk-gauge { width: 100px; height: 6px; background: #1a1a24; border-radius: 3px; overflow: hidden; }
                            .risk-fill { height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
                            .security-badge { padding: 8px 16px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; }
                            .security-badge.success { background: rgba(76, 175, 80, 0.1); color: #4caf50; border-color: rgba(76, 175, 80, 0.2); }
                            .security-badge.danger { background: rgba(244, 67, 54, 0.1); color: #f44336; border-color: rgba(244, 67, 54, 0.2); animation: flash-danger 1.5s infinite; }
                            .security-badge.warning { background: rgba(255, 152, 0, 0.1); color: #ff9800; border-color: rgba(255, 152, 0, 0.2); }
                            @keyframes flash-danger { 50% { opacity: 0.6; box-shadow: 0 0 15px rgba(244, 67, 54, 0.3); } }
                            .security-badge.info { background: rgba(33, 150, 243, 0.1); color: #2196f3; border-color: rgba(33, 150, 243, 0.2); }
                            .cyber-card { background: #0c0c11; border: 1px solid #1a1a2e; border-radius: 20px; padding: 22px; transition: all 0.3s; }
                            .cyber-card-title { color: var(--accent); font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1.5px; }
                            .cyber-list { display: flex; flex-direction: column; gap: 12px; }
                            .cyber-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; border-bottom: 1px solid #161625; padding-bottom: 10px; }
                            .cyber-item span { color: #666; font-weight: 600; }
                            .cyber-item strong { color: #eee; }
                            .cyber-btn { background: var(--gradient); color: #000; border: none; border-radius: 12px; padding: 14px; font-weight: 800; transition: all 0.3s; width: 100%; cursor: pointer; }
                            .cyber-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(200,134,10,0.3); }
                            .online-pulse { animation: pulse-green 2s infinite; }
                            @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); } }
                        `}</style>
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
