import React from 'react';
import { Trash } from 'lucide-react';
import { ConfirmDialogProps } from '@/types/ui';

// Generic confirmation modal (icon + title + message + cancel/confirm).
// Reusable for any "are you sure?" action; pass `danger` for destructive ones.
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel = 'Confirm',
    danger,
    loading,
    error,
    onCancel,
    onConfirm,
}) => (
    <div
        onClick={onCancel}
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,24,39,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}
    >
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                width: 340,
                background: '#fff',
                borderRadius: 16,
                padding: '28px 24px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
        >
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: danger ? '#fef2f2' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                }}
            >
                <Trash size={24} color={danger ? '#ef4444' : '#3b82f6'} />
            </div>
            <div
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 6,
                }}
            >
                {title}
            </div>
            {message && (
                <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
                    {message}
                </div>
            )}
            {error && (
                <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
                    {error}
                </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: '#f9fafb',
                        color: '#374151',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: loading ? 'default' : 'pointer',
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        border: 'none',
                        borderRadius: 8,
                        background: danger ? '#ef4444' : '#3b82f6',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: loading ? 'default' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? `${confirmLabel}…` : confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmDialog;
