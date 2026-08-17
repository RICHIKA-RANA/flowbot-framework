import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ToggleButtonProps } from '@/types/ui';


export function ToggleButton({
  open,
  onToggle,
  label,
  icon,
}: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className={`flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 ${
        open ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      {icon}
      {label}
      {open ? (
        <ChevronUp size={16} className="text-gray-500" />
      ) : (
        <ChevronDown size={16} className="text-gray-500" />
      )}
    </button>
  );
}
