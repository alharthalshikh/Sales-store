import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';

export default function MessagesPage() {
    const { state, dispatch } = useStore();
    const { user, userData } = useAuth();
    const s = state.settings;
    const [newMessage, setNewMessage] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [started, setStarted] = useState(false);

    // تحميل بيانات المرسل السابقة أو استخدام بيانات المستخدم المسجل
    useEffect(() => {
        if (user && userData) {
            setSenderName(userData.name || user.displayName || user.email || '');
            setSenderPhone(userData.phone || '');
            setStarted(true);
        } else if (user) {
            setSenderName(user.displayName || user.email || '');
            setStarted(true);
        } else {
            const savedName = localStorage.getItem('chat-sender-name');
            const savedPhone = localStorage.getItem('chat-sender-phone');
            if (savedName) {
                setSenderName(savedName);
                setSenderPhone(savedPhone || '');
                setStarted(true);
            }
        }
    }, [user, userData]);

    const handleStart = () => {
        if (senderName.trim()) {
            localStorage.setItem('chat-sender-name', senderName);
            localStorage.setItem('chat-sender-phone', senderPhone);
            setStarted(true);
        }
    };

    const handleSend = () => {
        if (!newMessage.trim() || !senderName.trim()) return;
        dispatch({
            type: 'ADD_MESSAGE',
            message: {
                id: `MSG-${Date.now()}`,
                userId: user?.uid,
                senderName,
                senderPhone,
                content: newMessage,
                isFromAdmin: false,
                createdAt: Date.now(),
                read: false,
                status: 'unread'
            },
        });
        setNewMessage('');
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // فلترة الرسائل للحصول على المحادثة الخاصة بهذا المستخدم فقط
    const userMessages = state.messages
        .filter(m => {
            if (user) return m.userId === user.uid || (m.senderPhone === userData?.phone && !m.userId);
            return m.senderPhone === senderPhone || m.senderName === senderName;
        })
        .sort((a, b) => a.createdAt - b.createdAt);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (started) {
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                return;
            }
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [started, userMessages.length]);

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
                <div className="section-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div className="section-badge">💬 تواصل معنا</div>
                        <h2>المحادثات</h2>
                        <p>أرسل لنا استفسارك وسنرد عليك في أقرب وقت</p>
                    </div>
                    {started && (
                        <button
                            className="btn btn-secondary btn-small"
                            onClick={() => {
                                if (confirm('هل أنت متأكد من بدء محادثة جديدة؟ سيتم مسح الرسائل السابقة')) {
                                    dispatch({ type: 'CLEAR_USER_MESSAGES', userId: user?.uid, phone: senderPhone });
                                    if (!user) {
                                        localStorage.removeItem('chat-sender-name');
                                        localStorage.removeItem('chat-sender-phone');
                                        setSenderName('');
                                        setSenderPhone('');
                                        setStarted(false);
                                    }
                                }
                            }}
                        >
                            🗑️ بدء محادثة جديدة
                        </button>
                    )}
                </div>

                <div className="chat-container">
                    {!started ? (
                        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '32px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>👋 أهلاً بك</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>أدخل بياناتك للبدء في المحادثة</p>
                            <div className="form-group"><input type="text" placeholder="اسمك *" value={senderName} onChange={e => setSenderName(e.target.value)} /></div>
                            <div className="form-group"><input type="tel" placeholder="رقم هاتفك" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} dir="ltr" /></div>
                            <button className="btn btn-primary" onClick={handleStart} disabled={!senderName.trim()}>ابدأ المحادثة</button>
                        </div>
                    ) : (
                        <>
                            <div className="chat-messages">
                                {userMessages.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                                        <h3>لا توجد رسائل بعد</h3>
                                        <p>ابدأ محادثة معنا الآن!</p>
                                    </div>
                                ) : (
                                    userMessages.map(msg => (
                                        <div key={msg.id} className={`chat-message ${msg.isFromAdmin ? 'admin' : ''}`}>
                                            <div className="chat-avatar">{msg.isFromAdmin ? '🏪' : '👤'}</div>
                                            <div className="chat-bubble">
                                                <div className="chat-bubble-sender">{msg.isFromAdmin ? s.storeName : msg.senderName}</div>
                                                <div className="chat-bubble-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                                <div className="chat-bubble-time">{formatDate(msg.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="chat-input-bar">
                                <input type="text" placeholder="اكتب رسالتك..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                                <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!newMessage.trim()} style={{ borderRadius: '50%', width: '50px', height: '50px' }}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <p style={{ color: 'var(--text-light)', marginBottom: '12px' }}>أو تواصل معنا مباشرة عبر الواتساب</p>
                        <a href={`https://wa.me/${s.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">📱 فتح واتساب</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
