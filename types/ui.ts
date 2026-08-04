import React from 'react';

export type AlertVariant = 'error' | 'info';

export interface ErrorAlertProps {
  message?: React.ReactNode;
  title?: string;
  variant?: AlertVariant;
  style?: React.CSSProperties;
}

export interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export type DocumentFileError = 'unauthorized' | 'missing' | 'error';

export interface PdfViewerProps {
  fileUrl: string;
  fileError?: DocumentFileError;
  pageNumber: number;
  highlight?: string;
  fileName?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
}
