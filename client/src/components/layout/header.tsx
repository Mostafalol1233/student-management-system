import { Bell, Search, X, CheckCheck, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CommandSearch, useCommandSearch } from "@/components/ui/command-search";
import { useNotifications } from "@/lib/notifications";
import { notificationTypeConfig } from "@/lib/notification-config";
import type { Student, Session } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description: string;
  titleAr?: string;
}

export default function Header({ title, description, titleAr }: HeaderProps) {
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: activeSession } = useQuery<Session | null>({ queryKey: ["/api/sessions/active"] });
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandSearch();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    return new Date(date).toLocaleDateString("ar-EG");
  };

  return (
    <>
      <header className="border-b bg-card px-6 py-3.5 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{titleAr || title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeSession && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />حصة نشطة
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <span data-testid="total-students">{students.length}</span><span>طالب</span>
          </div>

          {/* Search Ctrl+K */}
          <button onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors text-muted-foreground text-sm"
            data-testid="button-search">
            <Search size={14} />
            <span className="hidden md:inline text-xs">بحث</span>
            <kbd className="hidden md:flex h-4 items-center rounded border px-1 text-[10px]">⌘K</kbd>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setNotifOpen(v => !v); if (notifOpen) markAllRead(); }}
              className="p-2 rounded-lg hover:bg-muted transition-colors relative"
              data-testid="button-notifications">
              <Bell size={17} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full ring-2 ring-card flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">الإشعارات</h3>
                  <div className="flex gap-1">
                    {notifications.length > 0 && (
                      <>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={markAllRead}><CheckCheck size={12} /></Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-destructive" onClick={clearAll}><Trash2 size={12} /></Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      <Bell size={24} className="mx-auto mb-2 opacity-30" />لا توجد إشعارات
                    </div>
                  ) : notifications.map(n => {
                    const cfg = notificationTypeConfig[n.type];
                    return (
                      <button key={n.id} onClick={() => markRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/3" : ""}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5 flex-shrink-0">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</div>
                            {n.message && <div className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</div>}
                            <div className="text-[10px] text-muted-foreground mt-1">{formatTime(n.time)}</div>
                          </div>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center cursor-pointer flex-shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
        </div>
      </header>

      <CommandSearch open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
