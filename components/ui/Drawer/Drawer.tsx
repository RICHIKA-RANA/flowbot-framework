import React, { useCallback, useRef, useState } from 'react';
import { DrawerProps } from '@/types/ui';
import { cn } from '@/utils/cn';

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
      style={{ width: resizable ? dragWidth : width }}
      className={cn(
        'relative flex h-full max-w-[92vw] shrink-0 flex-col',
        !className && 'border-l border-gray-200 bg-white',
        className,
      )}
    >
      {resizable && (
        <div
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          className="absolute -left-[3px] top-0 h-full w-1.5 cursor-col-resize"
        />
      )}

      {title && (
        <div className="border-b border-gray-200 px-[18px] pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-[0.04em] text-gray-500">
              {title}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 text-base leading-none text-gray-500"
            >
              ✕
            </button>
          </div>
          {subtitle && (
            <p className="mb-0 mt-1.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">{children}</div>

      {footer && (
        <div className="border-t border-gray-200 p-[14px]">{footer}</div>
      )}
    </div>
  );
};

export default Drawer;
