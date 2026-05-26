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
import GroupManagement from "@/components/groups/group-management";
import HomeworkManagement from "@/components/homework/homework-management";
import FinanceManagement from "@/components/finance/finance-management";
import SmartAnalytics from "@/components/analytics/smart-analytics";

export type ActiveSection =
  | "overview"
  | "student-registration"
  | "session-management"
  | "attendance-scanning"
  | "grade-entry"
  | "reports"
  | "whatsapp-management"
  | "group-management"
  | "homework-management"
  | "finance-management"
  | "analytics";

interface DashboardProps {
  initialSection?: ActiveSection;
  [key: string]: any;
}

const sectionMeta: Record<ActiveSection, { title: string; titleAr: string; description: string }> = {
  "overview": { title: "Dashboard", titleAr: "لوحة التحكم", description: "نظرة عامة على النظام والإحصائيات" },
  "student-registration": { title: "Students", titleAr: "تسجيل الطلاب", description: "إضافة وإدارة الطلاب" },
  "session-management": { title: "Sessions", titleAr: "إدارة الحصص", description: "إنشاء وإدارة حصص الدراسة" },
  "attendance-scanning": { title: "Attendance", titleAr: "تسجيل الحضور", description: "مسح رموز QR أو الإدخال اليدوي" },
  "grade-entry": { title: "Grades", titleAr: "إدخال الدرجات", description: "تسجيل وإدارة درجات الطلاب" },
  "reports": { title: "Reports", titleAr: "التقارير", description: "تقارير الحضور والدرجات" },
  "whatsapp-management": { title: "WhatsApp", titleAr: "واتساب", description: "إرسال الإشعارات عبر واتساب" },
  "group-management": { title: "Groups", titleAr: "المجموعات والشُّعَب", description: "إدارة مجموعات وشُّعَب الطلاب" },
  "homework-management": { title: "Homework", titleAr: "الواجبات", description: "إدارة الواجبات والتصحيح" },
  "finance-management": { title: "Finance", titleAr: "النظام المالي", description: "الاشتراكات والدفعات والمتأخرات" },
  "analytics": { title: "Analytics", titleAr: "التحليل الذكي", description: "إحصائيات ومؤشرات أداء متقدمة" },
};

export default function Dashboard({ initialSection = "overview", ...props }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>(initialSection);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

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
      case "group-management": return <GroupManagement />;
      case "homework-management": return <HomeworkManagement />;
      case "finance-management": return <FinanceManagement />;
      case "analytics": return <SmartAnalytics onNavigate={setActiveSection} />;
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
