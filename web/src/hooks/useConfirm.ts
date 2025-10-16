'use client';

import { create } from 'zustand';

interface ConfirmDialog {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant: 'danger' | 'warning' | 'info';
}

interface ConfirmStore {
    dialog: ConfirmDialog | null;
    confirm: (options: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        variant?: 'danger' | 'warning' | 'info';
    }) => Promise<boolean>;
    close: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
    dialog: null,
    confirm: (options) => {
        return new Promise<boolean>((resolve) => {
            set({
                dialog: {
                    isOpen: true,
                    title: options.title,
                    message: options.message,
                    confirmText: options.confirmText || 'Confirm',
                    cancelText: options.cancelText || 'Cancel',
                    variant: options.variant || 'warning',
                    onConfirm: () => {
                        set({ dialog: null });
                        resolve(true);
                    },
                    onCancel: () => {
                        set({ dialog: null });
                        resolve(false);
                    },
                },
            });
        });
    },
    close: () => set({ dialog: null }),
}));

export const useConfirm = () => {
    const confirm = useConfirmStore((state) => state.confirm);
    return confirm;
};
