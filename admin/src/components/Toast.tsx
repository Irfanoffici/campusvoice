import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'delete';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

const icons = {
    success: <CheckCircle2 size={20} color="#10b981" />,
    error: <AlertCircle size={20} color="#ef4444" />,
    warning: <AlertCircle size={20} color="#f59e0b" />,
    info: <Info size={20} color="#3b82f6" />,
    delete: <Trash2 size={20} color="#ef4444" />
};

const borderColors = {
    success: 'rgba(16, 185, 129, 0.2)',
    error: 'rgba(239, 68, 68, 0.2)',
    warning: 'rgba(245, 158, 11, 0.2)',
    info: 'rgba(59, 130, 246, 0.2)',
    delete: 'rgba(239, 68, 68, 0.2)'
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${borderColors[type]}`,
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                minWidth: '300px',
                pointerEvents: 'auto'
            }}
        >
            <div style={{
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex'
            }}>
                {icons[type]}
            </div>
            <p style={{
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 500,
                flex: 1,
                margin: 0
            }}>
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex'
                }}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastProps[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
};
