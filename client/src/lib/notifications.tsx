import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type NotificationType = "success" | "warning" | "error" | "payment" | "homework" | "session" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  time: Date;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "time" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "app_notifications";

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((n: any) => ({ ...n, time: new Date(n.time) }));
  } catch { return []; }
}

function saveToStorage(notifications: AppNotification[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50))); } catch {}
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadFromStorage);

  useEffect(() => { saveToStorage(notifications); }, [notifications]);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "time" | "read">) => {
    const newN: AppNotification = { ...n, id: Math.random().toString(36).slice(2), time: new Date(), read: false };
    setNotifications(prev => [newN, ...prev].slice(0, 50));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => { setNotifications([]); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
