import { useRef } from "react";
import {
  GraduationCap, UserPlus, CalendarPlus, QrCode, Star, BarChart3,
  MessageCircle, LayoutDashboard, Moon, Sun, Users, BookOpen,
  DollarSign, TrendingUp, Calendar, ClipboardList, Settings, UserCog, ConciergeBell, X, LogOut, Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/lib/auth-context";
import type { ActiveSection } from "@/pages/dashboard";

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

type MenuItem = { id: ActiveSection; icon: React.ComponentType<any>; label: string; labelEn: string };
type MenuGroup = { label: string; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { id: "overview",  icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard" },
      { id: "reception", icon: ConciergeBell,   label: "الاستقبال",   labelEn: "Reception"  },
    ],
  },
  {
    label: "الطلاب",
    items: [
      { id: "student-registration", icon: UserPlus, label: "تسجيل الطلاب", labelEn: "Students" },
      { id: "group-management",     icon: Users,    label: "المجموعات",    labelEn: "Groups"   },
    ],
  },
  {
    label: "المدرسين",
    items: [
      { id: "teachers", icon: UserCog, label: "المدرسين", labelEn: "Teachers" },
    ],
  },
  {
    label: "الحصص",
    items: [
      { id: "session-management",  icon: CalendarPlus, label: "إدارة الحصص",    labelEn: "Sessions"   },
      { id: "timetable",           icon: Calendar,     label: "الجدول الدراسي", labelEn: "Timetable"  },
      { id: "attendance-scanning", icon: QrCode,       label: "تسجيل الحضور",   labelEn: "Attendance" },
    ],
  },
  {
    label: "التقييم",
    items: [
      { id: "grade-entry",         icon: Star,          label: "إدخال الدرجات", labelEn: "Grades"   },
      { id: "exam-builder",        icon: ClipboardList, label: "الامتحانات",    labelEn: "Exams"    },
      { id: "homework-management", icon: BookOpen,      label: "الواجبات",      labelEn: "Homework" },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { id: "finance-management",  icon: DollarSign,    label: "النظام المالي",     labelEn: "Finance"   },
      { id: "analytics",           icon: TrendingUp,    label: "التحليلات",          labelEn: "Analytics" },
      { id: "reports",             icon: BarChart3,     label: "التقارير",           labelEn: "Reports"   },
      { id: "whatsapp-management", icon: MessageCircle, label: "واتساب",             labelEn: "WhatsApp"  },
      { id: "user-management",     icon: Shield,        label: "المستخدمون",         labelEn: "Users"     },
      { id: "settings",            icon: Settings,      label: "الإعدادات",          labelEn: "Settings"  },
    ],
  },
];

const paths: Record<ActiveSection, string> = {
  "overview": "/", "student-registration": "/students", "group-management": "/groups",
  "session-management": "/sessions", "timetable": "/timetable",
  "attendance-scanning": "/attendance", "grade-entry": "/grades",
  "exam-builder": "/exams", "homework-management": "/homework",
  "finance-management": "/finance", "analytics": "/analytics",
  "reports": "/reports", "whatsapp-management": "/whatsapp",
  "settings": "/settings", "teachers": "/teachers", "reception": "/reception",
  "user-management": "/users",
};

export default function Sidebar({ activeSection, onSectionChange, darkMode, onToggleDark, mobileOpen, onMobileClose }: SidebarProps) {
  const [, setLocation] = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const { get } = useSettings();
  const { user, logout } = useAuth();

  const centerName = get("app_name", "نظام المدرسة");
  const logoUrl = get("logo_url", "");
  const tagline = get("app_tagline", "Center Management");

  const handleNav = (id: ActiveSection) => {
    const scrollTop = navRef.current?.scrollTop ?? 0;
    setLocation(paths[id]);
    onSectionChange(id);
    onMobileClose?.();
    requestAnimationFrame(() => {
      if (navRef.current) navRef.current.scrollTop = scrollTop;
    });
  };

  const sidebarContent = (
    <div
      className="flex flex-col w-56 flex-shrink-0 h-full"
      style={{
        background: "hsl(var(--sidebar))",
        borderLeft: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-[15px] flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
        ) : (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs"
            style={{ background: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))" }}
          >
            {centerName.charAt(0) || "M"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-tight truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
            {centerName}
          </div>
          <div className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: "hsl(var(--sidebar-foreground) / 0.3)" }}>
            {tagline || "Center Management"}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav ref={navRef} className="flex-1 px-2 py-3 overflow-y-auto space-y-4" style={{ scrollBehavior: "auto" }}>
        {menuGroups.map((group) => (
          <div key={group.label}>
            <div
              className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "hsl(var(--sidebar-foreground) / 0.25)" }}
            >
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    data-testid={`nav-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    tabIndex={-1}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <div className="flex-1 text-right min-w-0">
                      <div className="truncate text-[12.5px] leading-tight">{item.label}</div>
                      <div className="text-[9px] leading-tight mt-0.5 truncate opacity-25">{item.labelEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-2 py-3 flex-shrink-0 space-y-1"
        style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
      >
        <button
          onClick={onToggleDark}
          data-testid="button-toggle-dark"
          tabIndex={-1}
          className="sidebar-nav-item w-full"
        >
          {darkMode
            ? <Sun size={13} className="flex-shrink-0" />
            : <Moon size={13} className="flex-shrink-0" />}
          <span className="text-[12px] flex-1 text-right">
            {darkMode ? "وضع النهار" : "الوضع الليلي"}
          </span>
        </button>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md mt-1"
          style={{ background: "hsl(var(--sidebar-accent))" }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded-full object-contain flex-shrink-0" />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[10px]"
              style={{ background: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))" }}
            >
              {centerName.charAt(0) || "M"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div
              className="text-[12px] font-semibold leading-tight truncate"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              {user?.name || "المستخدم"}
            </div>
            <div
              className="text-[9px] leading-tight truncate mt-0.5"
              style={{ color: "hsl(var(--sidebar-foreground) / 0.3)" }}
            >
              {user?.email || ""}
            </div>
          </div>
          <button
            onClick={logout}
            title="تسجيل الخروج"
            className="p-1 rounded hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          {/* Sidebar panel - RTL so slide from right */}
          <div className="relative mr-auto h-full">
            <button
              onClick={onMobileClose}
              className="absolute top-3 left-3 z-10 p-1.5 rounded-md hover:bg-muted/20 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
