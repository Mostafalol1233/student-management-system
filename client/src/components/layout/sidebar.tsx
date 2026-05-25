import { useState } from "react";
import { GraduationCap, UserPlus, CalendarPlus, QrCode, Star, BarChart3, MessageCircle, LayoutDashboard, Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { ActiveSection } from "@/pages/dashboard";

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const menuItems = [
  { id: "overview" as ActiveSection, icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard" },
  { id: "student-registration" as ActiveSection, icon: UserPlus, label: "تسجيل الطلاب", labelEn: "Students" },
  { id: "session-management" as ActiveSection, icon: CalendarPlus, label: "إدارة الحصص", labelEn: "Sessions" },
  { id: "attendance-scanning" as ActiveSection, icon: QrCode, label: "تسجيل الحضور", labelEn: "Attendance" },
  { id: "grade-entry" as ActiveSection, icon: Star, label: "إدخال الدرجات", labelEn: "Grades" },
  { id: "reports" as ActiveSection, icon: BarChart3, label: "التقارير", labelEn: "Reports" },
  { id: "whatsapp-management" as ActiveSection, icon: MessageCircle, label: "واتساب", labelEn: "WhatsApp" },
];

export default function Sidebar({ activeSection, onSectionChange, darkMode, onToggleDark }: SidebarProps) {
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const paths: Record<ActiveSection, string> = {
    "overview": "/",
    "student-registration": "/students",
    "session-management": "/session-management",
    "attendance-scanning": "/attendance-scanning",
    "grade-entry": "/grade-entry",
    "reports": "/reports",
    "whatsapp-management": "/whatsapp-management",
  };

  return (
    <div
      className={`flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">نظام المدرسة</div>
              <div className="text-xs" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>Student System</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto">
            <GraduationCap size={16} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "hsl(var(--sidebar-foreground))" }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 mx-auto mt-2 rounded-md opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => {
                setLocation(paths[item.id]);
                onSectionChange(item.id);
              }}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item w-full ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div className="text-xs opacity-50 truncate">{item.labelEn}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t space-y-2" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <button
          onClick={onToggleDark}
          className={`sidebar-nav-item w-full ${collapsed ? "justify-center px-2" : ""}`}
          data-testid="button-toggle-dark"
          title={darkMode ? "وضع النهار" : "الوضع الليلي"}
        >
          {darkMode ? <Sun size={16} className="flex-shrink-0" /> : <Moon size={16} className="flex-shrink-0" />}
          {!collapsed && <span className="text-xs">{darkMode ? "وضع النهار" : "الوضع الليلي"}</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "hsl(var(--sidebar-accent))" }}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">المدير</div>
              <div className="text-xs truncate" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>admin@school.edu</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
