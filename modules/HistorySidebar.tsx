import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Plus, MoreVertical, Trash2, Eye, Settings, Trash } from 'lucide-react';
import { listHistorySessions, deleteHistorySession } from '@/apiRequests/history';
import { HistorySessionSummary } from '@/types/history';

interface HistorySidebarProps {
    selectedSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    reloadToken: number;
    onCountChange?: (count: number) => void;
}

const COLORS = {
    accent: '#3b82f6',
    accentSoft: '#eff6ff',
    border: '#e5e7eb',
    textMuted: '#6b7280',
    danger: '#ef4444',
};

const HistorySidebar: React.FC<HistorySidebarProps> = ({
    selectedSessionId,
    onSelectSession,
    onNewChat,
    reloadToken,
    onCountChange,
}) => {
    const [sessions, setSessions] = useState<HistorySessionSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [menuFor, setMenuFor] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<HistorySessionSummary | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        const data = await listHistorySessions();
        setSessions(data);
        setLoading(false);
        onCountChange?.(data.length);
    }, [onCountChange]);

    useEffect(() => {
        load();
    }, [load, reloadToken]);

    // Close the ⋮ menu when clicking outside it.
    useEffect(() => {
        if (!menuFor) return;
        const onDocClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuFor(null);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [menuFor]);

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        const ok = await deleteHistorySession(pendingDelete.sessionId);
        setDeleting(false);
        if (ok) {
            setSessions((prev) => {
                const next = prev.filter((s) => s.sessionId !== pendingDelete.sessionId);
                onCountChange?.(next.length);
                return next;
            });
            if (selectedSessionId === pendingDelete.sessionId) {
                onNewChat(); // deleted the session we were viewing → back to live chat
            }
        }
        setPendingDelete(null);
    };

    return (
        <div
            style={{
                width: 260,
                height: '100%',
                background: '#ffffff',
                borderRight: `1px solid ${COLORS.border}`,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 260,
            }}
        >
            {/* New chat */}
            <div style={{ padding: 16 }}>
                <button
                    onClick={onNewChat}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        background: '#ffffff',
                        color: COLORS.accent,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    <Plus size={18} />
                    New chat
                </button>
            </div>

            {/* History label */}
            <div
                style={{
                    padding: '0 16px 8px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#111827',
                }}
            >
                History
            </div>

            {/* List / empty state */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                {loading ? null : sessions.length === 0 ? (
                    <EmptyState />
                ) : (
                    sessions.map((s) => {
                        const isActive = s.sessionId === selectedSessionId;
                        const label = s.firstQuestion || 'Untitled query';
                        return (
                            <div
                                key={s.sessionId}
                                onClick={() => onSelectSession(s.sessionId)}
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 10px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background: isActive ? COLORS.accentSoft : 'transparent',
                                    borderLeft: isActive
                                        ? `3px solid ${COLORS.accent}`
                                        : '3px solid transparent',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.background = '#f9fafb';
                                    const btn = e.currentTarget.querySelector<HTMLElement>('[data-menu-btn]');
                                    if (btn) btn.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.background = 'transparent';
                                    if (menuFor !== s.sessionId) {
                                        const btn = e.currentTarget.querySelector<HTMLElement>('[data-menu-btn]');
                                        if (btn) btn.style.opacity = '0';
                                    }
                                }}
                            >
                                <MessageSquare size={16} color={COLORS.textMuted} style={{ flexShrink: 0 }} />
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: 14,
                                        color: '#374151',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {label}
                                </span>

                                <button
                                    data-menu-btn
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuFor((cur) => (cur === s.sessionId ? null : s.sessionId));
                                    }}
                                    style={{
                                        opacity: menuFor === s.sessionId ? 1 : 0,
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        padding: 2,
                                        display: 'flex',
                                        color: COLORS.textMuted,
                                    }}
                                >
                                    <MoreVertical size={16} />
                                </button>

                                {menuFor === s.sessionId && (
                                    <div
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 8,
                                            zIndex: 50,
                                            background: '#fff',
                                            border: `1px solid ${COLORS.border}`,
                                            borderRadius: 10,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                                            padding: '4px 0',
                                            minWidth: 130,
                                        }}
                                    >
                                        <MenuItem
                                            icon={<Trash2 size={15} />}
                                            label="Delete"
                                            danger
                                            onClick={() => {
                                                setMenuFor(null);
                                                setPendingDelete(s);
                                            }}
                                        />
                                        <MenuItem
                                            icon={<Eye size={15} />}
                                            label="View"
                                            onClick={() => {
                                                setMenuFor(null);
                                                onSelectSession(s.sessionId);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Settings (pinned) */}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '12px 16px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: COLORS.textMuted,
                        fontSize: 14,
                    }}
                >
                    <Settings size={18} />
                    Settings
                </div>
            </div>

            {pendingDelete && (
                <DeleteDialog
                    deleting={deleting}
                    onCancel={() => setPendingDelete(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
};

const EmptyState: React.FC = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 16px',
            gap: 12,
        }}
    >
        <div
            style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <MessageSquare size={28} color={COLORS.textMuted} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>No recent sessions</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>
            Your recent queries will appear here.
        </div>
    </div>
);

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, danger }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '9px 14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
            textAlign: 'left',
            color: danger ? COLORS.danger : '#374151',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
        {icon}
        {label}
    </button>
);

interface DeleteDialogProps {
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ deleting, onCancel, onConfirm }) => (
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
                    background: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                }}
            >
                <Trash size={24} color={COLORS.danger} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Delete this chat?
            </div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24 }}>
                This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={onCancel}
                    disabled={deleting}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        background: '#f9fafb',
                        color: '#374151',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: deleting ? 'default' : 'pointer',
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={deleting}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        border: 'none',
                        borderRadius: 8,
                        background: COLORS.danger,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: deleting ? 'default' : 'pointer',
                        opacity: deleting ? 0.7 : 1,
                    }}
                >
                    {deleting ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

export default HistorySidebar;
