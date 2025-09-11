import { GraduationCap, UserPlus, CalendarPlus, QrCode, Star, BarChart3, User, MessageCircle } from "lucide-react";
import type { ActiveSection } from "@/pages/dashboard";

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    {
      id: "student-registration" as ActiveSection,
      icon: UserPlus,
      label: "Student Registration"
    },
    {
      id: "session-management" as ActiveSection,
      icon: CalendarPlus,
      label: "Session Management"
    },
    {
      id: "attendance-scanning" as ActiveSection,
      icon: QrCode,
      label: "Attendance Scanning"
    },
    {
      id: "grade-entry" as ActiveSection,
      icon: Star,
      label: "Grade Entry"
    },
    {
      id: "reports" as ActiveSection,
      icon: BarChart3,
      label: "Reports"
    },
    {
      id: "whatsapp-management" as ActiveSection,
      icon: MessageCircle,
      label: "WhatsApp Management"
    }
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground flex items-center">
          <GraduationCap className="text-primary mr-2" />
          Student System
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => onSectionChange(item.id)}
              className={`sidebar-item w-full text-left px-4 py-3 rounded-md transition-colors flex items-center ${
                activeSection === item.id ? "active" : ""
              }`}
            >
              <Icon className="mr-3" size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="text-white" size={16} />
          </div>
          <div>
            <div className="text-sm font-medium">Administrator</div>
            <div className="text-xs text-muted-foreground">admin@school.edu</div>
          </div>
        </div>
      </div>
    </div>
  );
}
