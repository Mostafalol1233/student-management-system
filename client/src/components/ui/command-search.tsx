import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Users, LayoutDashboard, Star, BookOpen, DollarSign, TrendingUp, QrCode, CalendarPlus, BarChart3, MessageCircle, Settings } from "lucide-react";
import type { Student, Group } from "@shared/schema";

const SECTIONS = [
  { id: "overview", label: "لوحة التحكم", labelEn: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "student-registration", label: "تسجيل الطلاب", labelEn: "Students", icon: User, path: "/students" },
  { id: "group-management", label: "المجموعات", labelEn: "Groups", icon: Users, path: "/groups" },
  { id: "session-management", label: "إدارة الحصص", labelEn: "Sessions", icon: CalendarPlus, path: "/sessions" },
  { id: "attendance-scanning", label: "تسجيل الحضور", labelEn: "Attendance", icon: QrCode, path: "/attendance" },
  { id: "grade-entry", label: "إدخال الدرجات", labelEn: "Grades", icon: Star, path: "/grades" },
  { id: "homework-management", label: "الواجبات", labelEn: "Homework", icon: BookOpen, path: "/homework" },
  { id: "exam-builder", label: "الامتحانات", labelEn: "Exams", icon: BarChart3, path: "/exams" },
  { id: "finance-management", label: "النظام المالي", labelEn: "Finance", icon: DollarSign, path: "/finance" },
  { id: "analytics", label: "التحليل الذكي", labelEn: "Analytics", icon: TrendingUp, path: "/analytics" },
  { id: "reports", label: "التقارير", labelEn: "Reports", icon: BarChart3, path: "/reports" },
  { id: "timetable", label: "الجدول الدراسي", labelEn: "Timetable", icon: CalendarPlus, path: "/timetable" },
  { id: "settings", label: "الإعدادات", labelEn: "Settings", icon: Settings, path: "/settings" },
  { id: "whatsapp-management", label: "واتساب", labelEn: "WhatsApp", icon: MessageCircle, path: "/whatsapp" },
];

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });

  const lq = query.toLowerCase();
  const filteredStudents = lq.length > 0
    ? students.filter(s => s.name.toLowerCase().includes(lq) || s.code.includes(lq) || s.guardianPhone.includes(lq)).slice(0, 6)
    : [];
  const filteredSections = SECTIONS.filter(s => lq.length === 0 || s.label.includes(lq) || s.labelEn.toLowerCase().includes(lq)).slice(0, 5);

  const navigate = useCallback((path: string) => {
    setLocation(path);
    onClose();
    setQuery("");
  }, [setLocation, onClose]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="p-0 max-w-lg overflow-hidden" data-testid="command-search-modal">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث عن طالب أو قسم... (Ctrl+K)"
            className="border-0 p-0 h-auto text-base focus-visible:ring-0 bg-transparent"
            data-testid="input-command-search"
          />
          <kbd className="hidden sm:flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {/* Students */}
          {filteredStudents.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">الطلاب</div>
              {filteredStudents.map(s => (
                <button key={s.id} onClick={() => navigate(`/student/${s.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  data-testid={`cmd-student-${s.id}`}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.gradeLevel} · {s.guardianPhone}</div>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono flex-shrink-0">{s.code}</Badge>
                </button>
              ))}
            </div>
          )}

          {/* Sections */}
          <div className="p-2 border-t">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">الأقسام</div>
            {filteredSections.map(section => {
              const Icon = section.icon;
              return (
                <button key={section.id} onClick={() => navigate(section.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  data-testid={`cmd-section-${section.id}`}>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{section.label}</div>
                    <div className="text-xs text-muted-foreground">{section.labelEn}</div>
                  </div>
                  <kbd className="hidden sm:flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground">↵</kbd>
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {query.length > 2 && filteredStudents.length === 0 && filteredSections.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Search size={24} className="mx-auto mb-2 opacity-30" />
              <p>لا توجد نتائج لـ "{query}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
