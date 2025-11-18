'use client';

import { useState, useCallback } from 'react';
import type { ToastType } from '@/components/ui/Toast';

interface ToastState {
  message: string;
  type: ToastType;
  show: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    show: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, show: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
