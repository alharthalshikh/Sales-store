import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={onCancel}>
            <div
                className={`modal confirm-modal ${type}`}
                onClick={e => e.stopPropagation()}
                style={{
                    width: '95%',
                    maxWidth: '400px',
                    padding: '24px',
                    textAlign: 'center',
                    borderRadius: '24px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <button className="pwa-close-btn" onClick={onCancel} style={{ top: '16px', right: '16px' }}>
                    <X size={20} />
                </button>

                <div style={{
                    width: '64px',
                    height: '64px',
                    background: type === 'danger' ? 'rgba(244,67,54,0.1)' : 'rgba(255,152,0,0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: type === 'danger' ? '#f44336' : '#FF9800'
                }}>
                    <AlertTriangle size={32} />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{title}</h3>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    marginBottom: '24px',
                    whiteSpace: 'pre-line',
                    textAlign: 'right'
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                        onClick={() => { onConfirm(); onCancel(); }}
                    >
                        {confirmText}
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>

            <style>{`
                .confirm-modal {
                    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes modalPop {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
