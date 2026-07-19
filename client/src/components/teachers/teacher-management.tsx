import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeacherSchema, type Teacher, type InsertTeacher, type Enrollment, type Finance } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Users, BookOpen, DollarSign, Search, TrendingUp, CheckCircle, Clock, Banknote } from "lucide-react";

const SALARY_TYPES = [
  { value: "fixed",       label: "مرتب ثابت",           hint: "مبلغ ثابت كل شهر" },
  { value: "per_student", label: "مبلغ لكل طالب",        hint: "× عدد الطلاب النشطين" },
  { value: "percentage",  label: "نسبة من الإيرادات %",   hint: "% من إيرادات طلابه" },
];

interface SalaryReport {
  teacher: Teacher;
  studentCount: number;
  teacherRevenue: number;
  expectedSalary: number;
  paid: number;
  remaining: number;
  period: string | null;
}

const MONTHS = [
  { value: "1",  label: "يناير"   }, { value: "2",  label: "فبراير"  },
  { value: "3",  label: "مارس"    }, { value: "4",  label: "أبريل"   },
  { value: "5",  label: "مايو"    }, { value: "6",  label: "يونيو"   },
  { value: "7",  label: "يوليو"   }, { value: "8",  label: "أغسطس"  },
  { value: "9",  label: "سبتمبر" }, { value: "10", label: "أكتوبر"  },
  { value: "11", label: "نوفمبر"  }, { value: "12", label: "ديسمبر"  },
];

