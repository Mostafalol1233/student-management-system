import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Student, type Enrollment, type Subscription, type Teacher, type Subject, type Finance } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, AlertTriangle, CheckCircle, Clock, DollarSign, UserCheck, QrCode, BookOpen, Users } from "lucide-react";

function StudentCard({ student, onClose }: { student: Student; onClose: () => void }) {
  const { toast } = useToast();
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments/student", student.id], queryFn: () => fetch(`/api/enrollments/student/${student.id}`).then(r => r.json()) });
  const { data: subscriptions = [] } = useQuery<Subscription[]>({ queryKey: ["/api/subscriptions/student", student.id], queryFn: () => fetch(`/api/subscriptions/student/${student.id}`).then(r => r.json()) });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ["/api/subjects"] });
  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances/student", student.id], queryFn: () => fetch(`/api/finances/student/${student.id}`).then(r => r.json()) });

  const overdueFinances = finances.filter(f => f.status === "overdue" || (f.paid < f.amount && new Date(f.dueDate) < new Date()));
  const overdueSubscriptions = subscriptions.filter(s => s.status === "overdue" || (s.paid < s.amount && s.endDate && new Date(s.endDate) < new Date()));
  const hasAlerts = overdueFinances.length > 0 || overdueSubscriptions.length > 0;

  const payMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) =>
      (await apiRequest("PUT", `/api/finances/${id}`, { paid: amount, status: "paid" })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances/student", student.id] });
      toast({ title: "تم تسجيل الدفع" });
    },
  });

  return (
    <div className="space-y-4">
      {/* Student header */}
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40 border">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-foreground">{student.name.slice(0, 1)}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base">{student.name}</div>
          <div className="text-sm text-muted-foreground">{student.gradeLevel} — {student.section}</div>
          <div className="font-mono text-sm text-muted-foreground">#{student.code}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={student.status === "active" ? "secondary" : "destructive"} className="text-xs">
            {student.status === "active" ? "نشط" : student.status}
          </Badge>
          {hasAlerts && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle size={10} />
              تنبيهات
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-3 space-y-1">
          <div className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-2">
            <AlertTriangle size={12} />
            تنبيهات تحتاج اهتمام
          </div>
          {overdueFinances.map(f => (
            <div key={f.id} className="flex items-center justify-between text-xs">
              <span className="text-red-600 dark:text-red-400">متأخرات: {f.amount - (f.paid || 0)} ج</span>
              <Button size="sm" variant="outline" className="h-6 text-xs border-red-300"
                onClick={() => payMutation.mutate({ id: f.id, amount: f.amount })}>
                دفع
              </Button>
            </div>
          ))}
          {overdueSubscriptions.map(s => (
            <div key={s.id} className="text-xs text-red-600 dark:text-red-400">
              اشتراك منتهي — المبلغ: {s.amount - (s.paid || 0)} ج
            </div>
          ))}
        </div>
      )}

      {/* Enrollments */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">المواد المسجلة</div>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد تسجيلات</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map(e => {
              const teacher = teachers.find(t => t.id === e.teacherId);
              const subject = subjects.find(s => s.id === e.subjectId);
              const sub = subscriptions.find(s => s.enrollmentId === e.id);
              const isPaid = sub ? sub.paid >= sub.amount : true;
              return (
                <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${e.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                    <div>
                      <div className="text-sm font-medium">{subject?.name || "مادة غير محددة"}</div>
                      {teacher && <div className="text-xs text-muted-foreground">أ. {teacher.name}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {isPaid ? "مدفوع" : `${sub.paid}/${sub.amount} ج`}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">{e.status === "active" ? "نشط" : e.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">ولي الأمر: </span>{student.guardianPhone}
        {student.guardianPhone2 && <span> / {student.guardianPhone2}</span>}
      </div>
    </div>
  );
}

function CheckInScreen() {
  const [code, setCode] = useState("");
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const { toast } = useToast();
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: activeSession } = useQuery<any>({ queryKey: ["/api/sessions/active"] });

  const search = () => {
    const student = students.find(s => s.code === code.trim() || s.name.includes(code.trim()));
    if (student) { setFoundStudent(student); setCheckedIn(false); }
    else toast({ title: "الطالب غير موجود", description: `لا يوجد طالب بالكود: ${code}`, variant: "destructive" });
  };

  const checkIn = async () => {
    if (!foundStudent || !activeSession) {
      toast({ title: "لا توجد حصة نشطة", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/attendance", {
        studentId: foundStudent.id, sessionId: activeSession.id,
        status: "present", scanMethod: "manual"
      });
      setCheckedIn(true);
      toast({ title: `✅ ${foundStudent.name} — تم تسجيل الحضور` });
    } catch {
      toast({ title: "تم تسجيل الحضور مسبقاً", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pt-4">
      {activeSession ? (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary pulse-dot" />
          <span className="font-medium">{activeSession.name}</span>
          <span className="text-muted-foreground">{activeSession.time}</span>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <Clock size={14} />
          لا توجد حصة نشطة حالياً
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={code}
          onChange={e => { setCode(e.target.value); setFoundStudent(null); setCheckedIn(false); }}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="أدخل كود الطالب أو اسمه..."
          className="text-base h-11"
          autoFocus
          data-testid="input-checkin-code"
        />
        <Button onClick={search} className="h-11 px-5" data-testid="button-checkin-search">
          <Search size={16} />
        </Button>
      </div>

      {foundStudent && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="font-bold">{foundStudent.name.slice(0, 1)}</span>
              </div>
              <div>
                <div className="font-semibold">{foundStudent.name}</div>
                <div className="text-xs text-muted-foreground">{foundStudent.gradeLevel} — #{foundStudent.code}</div>
              </div>
            </div>

            {checkedIn ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle size={16} />
                تم تسجيل الحضور بنجاح
              </div>
            ) : (
              <Button className="w-full" onClick={checkIn} disabled={!activeSession} data-testid="button-mark-present">
                <UserCheck size={15} className="mr-2" />
                تسجيل حضور
              </Button>
            )}

            {checkedIn && (
              <Button variant="outline" className="w-full" onClick={() => { setCode(""); setFoundStudent(null); setCheckedIn(false); }}>
                طالب آخر
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReceptionDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments"] });

  const overdueCount = finances.filter(f => f.status === "overdue" || (f.paid < f.amount && new Date(f.dueDate) < new Date())).length;
  const activeEnrollments = enrollments.filter(e => e.status === "active").length;

  const filteredStudents = searchQuery.length >= 1
    ? students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.includes(searchQuery)
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الطلاب", value: students.length, icon: Users, color: "" },
          { label: "تسجيلات نشطة", value: activeEnrollments, icon: BookOpen, color: "" },
          { label: "متأخرات مالية", value: overdueCount, icon: AlertTriangle, color: overdueCount > 0 ? "text-red-500" : "" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
              <s.icon size={16} className={s.color || "text-muted-foreground"} />
            </div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search"><Search size={13} className="mr-1.5" />بحث سريع</TabsTrigger>
          <TabsTrigger value="checkin"><QrCode size={13} className="mr-1.5" />تسجيل حضور</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الطالب أو الكود..."
              className="pl-9 h-10"
              autoFocus
              data-testid="input-reception-search"
            />
          </div>

          {filteredStudents.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredStudents.map(student => {
                    const studentFinances = finances.filter(f => f.studentId === student.id);
                    const hasOverdue = studentFinances.some(f => f.status === "overdue" || (f.paid < f.amount && new Date(f.dueDate) < new Date()));
                    return (
                      <button key={student.id} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 text-left transition-colors"
                        onClick={() => setSelectedStudent(student)} data-testid={`button-reception-student-${student.id}`}>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold">{student.name.slice(0, 1)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{student.name}</div>
                          <div className="text-xs text-muted-foreground">#{student.code} — {student.gradeLevel}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {hasOverdue && <Badge variant="destructive" className="text-[10px]">متأخرات</Badge>}
                          <Badge variant="outline" className="text-[10px]">{student.status === "active" ? "نشط" : student.status}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {searchQuery.length >= 1 && filteredStudents.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">لا توجد نتائج</div>
          )}
        </TabsContent>

        <TabsContent value="checkin">
          <CheckInScreen />
        </TabsContent>
      </Tabs>

      {/* Student detail dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={open => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ملف الطالب</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <StudentCard student={selectedStudent} onClose={() => setSelectedStudent(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
