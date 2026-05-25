import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StudentRegistration from "@/components/students/student-registration";
import SessionManagement from "@/components/sessions/session-management";
import AttendanceScanner from "@/components/attendance/attendance-scanner";
import GradeEntry from "@/components/grades/grade-entry";
import Reports from "@/components/reports/reports";
import { WhatsAppManagement } from "@/components/whatsapp/whatsapp-management";
import Overview from "@/components/overview/overview";

export type ActiveSection =
  | "overview"
  | "student-registration"
  | "session-management"
  | "attendance-scanning"
  | "grade-entry"
  | "reports"
  | "whatsapp-management";

interface DashboardProps {
  initialSection?: ActiveSection;
  [key: string]: any;
}

const sectionMeta: Record<ActiveSection, { title: string; titleAr: string; description: string }> = {
  "overview": { title: "Dashboard", titleAr: "لوحة التحكم", description: "نظرة عامة على النظام والإحصائيات" },
  "student-registration": { title: "Student Registration", titleAr: "تسجيل الطلاب", description: "إضافة طلاب جدد وإنشاء رموز QR" },
  "session-management": { title: "Session Management", titleAr: "إدارة الحصص", description: "إنشاء وإدارة حصص الدراسة" },
  "attendance-scanning": { title: "Attendance Scanning", titleAr: "تسجيل الحضور", description: "مسح رموز QR أو الإدخال اليدوي للحضور" },
  "grade-entry": { title: "Grade Entry", titleAr: "إدخال الدرجات", description: "تسجيل وإدارة درجات الطلاب" },
  "reports": { title: "Reports & Analytics", titleAr: "التقارير والتحليلات", description: "عرض تقارير الحضور والدرجات" },
  "whatsapp-management": { title: "WhatsApp Management", titleAr: "إدارة واتساب", description: "إرسال الدرجات والإشعارات عبر واتساب" },
};

export default function Dashboard({ initialSection = "overview", ...props }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>(initialSection);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <Overview onNavigate={setActiveSection} />;
      case "student-registration": return <StudentRegistration />;
      case "session-management": return <SessionManagement />;
      case "attendance-scanning": return <AttendanceScanner />;
      case "grade-entry": return <GradeEntry />;
      case "reports": return <Reports />;
      case "whatsapp-management": return <WhatsAppManagement />;
      default: return <Overview onNavigate={setActiveSection} />;
    }
  };

  const meta = sectionMeta[activeSection];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header title={meta.title} titleAr={meta.titleAr} description={meta.description} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