function SalarySettlementPanel({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const { toast } = useToast();
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => String(currentYear - i));

  const { data: report, isLoading, refetch } = useQuery<SalaryReport>({
    queryKey: ["/api/teachers", teacher.id, "salary-report", selectedMonth, selectedYear],
    queryFn: async () => {
      const r = await fetch(
        `/api/teachers/${teacher.id}/salary-report?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      return r.json();
    },
  });

  const payMutation = useMutation({
    mutationFn: async ({ amount, notes }: { amount: number; notes: string }) =>
      (await apiRequest("POST", `/api/teachers/${teacher.id}/salary-payment`, { amount, notes })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacher.id, "salary-report"] });
      setPayAmount(""); setPayNotes(""); setShowPayForm(false);
      refetch(); // refetch with current month/year filters
      toast({ title: `✅ تم صرف المرتب لـ ${teacher.name} — ${monthLabel} ${selectedYear}` });
    },
    onError: (e: any) => toast({ title: "فشل صرف المرتب", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">جاري الحساب...</div>;
  if (!report) return null;

  const salaryTypeLabel = SALARY_TYPES.find(t => t.value === teacher.salaryType)?.label ?? "";
  const formulaDesc =
    teacher.salaryType === "fixed"       ? `${teacher.salaryAmount || 0} ج / شهر` :
    teacher.salaryType === "per_student" ? `${teacher.salaryAmount || 0} ج × ${report.studentCount} طالب` :
    `${teacher.salaryAmount || 0}% × ${report.teacherRevenue.toLocaleString()} ج إيرادات`;

  const parsedPay = parseFloat(payAmount) || 0;

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? "";

  return (
    <div className="space-y-4">
      {/* Teacher header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">{teacher.name.slice(0, 1)}</span>
        </div>
        <div>
          <div className="font-semibold">{teacher.name}</div>
          <div className="text-xs text-muted-foreground">{teacher.subject} · {salaryTypeLabel}</div>
        </div>
      </div>

      {/* Period selector */}
      <div className="rounded-xl border bg-muted/20 p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground">الفترة:</span>
        <div className="flex gap-2 flex-1">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="flex-1 h-8 px-2 text-xs border rounded-md bg-background"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-24 h-8 px-2 text-xs border rounded-md bg-background"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {report && (
          <span className="text-xs text-primary font-medium">{monthLabel} {selectedYear}</span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "عدد الطلاب النشطين",  value: `${report.studentCount} طالب`,                        icon: Users,       cls: "text-blue-600" },
          { label: "إيرادات طلابه",        value: `${report.teacherRevenue.toLocaleString()} ج`,         icon: TrendingUp,  cls: "text-emerald-600" },
          { label: "المرتب المستحق",        value: `${report.expectedSalary.toLocaleString()} ج`,         icon: DollarSign,  cls: "text-primary" },
          { label: "المتبقي للصرف",         value: `${report.remaining.toLocaleString()} ج`,              icon: Clock,       cls: report.remaining > 0 ? "text-amber-600" : "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3 flex items-center gap-2.5">
            <s.icon size={14} className={s.cls} />
            <div>
              <div className="font-semibold text-sm">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Formula */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
        <div className="text-xs font-semibold text-muted-foreground">حساب المرتب</div>
        <div className="text-sm font-mono">{formulaDesc}</div>
        <div className="text-lg font-bold text-primary">{report.expectedSalary.toLocaleString()} ج</div>
      </div>

      {/* Status banner */}
      {report.remaining > 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200">
          <Clock size={13} className="text-amber-600" />
          <span className="text-xs text-amber-700 dark:text-amber-400">المتبقي للصرف: {report.remaining.toLocaleString()} ج</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200">
          <CheckCircle size={13} className="text-emerald-600" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400">تم صرف المرتب بالكامل لهذا الشهر</span>
        </div>
      )}

      {/* Pay form */}
      {showPayForm ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">تسجيل دفعة مرتب</div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">المبلغ (ج) *</label>
            <input
              type="number" min="1" placeholder={`${report.remaining > 0 ? report.remaining : report.expectedSalary}`}
              value={payAmount} onChange={e => setPayAmount(e.target.value)}
              className="w-full h-8 px-3 text-sm border rounded-md bg-background font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">ملاحظات (اختياري)</label>
            <input
              type="text" placeholder="مثال: مرتب شهر يوليو"
              value={payNotes} onChange={e => setPayNotes(e.target.value)}
              className="w-full h-8 px-3 text-sm border rounded-md bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={parsedPay <= 0 || payMutation.isPending}
              onClick={() => payMutation.mutate({ amount: parsedPay, notes: payNotes })}>
              <Banknote size={14} className="mr-2" />
              {payMutation.isPending ? "جاري الصرف..." : `صرف ${parsedPay > 0 ? parsedPay.toLocaleString() + " ج" : ""}`}
            </Button>
            <Button variant="outline" onClick={() => setShowPayForm(false)}>إلغاء</Button>
          </div>
        </div>
      ) : (
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => { setPayAmount(String(report.remaining > 0 ? report.remaining : report.expectedSalary)); setShowPayForm(true); }}>
          <Banknote size={14} className="mr-2" />تسجيل صرف مرتب
        </Button>
      )}

      <Button variant="outline" className="w-full" onClick={onClose}>إغلاق</Button>
    </div>
  );
}

export default function TeacherManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [salaryTeacher, setSalaryTeacher] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments"] });
  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });

  const form = useForm<InsertTeacher>({
    resolver: zodResolver(insertTeacherSchema),
    defaultValues: { name: "", subject: "", phone: "", email: "", salaryType: "fixed", salaryAmount: 0, notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTeacher) => (await apiRequest("POST", "/api/teachers", data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teachers"] }); form.reset(); setShowForm(false); toast({ title: "تم إضافة المدرس" }); },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      (await apiRequest("PUT", `/api/teachers/${id}`, data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teachers"] }); setEditingTeacher(null); toast({ title: "تم تحديث المدرس" }); },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/teachers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teachers"] }); toast({ title: "تم حذف المدرس" }); },
  });

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getStudentCount = (tid: string) => enrollments.filter(e => e.teacherId === tid && e.status === "active").length;

  const calcSalary = (t: Teacher) => {
    const sc = getStudentCount(t.id);
    const studentIds = enrollments.filter(e => e.teacherId === t.id && e.status === "active").map(e => e.studentId);
    const rev = finances.filter(f => studentIds.includes(f.studentId) && f.status === "paid").reduce((s, f) => s + (f.paid ?? 0), 0);
    if (t.salaryType === "fixed") return t.salaryAmount || 0;
    if (t.salaryType === "per_student") return (t.salaryAmount || 0) * sc;
    return rev * ((t.salaryAmount || 0) / 100);
  };

  const getSalaryDisplay = (t: Teacher) => {
    if (t.salaryType === "fixed") return `${(t.salaryAmount || 0).toLocaleString()} ج/شهر`;
    if (t.salaryType === "per_student") return `${(t.salaryAmount || 0)} ج × ${getStudentCount(t.id)} طالب`;
    return `${t.salaryAmount || 0}% من الإيرادات`;
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.reset({ name: teacher.name, subject: teacher.subject, phone: teacher.phone || "", email: teacher.email || "", salaryType: teacher.salaryType, salaryAmount: teacher.salaryAmount || 0, notes: teacher.notes || "" });
    setShowForm(true);
  };

  const handleSubmit = (data: InsertTeacher) => {
    if (editingTeacher) updateMutation.mutate({ id: editingTeacher.id, data });
    else createMutation.mutate(data);
  };

  const totalSalary = teachers.reduce((sum, t) => sum + calcSalary(t), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المدرسين",       value: teachers.length,                                   icon: Users },
          { label: "إجمالي الطلاب النشطين", value: enrollments.filter(e => e.status === "active").length, icon: BookOpen },
          { label: "إجمالي المرتبات / شهر", value: `${totalSalary.toLocaleString()} ج`,              icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
              <s.icon size={15} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم المدرس أو المادة..." className="pl-8 h-8 text-sm" />
        </div>
        <Button onClick={() => { setEditingTeacher(null); form.reset(); setShowForm(true); }} data-testid="button-add-teacher">
          <Plus size={14} className="mr-2" />إضافة مدرس
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Users size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">لم يتم إضافة مدرسين بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">المدرس</TableHead>
                  <TableHead className="text-xs">المادة</TableHead>
                  <TableHead className="text-xs">الهاتف</TableHead>
                  <TableHead className="text-xs">الطلاب</TableHead>
                  <TableHead className="text-xs">المرتب</TableHead>
                  <TableHead className="text-xs">المستحق</TableHead>
                  <TableHead className="text-xs">الحالة</TableHead>
                  <TableHead className="text-xs text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(teacher => {
                  const expected = calcSalary(teacher);
                  return (
                    <TableRow key={teacher.id} className="hover:bg-muted/20" data-testid={`row-teacher-${teacher.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-[11px] font-semibold">{teacher.name.slice(0, 1)}</span>
                          </div>
                          <span className="font-medium text-sm">{teacher.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{teacher.subject}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{teacher.phone || "—"}</TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">{getStudentCount(teacher.id)}</span>
                        <span className="text-xs text-muted-foreground"> طالب</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{getSalaryDisplay(teacher)}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{expected.toLocaleString()} ج</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === "active" ? "secondary" : "outline"} className="text-[10px]">
                          {teacher.status === "active" ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-primary"
                            onClick={() => setSalaryTeacher(teacher)} data-testid={`button-salary-${teacher.id}`}>
                            <DollarSign size={11} className="mr-1" />تسوية
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(teacher)} data-testid={`button-edit-teacher-${teacher.id}`}>
                            <Edit size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`حذف ${teacher.name}?`)) deleteMutation.mutate(teacher.id); }}
                            data-testid={`button-delete-teacher-${teacher.id}`}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={o => { setShowForm(o); if (!o) setEditingTeacher(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "تعديل بيانات المدرس" : "إضافة مدرس جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>الاسم *</FormLabel>
                    <FormControl><Input placeholder="اسم المدرس" {...field} data-testid="input-teacher-name" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>المادة *</FormLabel>
                    <FormControl><Input placeholder="الرياضيات..." {...field} data-testid="input-teacher-subject" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>الهاتف</FormLabel>
                    <FormControl><Input type="tel" placeholder="+201234567890" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl><Input type="email" placeholder="teacher@school.com" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="salaryType" render={({ field }) => (
                  <FormItem><FormLabel>نوع المرتب</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {SALARY_TYPES.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <div>{s.label}<div className="text-[10px] text-muted-foreground">{s.hint}</div></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="salaryAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("salaryType") === "percentage" ? "النسبة %" : "المبلغ (ج)"}
                    </FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>ملاحظات</FormLabel>
                  <FormControl><Input placeholder="ملاحظات اختيارية..." {...field} value={field.value || ""} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-teacher">
                  {editingTeacher ? "حفظ التعديلات" : "إضافة المدرس"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Salary Settlement Dialog */}
      <Dialog open={!!salaryTeacher} onOpenChange={o => { if (!o) setSalaryTeacher(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسوية المرتب</DialogTitle>
          </DialogHeader>
          {salaryTeacher && <SalarySettlementPanel teacher={salaryTeacher} onClose={() => setSalaryTeacher(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
