import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, TrendingDown, Users, Star, BarChart3, Target, Award, Calendar, Flame } from "lucide-react";
import type { Student, Session, Attendance, Grade, Homework, HomeworkSubmission, Finance } from "@shared/schema";
import type { ActiveSection } from "@/pages/dashboard";

interface SmartAnalyticsProps { onNavigate: (s: ActiveSection) => void; }

export default function SmartAnalytics({ onNavigate }: SmartAnalyticsProps) {
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: sessions = [] } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ["/api/grades"] });
  const { data: homework = [] } = useQuery<Homework[]>({ queryKey: ["/api/homework"] });
  const { data: submissions = [] } = useQuery<HomeworkSubmission[]>({ queryKey: ["/api/homework/submissions"] });
  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });

  const analytics = useMemo(() => {
    // Student performance
    const studentPerf = students.map(student => {
      const sg = grades.filter(g => g.studentId === student.id);
      const avg = sg.length > 0 ? sg.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / sg.length : null;
      const hwSubs = submissions.filter(s => s.studentId === student.id && s.status !== "pending").length;
      const hwTotal = homework.length;
      const hwRate = hwTotal > 0 ? (hwSubs / hwTotal) * 100 : 0;
      return { student, avg, hwRate, gradeCount: sg.length };
    });

    // Top performers
    const topStudents = [...studentPerf].filter(s => s.avg !== null).sort((a, b) => (b.avg || 0) - (a.avg || 0)).slice(0, 5);
    // At risk (low grades OR low homework completion)
    const atRisk = studentPerf.filter(s => (s.avg !== null && s.avg < 60) || (s.gradeCount > 0 && s.hwRate < 50));
    // Most absent - need attendance data per student per session
    const sessionIds = sessions.map(s => s.id);
    const mostAbsent = students.map(student => {
      const presentCount = 0; // would need attendance data - show placeholder
      return { student, absences: 0 };
    }).slice(0, 5);

    // Subject analytics
    const subjectStats = Array.from(new Set(grades.map(g => g.subject))).map(subject => {
      const sg = grades.filter(g => g.subject === subject);
      const avg = sg.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / sg.length;
      const passing = sg.filter(g => (g.score / g.totalMarks) * 100 >= 60).length;
      return { subject, avg, count: sg.length, passingRate: sg.length > 0 ? (passing / sg.length) * 100 : 0 };
    }).sort((a, b) => a.avg - b.avg);

    // Finance summary
    const totalRevenue = finances.reduce((s, f) => s + (f.paid ?? 0), 0);
    const totalDue = finances.reduce((s, f) => s + f.amount, 0);
    const collectionRate = totalDue > 0 ? (totalRevenue / totalDue) * 100 : 0;
    const overdueCount = finances.filter(f => f.status !== "paid" && new Date(f.dueDate) < new Date()).length;

    // Homework completion
    const hwCompletionRate = homework.length > 0 && students.length > 0
      ? (submissions.filter(s => s.status !== "pending").length / (homework.length * students.length)) * 100
      : 0;

    // Grade distribution
    const gradeDist = { A: 0, B: 0, C: 0, D: 0, F: 0 } as Record<string, number>;
    grades.forEach(g => { if (g.grade) gradeDist[g.grade] = (gradeDist[g.grade] || 0) + 1; });

    return { topStudents, atRisk, subjectStats, totalRevenue, totalDue, collectionRate, overdueCount, hwCompletionRate, gradeDist, studentPerf };
  }, [students, sessions, grades, homework, submissions, finances]);

  const gradeColors: Record<string, string> = { A: "bg-emerald-500", B: "bg-blue-500", C: "bg-yellow-500", D: "bg-orange-500", F: "bg-red-500" };

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "طلاب في خطر", value: analytics.atRisk.length, icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", onClick: () => {} },
          { label: "نسبة إنجاز الواجبات", value: `${analytics.hwCompletionRate.toFixed(0)}%`, icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", onClick: () => onNavigate("homework-management" as ActiveSection) },
          { label: "نسبة تحصيل الرسوم", value: `${analytics.collectionRate.toFixed(0)}%`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", onClick: () => onNavigate("finance-management" as ActiveSection) },
          { label: "متأخرون ماليًا", value: analytics.overdueCount, icon: Flame, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", onClick: () => onNavigate("finance-management" as ActiveSection) },
        ].map(({ label, value, icon: Icon, color, bg, onClick }) => (
          <button key={label} onClick={onClick} className="stat-card text-left group cursor-pointer">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}><Icon size={18} className={color} /></div>
            <div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2"><Star size={16} className="text-amber-500" /><h3 className="font-semibold">أفضل الطلاب أداءً</h3></div>
          <CardContent className="p-0">
            {analytics.topStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
            ) : analytics.topStudents.map(({ student, avg }, i) => (
              <div key={student.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30" data-testid={`top-student-${i}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" : i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{student.name}</div>
                  <div className="text-xs text-muted-foreground">{student.gradeLevel} - {student.section}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{avg?.toFixed(1)}%</div>
                  <div className="w-20 h-1 bg-muted rounded-full mt-1"><div className="h-full bg-primary rounded-full" style={{ width: `${avg}%` }} /></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /><h3 className="font-semibold">طلاب يحتاجون دعماً</h3><Badge variant="destructive" className="text-xs">{analytics.atRisk.length}</Badge></div>
          <CardContent className="p-0">
            {analytics.atRisk.length === 0 ? (
              <div className="p-8 text-center"><Award size={32} className="mx-auto mb-2 text-emerald-500" /><p className="text-sm text-muted-foreground">ممتاز! لا يوجد طلاب في خطر</p></div>
            ) : analytics.atRisk.slice(0, 6).map(({ student, avg, hwRate }) => (
              <div key={student.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangle size={14} className="text-red-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{student.name}</div>
                  <div className="flex gap-3 mt-0.5">
                    {avg !== null && <span className="text-xs text-muted-foreground">درجات: <span className="text-red-600 font-medium">{avg.toFixed(0)}%</span></span>}
                    <span className="text-xs text-muted-foreground">واجبات: <span className="font-medium">{hwRate.toFixed(0)}%</span></span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{student.guardianPhone}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2"><BarChart3 size={16} className="text-muted-foreground" /><h3 className="font-semibold">أداء المواد</h3></div>
          <CardContent className="p-5">
            {analytics.subjectStats.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">لا توجد درجات بعد</div>
            ) : (
              <div className="space-y-4">
                {analytics.subjectStats.map(s => (
                  <div key={s.subject}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{s.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{s.count} تقييم</span>
                        <span className={`font-bold ${s.avg >= 75 ? "text-emerald-600" : s.avg >= 60 ? "text-amber-600" : "text-red-600"}`}>{s.avg.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${s.avg >= 75 ? "bg-emerald-500" : s.avg >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${s.avg}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">نسبة النجاح: {s.passingRate.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2"><TrendingUp size={16} className="text-muted-foreground" /><h3 className="font-semibold">توزيع التقديرات</h3></div>
          <CardContent className="p-5">
            {grades.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">لا توجد درجات بعد</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(analytics.gradeDist).map(([grade, count]) => {
                  const pct = grades.length > 0 ? (count / grades.length) * 100 : 0;
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center grade-${grade.toLowerCase()}`}>{grade}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${gradeColors[grade] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                      <span className="text-xs text-muted-foreground w-9 text-right">{pct.toFixed(0)}%</span>
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
