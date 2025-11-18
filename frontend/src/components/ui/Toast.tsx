'use client';

import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-400" />;
      case 'info':
        return <FiInfo className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${getBgColor()} min-w-[300px] max-w-md`}>
        {getIcon()}
        <p className={`flex-1 text-sm font-medium ${getTextColor()}`}>{message}</p>
        <button
          onClick={onClose}
          className={`${getTextColor()} hover:opacity-70 transition-opacity`}
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
