import React from 'react';
import { MessageSquare } from 'lucide-react';

const TEXT_MUTED = '#6b7280';

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
            <MessageSquare size={28} color={TEXT_MUTED} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>No recent sessions</div>
        <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
            Your recent queries will appear here.
        </div>
    </div>
);

export default EmptyState;
