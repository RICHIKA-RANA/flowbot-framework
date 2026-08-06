import React, { useCallback, useRef, useState } from 'react';
import { DrawerProps } from '@/types/ui';

const COLORS = {
  border: '#e5e7eb',
  textMuted: '#6b7280',
};

const MIN_WIDTH = 250;
const MAX_WIDTH = 600;

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  width = 360,
  resizable,
  className,
  footer,
  children,
}) => {
  const [dragWidth, setDragWidth] = useState(width);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      const startX = e.clientX;
      const startWidth = dragWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const next = startWidth + (startX - moveEvent.clientX);
        setDragWidth(Math.min(Math.max(next, MIN_WIDTH), MAX_WIDTH));
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [dragWidth],
  );

  if (!open) return null;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: resizable ? dragWidth : width,
        maxWidth: '92vw',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...(className
          ? {}
          : { background: '#fff', borderLeft: `1px solid ${COLORS.border}` }),
      }}
    >
      {resizable && (
        <div
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          style={{
            position: 'absolute',
            top: 0,
            left: -3,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
          }}
        />
      )}

      {title && (
        <div
          style={{
            padding: '16px 18px 12px',
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.textMuted,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: COLORS.textMuted,
                fontSize: 16,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
          {subtitle && (
            <p
              style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.textMuted }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>{children}</div>

      {footer && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 14 }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Drawer;
