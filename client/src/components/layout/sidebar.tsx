import { useState } from "react";
import { GraduationCap, UserPlus, CalendarPlus, QrCode, Star, BarChart3, MessageCircle, LayoutDashboard, Moon, Sun, ChevronLeft, ChevronRight, Users, BookOpen, DollarSign, TrendingUp, Calendar, ClipboardList, Settings } from "lucide-react";
import { useLocation } from "wouter";
import type { ActiveSection } from "@/pages/dashboard";

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const menuGroups = [
  {
    label: "الرئيسية",
    items: [
      { id: "overview" as ActiveSection, icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard" },
    ]
  },
  {
    label: "الطلاب",
    items: [
      { id: "student-registration" as ActiveSection, icon: UserPlus, label: "تسجيل الطلاب", labelEn: "Students" },
      { id: "group-management" as ActiveSection, icon: Users, label: "المجموعات", labelEn: "Groups" },
    ]
  },
  {
    label: "الحصص",
    items: [
      { id: "session-management" as ActiveSection, icon: CalendarPlus, label: "إدارة الحصص", labelEn: "Sessions" },
      { id: "timetable" as ActiveSection, icon: Calendar, label: "الجدول الدراسي", labelEn: "Timetable" },
      { id: "attendance-scanning" as ActiveSection, icon: QrCode, label: "تسجيل الحضور", labelEn: "Attendance" },
    ]
  },
  {
    label: "التقييم",
    items: [
      { id: "grade-entry" as ActiveSection, icon: Star, label: "إدخال الدرجات", labelEn: "Grades" },
      { id: "exam-builder" as ActiveSection, icon: ClipboardList, label: "الامتحانات", labelEn: "Exams" },
      { id: "homework-management" as ActiveSection, icon: BookOpen, label: "الواجبات", labelEn: "Homework" },
    ]
  },
  {
    label: "الإدارة",
    items: [
      { id: "finance-management" as ActiveSection, icon: DollarSign, label: "النظام المالي", labelEn: "Finance" },
      { id: "analytics" as ActiveSection, icon: TrendingUp, label: "التحليل الذكي", labelEn: "Analytics" },
      { id: "reports" as ActiveSection, icon: BarChart3, label: "التقارير", labelEn: "Reports" },
      { id: "whatsapp-management" as ActiveSection, icon: MessageCircle, label: "واتساب", labelEn: "WhatsApp" },
      { id: "settings" as ActiveSection, icon: Settings, label: "الإعدادات", labelEn: "Settings" },
    ]
  }
];

const paths: Record<ActiveSection, string> = {
  "overview": "/", "student-registration": "/students", "group-management": "/groups",
  "session-management": "/sessions", "timetable": "/timetable", "attendance-scanning": "/attendance",
  "grade-entry": "/grades", "exam-builder": "/exams", "homework-management": "/homework",
  "finance-management": "/finance", "analytics": "/analytics", "reports": "/reports",
  "whatsapp-management": "/whatsapp", "settings": "/settings",
};

export default function Sidebar({ activeSection, onSectionChange, darkMode, onToggleDark }: SidebarProps) {
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? "w-14" : "w-56"}`}
      style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">نظام المدرسة</div>
              <div className="text-[10px]" style={{ color: "hsl(var(--sidebar-foreground) / 0.4)" }}>Student System</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center mx-auto">
            <GraduationCap size={15} className="text-primary" />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="p-1 rounded opacity-40 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--sidebar-foreground))" }}>
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="p-2 mx-auto mt-2 rounded opacity-40 hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--sidebar-foreground))" }}>
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {menuGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--sidebar-foreground) / 0.3)" }}>
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button key={item.id} data-testid={`nav-${item.id}`}
                    onClick={() => { setLocation(paths[item.id]); onSectionChange(item.id); }}
                    title={collapsed ? item.label : undefined}
                    className={`sidebar-nav-item w-full ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}>
                    <Icon size={15} className="flex-shrink-0" />
                    {!collapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="truncate text-sm leading-tight">{item.label}</div>
                        <div className="text-[9px] opacity-35 truncate">{item.labelEn}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t space-y-1 flex-shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <button onClick={onToggleDark}
          className={`sidebar-nav-item w-full ${collapsed ? "justify-center px-2" : ""}`}
          data-testid="button-toggle-dark" title={darkMode ? "وضع النهار" : "الوضع الليلي"}>
          {darkMode ? <Sun size={14} className="flex-shrink-0" /> : <Moon size={14} className="flex-shrink-0" />}
          {!collapsed && <span className="text-xs">{darkMode ? "وضع النهار" : "الوضع الليلي"}</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-md" style={{ background: "hsl(var(--sidebar-accent))" }}>
            <div className="w-6 h-6 rounded-full bg-muted/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">م</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">المدير</div>
              <div className="text-[9px] truncate" style={{ color: "hsl(var(--sidebar-foreground) / 0.4)" }}>admin@school.edu</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
