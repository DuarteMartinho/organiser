'use client';

import { useConfirmStore } from '@/hooks/useConfirm';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

const variantStyles = {
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

const variantIcons = {
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ConfirmDialog() {
  const dialog = useConfirmStore((state) => state.dialog);
  const close = useConfirmStore((state) => state.close);

  if (!dialog || !dialog.isOpen) return null;

  const styles = variantStyles[dialog.variant];
  const Icon = variantIcons[dialog.variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60] animate-fade-in"
        onClick={dialog.onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slide-up">
          <div className="p-6">
            {/* Header with Icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {dialog.title}
                </h3>
                <p className="text-sm text-gray-600">{dialog.message}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={dialog.onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                {dialog.cancelText}
              </button>
              <button
                onClick={dialog.onConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${styles.button}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
