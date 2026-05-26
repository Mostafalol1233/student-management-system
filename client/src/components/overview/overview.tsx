import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Users, CheckCircle, TrendingUp, AlertTriangle, Calendar,
  Star, UserPlus, QrCode, BarChart3, MessageCircle, ArrowUpRight,
  Activity, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Student, Session, Grade } from "@shared/schema";
import type { ActiveSection } from "@/pages/dashboard";

interface OverviewProps {
  onNavigate: (section: ActiveSection) => void;
}

const STAT_COLORS: { bg: string; icon: string; ring: string }[] = [
  { bg: "bg-indigo-50 dark:bg-indigo-950/40",  icon: "text-indigo-600 dark:text-indigo-400",  ring: "bg-indigo-100 dark:bg-indigo-900/60"  },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400", ring: "bg-emerald-100 dark:bg-emerald-900/60" },
  { bg: "bg-violet-50 dark:bg-violet-950/40",  icon: "text-violet-600 dark:text-violet-400",  ring: "bg-violet-100 dark:bg-violet-900/60"  },
  { bg: "bg-amber-50 dark:bg-amber-950/40",    icon: "text-amber-600 dark:text-amber-400",    ring: "bg-amber-100 dark:bg-amber-900/60"    },
  { bg: "bg-rose-50 dark:bg-rose-950/40",      icon: "text-rose-600 dark:text-rose-400",      ring: "bg-rose-100 dark:bg-rose-900/60"      },
];

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
    const recentStudents = [...students]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);
    const recentGrades = [...grades]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);
    return { totalStudents, completedSessions, classAverage, atRisk, unsentGrades, recentStudents, recentGrades };
  }, [students, sessions, grades]);

  const statCards = [
    { label: "إجمالي الطلاب",     value: stats.totalStudents,               icon: Users,         action: () => onNavigate("student-registration") },
    { label: "معدل الفصل",        value: `${stats.classAverage.toFixed(1)}%`, icon: TrendingUp,    action: () => onNavigate("reports") },
    { label: "الحصص المكتملة",    value: stats.completedSessions,            icon: CheckCircle,   action: () => onNavigate("session-management") },
    { label: "طلاب في خطر",       value: stats.atRisk,                       icon: AlertTriangle, action: () => onNavigate("reports") },
    { label: "درجات غير مرسلة",   value: stats.unsentGrades,                 icon: MessageCircle, action: () => onNavigate("whatsapp-management") },
  ];

  const quickActions = [
    { label: "تسجيل طالب جديد", icon: UserPlus, section: "student-registration" as ActiveSection, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
    { label: "تسجيل الحضور",     icon: QrCode,   section: "attendance-scanning" as ActiveSection,  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "إدخال درجات",      icon: Star,     section: "grade-entry" as ActiveSection,          color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "عرض التقارير",     icon: BarChart3, section: "reports" as ActiveSection,             color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  ];

  const getGradeClass = (grade: string | null) => {
    switch (grade) {
      case "A": return "grade-a"; case "B": return "grade-b";
      case "C": return "grade-c"; case "D": return "grade-d";
      default: return "grade-f";
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Session Banner */}
      {activeSession && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Activity size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeSession.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {activeSession.date} · {activeSession.time} · {activeSession.duration} دقيقة
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => onNavigate("attendance-scanning")} data-testid="button-go-attendance"
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 text-xs gap-1.5 flex-shrink-0">
            <QrCode size={12} />
            تسجيل الحضور
          </Button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const c = STAT_COLORS[i];
          return (
            <button
              key={card.label}
              onClick={card.action}
              className="rounded-xl border bg-card p-4 flex flex-col gap-3 text-right group hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
              style={{ borderColor: "hsl(var(--border))" }}
              data-testid={`stat-${i}`}
            >
              <div className={`w-9 h-9 rounded-lg ${c.ring} flex items-center justify-center`}>
                <Icon size={16} className={c.icon} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground leading-none">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">{card.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={13} className="text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">إجراءات سريعة</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.section)}
                className="bg-card border rounded-xl p-4 flex flex-col items-center gap-2.5 transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5"
                style={{ borderColor: "hsl(var(--border))" }}
                data-testid={`quick-action-${action.section}`}
              >
                <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center`}>
                  <Icon size={18} className={action.color} />
                </div>
                <span className="text-[13px] font-medium text-foreground text-center leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <Users size={13} className="text-indigo-500" />
              <h3 className="font-semibold text-sm text-foreground">آخر الطلاب المسجلين</h3>
            </div>
            <button
              onClick={() => onNavigate("student-registration")}
              className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
            >
              عرض الكل <ArrowUpRight size={11} />
            </button>
          </div>
          <CardContent className="p-0">
            {stats.recentStudents.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Users size={18} className="text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm text-muted-foreground">لم يتم تسجيل طلاب بعد</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {stats.recentStudents.map((student) => (
                  <div key={student.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    data-testid={`overview-student-${student.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.gradeLevel} · {student.section}</div>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono shrink-0">{student.code}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <Star size={13} className="text-amber-500" />
              <h3 className="font-semibold text-sm text-foreground">آخر الدرجات المسجلة</h3>
            </div>
            <button
              onClick={() => onNavigate("grade-entry")}
              className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
            >
              عرض الكل <ArrowUpRight size={11} />
            </button>
          </div>
          <CardContent className="p-0">
            {stats.recentGrades.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Star size={18} className="text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm text-muted-foreground">لم يتم تسجيل درجات بعد</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {stats.recentGrades.map((grade) => {
                  const student = students.find(s => s.id === grade.studentId);
                  const pct = Math.round((grade.score / grade.totalMarks) * 100);
                  return (
                    <div key={grade.id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                      data-testid={`overview-grade-${grade.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
                        <Star size={13} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{student?.name || "غير معروف"}</div>
                        <div className="text-xs text-muted-foreground">{grade.subject} · {grade.assessmentType}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">{grade.score}/{grade.totalMarks}</div>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${getGradeClass(grade.grade)}`}>
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
