import { useState, useRef, useEffect, useCallback } from "react";
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
import { Search, AlertTriangle, CheckCircle, Clock, UserCheck, QrCode, BookOpen, Users, History } from "lucide-react";
import { StudentTimeline } from "@/components/students/student-timeline";

/* ─────────────────────────── Student profile popup ────────────────────── */
function StudentCard({ student, onClose }: { student: Student; onClose: () => void }) {
  const { toast } = useToast();
  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/student", student.id],
    queryFn: () => fetch(`/api/enrollments/student/${student.id}`).then(r => r.json()),
  });
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions/student", student.id],
    queryFn: () => fetch(`/api/subscriptions/student/${student.id}`).then(r => r.json()),
  });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ["/api/subjects"] });
  const { data: finances = [] } = useQuery<Finance[]>({
    queryKey: ["/api/finances/student", student.id],
    queryFn: () => fetch(`/api/finances/student/${student.id}`).then(r => r.json()),
  });

  const overdueFinances = finances.filter(f => f.status === "overdue" || ((f.paid ?? 0) < f.amount && new Date(f.dueDate) < new Date()));
  const overdueSubscriptions = subscriptions.filter(s => s.status === "overdue" || ((s.paid ?? 0) < s.amount && s.endDate && new Date(s.endDate) < new Date()));
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
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-primary">{student.name.slice(0, 1)}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base">{student.name}</div>
          <div className="text-sm text-muted-foreground">{student.gradeLevel}{student.section && ` — ${student.section}`}</div>
          <div className="font-mono text-xs text-muted-foreground mt-0.5">#{student.code}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={student.status === "active" ? "secondary" : "destructive"} className="text-xs">
            {student.status === "active" ? "نشط" : student.status}
          </Badge>
          {hasAlerts && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle size={9} />تنبيهات
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-3 space-y-2">
          <div className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={11} />تنبيهات تحتاج اهتمام
          </div>
          {overdueFinances.map(f => (
            <div key={f.id} className="flex items-center justify-between">
              <span className="text-xs text-red-600 dark:text-red-400">
                متأخرات: {(f.amount - (f.paid ?? 0)).toLocaleString()} ج — {f.type}
              </span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] border-red-300 text-red-700"
                onClick={() => payMutation.mutate({ id: f.id, amount: f.amount })}>
                دفع الآن
              </Button>
            </div>
          ))}
          {overdueSubscriptions.map(s => (
            <div key={s.id} className="text-xs text-red-600 dark:text-red-400">
              اشتراك منتهٍ — {(s.amount - (s.paid ?? 0)).toLocaleString()} ج
            </div>
          ))}
        </div>
      )}

      {/* Tabs: info / timeline */}
      <Tabs defaultValue="info">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="info"><BookOpen size={12} className="mr-1" />المعلومات</TabsTrigger>
          <TabsTrigger value="timeline"><History size={12} className="mr-1" />السجل الكامل</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-3 space-y-3">
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
                  const isPaid = sub ? (sub.paid ?? 0) >= sub.amount : true;
                  return (
                    <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <div>
                          <div className="text-sm font-medium">{subject?.name || "مادة"}</div>
                          {teacher && <div className="text-xs text-muted-foreground">أ. {teacher.name}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {sub && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {isPaid ? "مدفوع" : `${sub.paid ?? 0}/${sub.amount} ج`}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px]">{e.status === "active" ? "نشط" : e.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <span className="font-medium">ولي الأمر: </span>{student.guardianPhone || "—"}
            {student.guardianPhone2 && <span> / {student.guardianPhone2}</span>}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-3">
          <StudentTimeline student={student} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────── Check-in screen ───────────────────────────── */
function CheckInScreen() {
  const [code, setCode] = useState("");
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: activeSession } = useQuery<any>({ queryKey: ["/api/sessions/active"] });

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(() => {
    if (!code.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const student = students.find(s =>
        s.code === code.trim() ||
        s.name.includes(code.trim()) ||
        s.name.toLowerCase().includes(code.trim().toLowerCase())
      );
      if (student) {
        setFoundStudent(student);
        setCheckedIn(false);
      } else {
        toast({ title: "الطالب غير موجود", description: `كود: ${code}`, variant: "destructive" });
      }
      setIsSearching(false);
    }, 100);
  }, [code, students, toast]);

  const checkIn = useCallback(async () => {
    if (!foundStudent || !activeSession) {
      toast({ title: "لا توجد حصة نشطة", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/attendance", {
        studentId: foundStudent.id, sessionId: activeSession.id,
        status: "present", scanMethod: "manual", date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
      });
      setCheckedIn(true);
      toast({ title: `${foundStudent.name} — تم تسجيل الحضور` });
    } catch {
      toast({ title: "الحضور مسجل مسبقاً", variant: "destructive" });
    }
  }, [foundStudent, activeSession, toast]);

  const reset = useCallback(() => {
    setCode(""); setFoundStudent(null); setCheckedIn(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Keyboard shortcut: Enter always does the right next thing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); search(); }
    if (e.key === "Escape") { reset(); }
  };

  // Global Enter when student found
  useEffect(() => {
    if (!foundStudent) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && foundStudent && !checkedIn) { e.preventDefault(); checkIn(); }
      if (e.key === "Escape" || (e.key === "Enter" && checkedIn)) { reset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [foundStudent, checkedIn, checkIn, reset]);

  return (
    <div className="max-w-md mx-auto space-y-4 pt-4">
      {/* Keyboard hint */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-background border font-mono">Enter</kbd>
        <span>بحث ← تسجيل حضور ← طالب آخر</span>
        <span className="mr-auto"><kbd className="px-1.5 py-0.5 rounded text-[10px] bg-background border font-mono">Esc</kbd> إعادة تعيين</span>
      </div>

      {/* Active session */}
      {activeSession ? (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary pulse-dot flex-shrink-0" />
          <span className="font-semibold">{activeSession.name}</span>
          <span className="text-muted-foreground text-xs mr-auto">{activeSession.time}</span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <Clock size={13} />لا توجد حصة نشطة — ابدأ حصة أولاً
        </div>
      )}

      {/* Search input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={code}
          onChange={e => { setCode(e.target.value); setFoundStudent(null); setCheckedIn(false); }}
          onKeyDown={handleKeyDown}
          placeholder="كود الطالب أو الاسم... (Enter للبحث)"
          className="text-base h-12 font-mono"
          autoFocus
          data-testid="input-checkin-code"
          disabled={isSearching}
        />
        <Button onClick={search} className="h-12 px-5" disabled={isSearching || !code.trim()} data-testid="button-checkin-search">
          <Search size={16} />
        </Button>
      </div>

      {/* Student found */}
      {foundStudent && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">{foundStudent.name.slice(0, 1)}</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{foundStudent.name}</div>
                <div className="text-xs text-muted-foreground">{foundStudent.gradeLevel} — #{foundStudent.code}</div>
              </div>
              <Badge variant="secondary" className="text-xs">{foundStudent.status === "active" ? "نشط" : foundStudent.status}</Badge>
            </div>

            {checkedIn ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                  <CheckCircle size={16} />تم تسجيل الحضور بنجاح ✓
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  اضغط <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-muted border font-mono">Enter</kbd> أو <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-muted border font-mono">Esc</kbd> للطالب التالي
                </div>
                <Button variant="outline" className="w-full h-10" onClick={reset} data-testid="button-next-student">
                  <UserCheck size={14} className="mr-2" />طالب آخر
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button className="w-full h-11" onClick={checkIn} disabled={!activeSession} data-testid="button-mark-present">
                  <UserCheck size={15} className="mr-2" />
                  تسجيل حضور{" "}
                  <kbd className="mr-2 px-1.5 py-0.5 rounded text-[10px] bg-white/20 border border-white/30 font-mono">Enter</kbd>
                </Button>
                {!activeSession && <p className="text-xs text-center text-amber-600">ابدأ حصة أولاً لتسجيل الحضور</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────── Main component ────────────────────────────── */
export default function ReceptionDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments"] });

  const overdueCount = finances.filter(f => (f.paid ?? 0) < f.amount && new Date(f.dueDate) < new Date()).length;
  const activeEnrollments = enrollments.filter(e => e.status === "active").length;

  const filteredStudents = searchQuery.length >= 1
    ? students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.includes(searchQuery)
      ).slice(0, 10)
    : [];

  // Global keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Keyboard nav through results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredStudents.length === 1) {
      setSelectedStudent(filteredStudents[0]);
    }
    if (e.key === "Escape") setSearchQuery("");
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الطلاب",  value: students.length,    icon: Users,          color: "" },
          { label: "تسجيلات نشطة",   value: activeEnrollments,  icon: BookOpen,        color: "" },
          { label: "متأخرات مالية",  value: overdueCount,       icon: AlertTriangle,   color: overdueCount > 0 ? "text-red-500" : "" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <s.icon size={15} className={s.color || "text-muted-foreground"} />
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
          <TabsTrigger value="search"><Search size={12} className="mr-1.5" />بحث سريع</TabsTrigger>
          <TabsTrigger value="checkin"><QrCode size={12} className="mr-1.5" />تسجيل حضور</TabsTrigger>
        </TabsList>

        {/* ── Search tab ── */}
        <TabsContent value="search" className="mt-4 space-y-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ابحث باسم الطالب أو الكود... (/ للتركيز، Enter إذا نتيجة واحدة)"
              className="pl-9 h-10"
              autoFocus
              data-testid="input-reception-search"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">
                ✕
              </button>
            )}
          </div>

          {filteredStudents.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredStudents.map((student, idx) => {
                    const studentFinances = finances.filter(f => f.studentId === student.id);
                    const hasOverdue = studentFinances.some(f => (f.paid ?? 0) < f.amount && new Date(f.dueDate) < new Date());
                    return (
                      <button key={student.id}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-right"
                        onClick={() => setSelectedStudent(student)}
                        data-testid={`button-reception-student-${student.id}`}>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold">{student.name.slice(0, 1)}</span>
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-sm font-medium truncate">{student.name}</div>
                          <div className="text-xs text-muted-foreground">#{student.code}{student.gradeLevel && ` — ${student.gradeLevel}`}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 items-center">
                          {hasOverdue && <Badge variant="destructive" className="text-[10px]">متأخرات</Badge>}
                          <Badge variant="outline" className="text-[10px]">{student.status === "active" ? "نشط" : student.status}</Badge>
                          {idx === 0 && filteredStudents.length === 1 && (
                            <kbd className="text-[9px] px-1 py-0.5 bg-muted border rounded font-mono text-muted-foreground">Enter</kbd>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {searchQuery.length >= 1 && filteredStudents.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Search size={24} className="mx-auto mb-2 opacity-20" />
              لا توجد نتائج لـ "{searchQuery}"
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              اضغط <kbd className="px-1.5 py-0.5 bg-muted border rounded font-mono">/</kbd> في أي وقت للبحث السريع
            </div>
          )}
        </TabsContent>

        {/* ── Check-in tab ── */}
        <TabsContent value="checkin">
          <CheckInScreen />
        </TabsContent>
      </Tabs>

      {/* Student profile dialog */}
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
