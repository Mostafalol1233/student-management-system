import { useRef } from "react";
import { GraduationCap, UserPlus, CalendarPlus, QrCode, Star, BarChart3, MessageCircle, LayoutDashboard, Moon, Sun, ChevronLeft, ChevronRight, Users, BookOpen, DollarSign, TrendingUp, Calendar, ClipboardList, Settings, UserCog, ConciergeBell } from "lucide-react";
import { useLocation } from "wouter";
import type { ActiveSection } from "@/pages/dashboard";

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

type MenuItem = { id: ActiveSection; icon: React.ComponentType<any>; label: string; labelEn: string };
type MenuGroup = { label: string; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { id: "overview",  icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard" },
      { id: "reception", icon: ConciergeBell,   label: "الاستقبال",   labelEn: "Reception"  },
    ]
  },
  {
    label: "الطلاب",
    items: [
      { id: "student-registration", icon: UserPlus, label: "تسجيل الطلاب", labelEn: "Students" },
      { id: "group-management",     icon: Users,    label: "المجموعات",    labelEn: "Groups"   },
    ]
  },
  {
    label: "المدرسين",
    items: [
      { id: "teachers", icon: UserCog, label: "المدرسين", labelEn: "Teachers" },
    ]
  },
  {
    label: "الحصص",
    items: [
      { id: "session-management",  icon: CalendarPlus, label: "إدارة الحصص",     labelEn: "Sessions"   },
      { id: "timetable",           icon: Calendar,     label: "الجدول الدراسي",  labelEn: "Timetable"  },
      { id: "attendance-scanning", icon: QrCode,       label: "تسجيل الحضور",    labelEn: "Attendance" },
    ]
  },
  {
    label: "التقييم",
    items: [
      { id: "grade-entry",         icon: Star,          label: "إدخال الدرجات", labelEn: "Grades"   },
      { id: "exam-builder",        icon: ClipboardList, label: "الامتحانات",    labelEn: "Exams"    },
      { id: "homework-management", icon: BookOpen,      label: "الواجبات",      labelEn: "Homework" },
    ]
  },
  {
    label: "الإدارة",
    items: [
      { id: "finance-management",  icon: DollarSign,    label: "النظام المالي",   labelEn: "Finance"   },
      { id: "analytics",           icon: TrendingUp,    label: "التحليل الذكي",   labelEn: "Analytics" },
      { id: "reports",             icon: BarChart3,     label: "التقارير",        labelEn: "Reports"   },
      { id: "whatsapp-management", icon: MessageCircle, label: "واتساب",          labelEn: "WhatsApp"  },
      { id: "settings",            icon: Settings,      label: "الإعدادات",       labelEn: "Settings"  },
    ]
  }
];

const paths: Record<ActiveSection, string> = {
  "overview": "/", "student-registration": "/students", "group-management": "/groups",
  "session-management": "/sessions", "timetable": "/timetable", "attendance-scanning": "/attendance",
  "grade-entry": "/grades", "exam-builder": "/exams", "homework-management": "/homework",
  "finance-management": "/finance", "analytics": "/analytics", "reports": "/reports",
  "whatsapp-management": "/whatsapp", "settings": "/settings",
  "teachers": "/teachers", "reception": "/reception",
};

export default function Sidebar({ activeSection, onSectionChange, darkMode, onToggleDark }: SidebarProps) {
  const [, setLocation] = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = [false, () => {}]; // simplified — add state if needed

  const handleNav = (id: ActiveSection) => {
    setLocation(paths[id]);
    onSectionChange(id);
    // Scroll sidebar nav back to top so active item is always visible from top
    if (navRef.current) navRef.current.scrollTop = 0;
  };

  return (
    <div className="flex flex-col w-56 flex-shrink-0 transition-all duration-300"
      style={{ background: "hsl(var(--sidebar))", borderLeft: "1px solid hsl(var(--sidebar-border))" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={14} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white leading-tight truncate">نظام المدرسة</div>
          <div className="text-[10px] leading-tight" style={{ color: "hsl(var(--sidebar-foreground) / 0.35)" }}>Center Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav ref={navRef} className="flex-1 px-2 py-3 overflow-y-auto space-y-5">
        {menuGroups.map(group => (
          <div key={group.label}>
            <div className="px-2 mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "hsl(var(--sidebar-foreground) / 0.28)" }}>
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button key={item.id} data-testid={`nav-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}>
                    <Icon size={15} className="flex-shrink-0" />
                    <div className="flex-1 text-right min-w-0">
                      <div className="truncate text-[13px] leading-tight">{item.label}</div>
                      <div className="text-[9px] leading-tight mt-0.5 truncate opacity-30">{item.labelEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t flex-shrink-0 space-y-1"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <button onClick={onToggleDark} data-testid="button-toggle-dark"
          className="sidebar-nav-item w-full">
          {darkMode
            ? <Sun size={14} className="flex-shrink-0" />
            : <Moon size={14} className="flex-shrink-0" />}
          <span className="text-xs flex-1 text-right">{darkMode ? "وضع النهار" : "الوضع الليلي"}</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mt-1"
          style={{ background: "hsl(var(--sidebar-accent))" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--sidebar-primary) / 0.3)" }}>
            <span className="text-[10px] font-bold text-white">م</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white leading-tight truncate">المدير</div>
            <div className="text-[9px] leading-tight truncate" style={{ color: "hsl(var(--sidebar-foreground) / 0.35)" }}>
              admin@school.edu
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
