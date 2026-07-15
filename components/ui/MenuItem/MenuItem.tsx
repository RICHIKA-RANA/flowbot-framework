import React from 'react';

export interface MenuItemProps {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

// Generic icon + label action row for dropdown/context menus.
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
            color: danger ? '#ef4444' : '#374151',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
        {icon}
        {label}
    </button>
);

export default MenuItem;
