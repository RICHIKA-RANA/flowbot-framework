import React from 'react';
import { XCircle, Info } from 'lucide-react';
import { ErrorAlertProps } from '@/types/ui';

// Alert / banner. Defaults to the error variant (back-compatible with existing
// callers that pass only `message`); pass variant="info" + title for notices.
const VARIANTS = {
    error: { bg: '#fff5f5', border: '#fecaca', text: '#b91c1c', titleColor: '#b91c1c', icon: <XCircle size={18} color="#ef4444" /> },
    info: { bg: '#eff6ff', border: '#dbeafe', text: '#6b7280', titleColor: '#111827', icon: <Info size={18} color="#3b82f6" /> },
} as const;

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, title, variant = 'error', style }) => {
    const v = VARIANTS[variant];
    return (
        <div
            style={{
                width: '100%',
                backgroundColor: v.bg,
                border: `1px solid ${v.border}`,
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                ...style,
            }}
        >
            <span style={{ flexShrink: 0, marginTop: '1px', display: 'flex' }}>{v.icon}</span>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                {title && <strong style={{ color: v.titleColor }}>{title}</strong>}
                {message && <div style={{ margin: 0, marginTop: title ? 4 : 0, color: v.text }}>{message}</div>}
            </div>
        </div>
    );
};

export default ErrorAlert;
