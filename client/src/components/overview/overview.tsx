import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Users, CheckCircle, TrendingUp, AlertTriangle, Calendar, Star, UserPlus, QrCode, BarChart3, MessageCircle, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Student, Session, Grade, Attendance } from "@shared/schema";
import type { ActiveSection } from "@/pages/dashboard";

interface OverviewProps {
  onNavigate: (section: ActiveSection) => void;
}

export default function Overview({ onNavigate }: OverviewProps) {
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: sessions = [] } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ["/api/grades"] });
  const { data: activeSession } = useQuery<Session | null>({ queryKey: ["/api/sessions/active"] });

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const completedSessions = sessions.filter(s => s.status === "completed").length;
    const classAverage = grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / grades.length
      : 0;
    const atRisk = students.filter(student => {
      const sg = grades.filter(g => g.studentId === student.id);
      if (sg.length === 0) return false;
      const avg = sg.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / sg.length;
      return avg < 60;
    }).length;
    const unsentGrades = grades.filter(g => !g.sentToParent).length;
    const recentStudents = [...students].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).slice(0, 5);
    const recentGrades = [...grades].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).slice(0, 5);
    return { totalStudents, completedSessions, classAverage, atRisk, unsentGrades, recentStudents, recentGrades };
  }, [students, sessions, grades]);

  const statCards = [
    {
      label: "إجمالي الطلاب",
      labelEn: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      action: () => onNavigate("student-registration"),
    },
    {
      label: "معدل الفصل",
      labelEn: "Class Average",
      value: `${stats.classAverage.toFixed(1)}%`,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-600 dark:text-emerald-400",
      action: () => onNavigate("reports"),
    },
    {
      label: "الحصص المكتملة",
      labelEn: "Sessions Done",
      value: stats.completedSessions,
      icon: Calendar,
      color: "from-violet-500 to-violet-600",
      bg: "bg-violet-50 dark:bg-violet-900/20",
      text: "text-violet-600 dark:text-violet-400",
      action: () => onNavigate("session-management"),
    },
    {
      label: "طلاب في خطر",
      labelEn: "At Risk",
      value: stats.atRisk,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
      action: () => onNavigate("reports"),
    },
    {
      label: "درجات غير مرسلة",
      labelEn: "Unsent Grades",
      value: stats.unsentGrades,
      icon: MessageCircle,
      color: "from-amber-500 to-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-600 dark:text-amber-400",
      action: () => onNavigate("whatsapp-management"),
    },
  ];

  const quickActions = [
    { label: "تسجيل طالب جديد", icon: UserPlus, section: "student-registration" as ActiveSection, color: "bg-blue-500 hover:bg-blue-600" },
    { label: "تسجيل الحضور", icon: QrCode, section: "attendance-scanning" as ActiveSection, color: "bg-emerald-500 hover:bg-emerald-600" },
    { label: "إدخال درجات", icon: Star, section: "grade-entry" as ActiveSection, color: "bg-violet-500 hover:bg-violet-600" },
    { label: "عرض التقارير", icon: BarChart3, section: "reports" as ActiveSection, color: "bg-amber-500 hover:bg-amber-600" },
  ];

  const getGradeClass = (grade: string | null) => {
    switch (grade) {
      case "A": return "grade-a";
      case "B": return "grade-b";
      case "C": return "grade-c";
      case "D": return "grade-d";
      default: return "grade-f";
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Session Banner */}
      {activeSession && (
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white pulse-dot"></span>
            <div>
              <div className="font-semibold">{activeSession.name}</div>
              <div className="text-sm text-white/70">{activeSession.date} • {activeSession.time} • {activeSession.duration} دقيقة</div>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={() => onNavigate("attendance-scanning")}
            data-testid="button-go-attendance"
          >
            <QrCode size={14} className="mr-1" />
            تسجيل الحضور
          </Button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.action}
              className="stat-card text-left group cursor-pointer"
              data-testid={`stat-${card.labelEn.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon size={18} className={card.text} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground truncate">{card.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.section)}
                className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                data-testid={`quick-action-${action.section}`}
              >
                <Icon size={22} />
                <span className="text-sm font-medium text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-foreground">آخر الطلاب المسجلين</h3>
            <button
              onClick={() => onNavigate("student-registration")}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              عرض الكل <ArrowUpRight size={12} />
            </button>
          </div>
          <CardContent className="p-0">
            {stats.recentStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">لم يتم تسجيل طلاب بعد</p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentStudents.map((student) => (
                  <div key={student.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors" data-testid={`overview-student-${student.id}`}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.gradeLevel} - {student.section}</div>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">{student.code}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-foreground">آخر الدرجات المسجلة</h3>
            <button
              onClick={() => onNavigate("grade-entry")}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              عرض الكل <ArrowUpRight size={12} />
            </button>
          </div>
          <CardContent className="p-0">
            {stats.recentGrades.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Star size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">لم يتم تسجيل درجات بعد</p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentGrades.map((grade) => {
                  const student = students.find(s => s.id === grade.studentId);
                  const pct = Math.round((grade.score / grade.totalMarks) * 100);
                  return (
                    <div key={grade.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors" data-testid={`overview-grade-${grade.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{student?.name || "غير معروف"}</div>
                        <div className="text-xs text-muted-foreground">{grade.subject} · {grade.assessmentType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{grade.score}/{grade.totalMarks}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${getGradeClass(grade.grade)}`}>
                          {grade.grade} ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
