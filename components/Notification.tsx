"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  confirmAction: (options: { title: string; message: string; onConfirm: () => void; confirmText?: string; cancelText?: string }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<{ title: string; message: string; onConfirm: () => void; confirmText?: string; cancelText?: string } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const confirmAction = useCallback((options: { title: string; message: string; onConfirm: () => void; confirmText?: string; cancelText?: string }) => {
    setConfirmOptions(options);
  }, []);

  const handleConfirm = () => {
    if (confirmOptions) {
      confirmOptions.onConfirm();
      setConfirmOptions(null);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, confirmAction }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[90vw] sm:max-w-md w-full">
        {notifications.map((n) => (
          <NotificationItem 
            key={n.id} 
            notification={n} 
            onClose={() => removeNotification(n.id)} 
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmOptions && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">
                {confirmOptions.title}
              </h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {confirmOptions.message}
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setConfirmOptions(null)}
                className="flex-1 py-5 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors border-r border-gray-100"
              >
                {confirmOptions.cancelText || "Batal"}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {confirmOptions.confirmText || "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

const NotificationItem: React.FC<{ 
  notification: Notification; 
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const { type, message } = notification;

  const styles = {
    success: {
      bg: "bg-white/80 border-green-100",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      accent: "bg-green-500",
      text: "text-gray-900"
    },
    error: {
      bg: "bg-white/80 border-red-100",
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      accent: "bg-red-500",
      text: "text-gray-900"
    },
    warning: {
      bg: "bg-white/80 border-amber-100",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      accent: "bg-amber-500",
      text: "text-gray-900"
    },
    info: {
      bg: "bg-white/80 border-indigo-100",
      icon: <Info className="w-5 h-5 text-indigo-500" />,
      accent: "bg-indigo-500",
      text: "text-gray-900"
    }
  }[type];

  return (
    <div 
      className={`pointer-events-auto flex items-stretch overflow-hidden rounded-2xl border ${styles.bg} shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-8 duration-500`}
      role="alert"
    >
      <div className={`w-1.5 ${styles.accent}`} />
      <div className="flex flex-1 items-center gap-4 px-4 py-4">
        <div className="flex-shrink-0">{styles.icon}</div>
        <p className={`flex-1 text-sm font-semibold leading-relaxed ${styles.text}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
