import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StudentRegistration from "@/components/students/student-registration";
import SessionManagement from "@/components/sessions/session-management";
import AttendanceScanner from "@/components/attendance/attendance-scanner";
import GradeEntry from "@/components/grades/grade-entry";
import Reports from "@/components/reports/reports";
import { WhatsAppManagement } from "@/components/whatsapp/whatsapp-management";

export type ActiveSection = 
  | "student-registration" 
  | "session-management" 
  | "attendance-scanning" 
  | "grade-entry" 
  | "reports"
  | "whatsapp-management";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("student-registration");

  const sectionTitles = {
    "student-registration": {
      title: "Student Registration",
      description: "Add new students and generate QR codes"
    },
    "session-management": {
      title: "Session Management", 
      description: "Create and manage class sessions"
    },
    "attendance-scanning": {
      title: "Attendance Scanning",
      description: "Scan QR codes or enter manual codes for attendance"
    },
    "grade-entry": {
      title: "Grade Entry",
      description: "Enter and manage student grades"
    },
    "reports": {
      title: "Reports & Analytics",
      description: "View attendance and grade reports"
    },
    "whatsapp-management": {
      title: "WhatsApp Management",
      description: "Send grades via WhatsApp and manage messages"
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "student-registration":
        return <StudentRegistration />;
      case "session-management":
        return <SessionManagement />;
      case "attendance-scanning":
        return <AttendanceScanner />;
      case "grade-entry":
        return <GradeEntry />;
      case "reports":
        return <Reports />;
      case "whatsapp-management":
        return <WhatsAppManagement />;
      default:
        return <StudentRegistration />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header {...sectionTitles[activeSection]} />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
