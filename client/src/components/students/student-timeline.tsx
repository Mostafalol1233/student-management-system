import { useQuery } from "@tanstack/react-query";
import type { Student, Attendance, Finance, Grade } from "@shared/schema";
import { UserCheck, DollarSign, Star, Calendar, Clock } from "lucide-react";

interface TimelineItem {
  date: string;
  type: "attendance" | "payment" | "grade" | "registration";
  icon: any;
  iconCls: string;
  bgCls: string;
  title: string;
  desc?: string;
  badge?: { text: string; cls: string };
}

export function StudentTimeline({ student }: { student: Student }) {
  const { data: allAttendance = [] } = useQuery<Attendance[]>({ queryKey: ["/api/attendance"] });
  const { data: allFinances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });
  const { data: allGrades = [] } = useQuery<Grade[]>({ queryKey: ["/api/grades"] });

  const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
  const studentFinances   = allFinances.filter(f => f.studentId === student.id);
  const studentGrades     = allGrades.filter(g => g.studentId === student.id);

  const items: TimelineItem[] = [
    // Registration
    {
      date: student.createdAt?.toString().slice(0, 10) ?? "—",
      type: "registration",
      icon: Calendar,
      iconCls: "text-indigo-600",
      bgCls: "bg-indigo-50 dark:bg-indigo-900/20",
      title: "تسجيل في النظام",
      desc: `رمز الطالب: ${student.code}`,
    },
    // Attendance
    ...studentAttendance.map(a => ({
      date: a.date,
      type: "attendance" as const,
      icon: UserCheck,
      iconCls: a.status === "present" ? "text-emerald-600" : "text-red-500",
      bgCls: a.status === "present" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20",
      title: a.status === "present" ? "حضر الحصة" : a.status === "absent" ? "غائب" : "حضر متأخراً",
      desc: a.time ? `الوقت: ${a.time}` : undefined,
      badge: {
        text: a.status === "present" ? "حضور" : a.status === "absent" ? "غياب" : "تأخير",
        cls: a.status === "present" ? "bg-emerald-100 text-emerald-700" : a.status === "absent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
      },
    })),
    // Payments
    ...studentFinances.map(f => ({
      date: f.dueDate,
      type: "payment" as const,
      icon: DollarSign,
      iconCls: f.status === "paid" ? "text-emerald-600" : "text-amber-600",
      bgCls: f.status === "paid" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20",
      title: f.type,
      desc: `${(f.paid ?? 0).toLocaleString()} / ${f.amount.toLocaleString()} ج`,
      badge: {
        text: f.status === "paid" ? "مدفوع" : "معلق",
        cls: f.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
      },
    })),
    // Grades
    ...studentGrades.map(g => ({
      date: g.createdAt?.toString().slice(0, 10) ?? "—",
      type: "grade" as const,
      icon: Star,
      iconCls: "text-violet-600",
      bgCls: "bg-violet-50 dark:bg-violet-900/20",
      title: `${g.subject} — ${g.type}`,
      desc: g.notes || undefined,
      badge: {
        text: `${g.score}/${g.maxScore} (${Math.round((g.score / g.maxScore) * 100)}%)`,
        cls: g.score / g.maxScore >= 0.9 ? "bg-emerald-100 text-emerald-700" : g.score / g.maxScore >= 0.7 ? "bg-blue-100 text-blue-700" : g.score / g.maxScore >= 0.5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700",
      },
    })),
  ];

  // Sort descending
  const sorted = items.sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Clock size={28} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm">لا يوجد سجل أحداث بعد</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute right-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-0">
        {sorted.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="relative flex gap-4 pb-5 pr-12">
              {/* Dot */}
              <div className={`absolute right-3 top-1 w-5 h-5 rounded-full ${item.bgCls} border-2 border-background flex items-center justify-center flex-shrink-0 z-10`}>
                <Icon size={10} className={item.iconCls} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badge.cls}`}>
                        {item.badge.text}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">{item.date}</span>
                  </div>
                </div>
                {item.desc && <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
