import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

let addToastFn: ((message: string, type?: ToastItem['type']) => void) | null = null;

export function showToast(message: string, type: ToastItem['type'] = 'success') {
    if (addToastFn) {
        addToastFn(message, type);
    }
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    useEffect(() => {
        addToastFn = addToast;
        return () => { addToastFn = null; };
    }, [addToast]);

    const icons: Record<string, string> = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast ${toast.type}`}>
                    <span className="toast-icon">{icons[toast.type]}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
                </div>
            ))}
        </div>
    );
}
