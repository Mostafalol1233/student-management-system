import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGradeSchema, type Grade, type InsertGrade, type Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Save, MessageCircle, SendHorizontal, Trash2, Search, ArrowUpDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SUBJECTS = [
  "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية",
  "التاريخ", "الجغرافيا", "التربية الإسلامية", "الحاسوب", "الفنون", "التربية البدنية",
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Science",
];
const ASSESSMENT_TYPES = [
  "اختبار شهري", "اختبار نصفي", "اختبار نهائي", "واجب منزلي", "مشروع", "مشاركة صفية",
  "Quiz", "Midterm Exam", "Final Exam", "Assignment", "Project",
];

const gradeClass = (g: string | null) => {
  switch (g) {
    case "A": return "grade-a";
    case "B": return "grade-b";
    case "C": return "grade-c";
    case "D": return "grade-d";
    default: return "grade-f";
  }
};

export default function GradeEntry() {
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"alpha" | "date">("date");
  const { toast } = useToast();

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ["/api/grades"] });

  // Students sorted alphabetically
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const filteredStudentsForDropdown = sortedStudents.filter(s =>
    !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.code.includes(studentSearch)
  );

  const form = useForm<InsertGrade>({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: { studentId: "", subject: "", assessmentType: "", score: 0, totalMarks: 100, notes: "" },
  });

  const watchScore = form.watch("score");
  const watchTotal = form.watch("totalMarks");
  const pct = watchTotal > 0 ? Math.round((watchScore / watchTotal) * 100) : 0;
  const liveGrade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

  const createMutation = useMutation({
    mutationFn: async (data: InsertGrade) => (await apiRequest("POST", "/api/grades", data)).json(),
    onSuccess: (grade: Grade) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      form.reset({ studentId: "", subject: "", assessmentType: "", score: 0, totalMarks: 100, notes: "" });
      setStudentSearch("");
      const student = students.find(s => s.id === grade.studentId);
      toast({ title: "✅ تم حفظ الدرجة", description: `${student?.name} — ${grade.subject}` });
    },
    onError: (e: any) => toast({ title: "فشل الحفظ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/grades/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/grades"] }); toast({ title: "✅ تم حذف الدرجة" }); },
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: async ({ studentName, phoneNumber, grade, subject, notes }: any) =>
      (await apiRequest("POST", "/api/whatsapp/send-grade", { studentName, phoneNumber, grade, subject, notes })).json(),
    onSuccess: () => toast({ title: "✅ تم الإرسال عبر واتساب" }),
    onError: (e: any) => toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" }),
  });

  const sendBulkMutation = useMutation({
    mutationFn: async (gradeIds: string[]) => (await apiRequest("POST", "/api/whatsapp/send-bulk-grades", { gradeIds })).json(),
    onSuccess: (r) => toast({ title: "✅ تم الإرسال الجماعي", description: `تم إرسال ${r.sent} من ${r.total} رسالة` }),
    onError: (e: any) => toast({ title: "فشل الإرسال الجماعي", description: e.message, variant: "destructive" }),
  });

  const handleSendWhatsApp = (grade: Grade) => {
    const student = students.find(s => s.id === grade.studentId);
    if (!student?.guardianPhone) { toast({ title: "لا يوجد رقم هاتف", variant: "destructive" }); return; }
    sendWhatsAppMutation.mutate({
      studentName: student.name, phoneNumber: student.guardianPhone,
      grade: `${grade.score}/${grade.totalMarks} (${grade.grade})`, subject: grade.subject, notes: grade.notes,
    });
  };

  // Stats
  const totalGrades = grades.length;
  const avg = totalGrades > 0 ? grades.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / totalGrades : 0;
  const highest = totalGrades > 0 ? Math.max(...grades.map(g => (g.score / g.totalMarks) * 100)) : 0;
  const lowest = totalGrades > 0 ? Math.min(...grades.map(g => (g.score / g.totalMarks) * 100)) : 0;
  const dist = ["A", "B", "C", "D", "F"].map(g => ({ g, count: grades.filter(gr => gr.grade === g).length }));

  const filteredGrades = [...grades]
    .filter(g => {
      const student = students.find(s => s.id === g.studentId);
      const matchSearch = !search || student?.name.toLowerCase().includes(search.toLowerCase()) || g.subject.toLowerCase().includes(search.toLowerCase());
      const matchSubject = subjectFilter === "all" || g.subject === subjectFilter;
      return matchSearch && matchSubject;
    })
    .sort((a, b) => {
      if (sortDir === "alpha") {
        const sA = students.find(s => s.id === a.studentId)?.name ?? "";
        const sB = students.find(s => s.id === b.studentId)?.name ?? "";
        return sA.localeCompare(sB, "ar");
      }
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });

  const unsent = filteredGrades.filter(g => !g.sentToParent);
  const uniqueSubjects = Array.from(new Set(grades.map(g => g.subject)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Save size={13} className="text-primary" />
                </div>
                إدخال درجة جديدة
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                  {/* Student field with inline search */}
                  <FormField control={form.control} name="studentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الطالب *</FormLabel>
                      {/* Search box above dropdown */}
                      <div className="relative mb-1">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          placeholder="ابحث عن طالب بالاسم أو الكود..."
                          className="pl-8 h-8 text-sm"
                          data-testid="input-student-search"
                        />
                      </div>
                      <Select onValueChange={(val) => { field.onChange(val); setStudentSearch(""); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-student">
                            <SelectValue placeholder="اختر طالباً" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredStudentsForDropdown.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">لا توجد نتائج</div>
                          ) : (
                            filteredStudentsForDropdown.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                <span>{s.name}</span>
                                <span className="text-muted-foreground text-xs mr-2">({s.code})</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>المادة *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subject">
                              <SelectValue placeholder="اختر المادة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="assessmentType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع التقييم *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assessment-type">
                              <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ASSESSMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="score" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدرجة *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="85" min="0" data-testid="input-score" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="totalMarks" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدرجة الكلية *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" min="1" data-testid="input-total-marks" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 100)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Live Grade Preview */}
                  {(watchScore > 0 || watchTotal > 0) && (
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>النسبة المئوية</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${gradeClass(liveGrade)}`}>
                        {liveGrade}
                      </span>
                    </div>
                  )}

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="أي ملاحظات إضافية..." data-testid="textarea-notes" className="min-h-[70px]" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-grade">
                    <Save size={14} className="mr-2" />
                    {createMutation.isPending ? "جاري الحفظ..." : "حفظ الدرجة"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm">إحصائيات الدرجات</h3>
              <div className="text-center p-4 bg-primary/5 rounded-xl">
                <div className="text-3xl font-bold text-primary" data-testid="text-class-average">{avg.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">المتوسط العام</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="font-bold text-emerald-600" data-testid="text-highest-score">{highest.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">الأعلى</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="font-bold text-red-600" data-testid="text-lowest-score">{lowest.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">الأدنى</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-muted-foreground">توزيع الدرجات</p>
                {dist.map(({ g, count }) => (
                  <div key={g} className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 h-5 rounded flex items-center justify-center ${gradeClass(g)}`}>{g}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalGrades > 0 ? (count / totalGrades) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grades Table */}
      <Card>
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="font-semibold flex-1">سجل الدرجات</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو المادة..."
                className="pl-8 h-8 w-44 text-sm"
                data-testid="input-search-grades"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-filter-subject">
                <SelectValue placeholder="كل المواد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المواد</SelectItem>
                {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDir(d => d === "alpha" ? "date" : "alpha")}
              className="h-8 gap-1 text-xs"
              data-testid="button-sort-grades"
            >
              <ArrowUpDown size={12} />
              {sortDir === "alpha" ? "أ→ي" : "الأحدث"}
            </Button>
            <Button
              size="sm"
              onClick={() => { if (unsent.length > 0) sendBulkMutation.mutate(unsent.map(g => g.id)); }}
              disabled={sendBulkMutation.isPending || unsent.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              data-testid="button-bulk-send"
            >
              <SendHorizontal size={13} className="mr-1" />
              إرسال جماعي ({unsent.length})
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          {filteredGrades.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">لا توجد درجات</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>الطالب</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>نوع التقييم</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>التقدير</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const student = students.find(s => s.id === grade.studentId);
                    const pctGrade = Math.round((grade.score / grade.totalMarks) * 100);
                    return (
                      <TableRow key={grade.id} className="hover:bg-muted/30" data-testid={`row-grade-${grade.id}`}>
                        <TableCell className="font-medium text-sm" data-testid={`text-grade-student-${grade.id}`}>
                          {student?.name || "غير معروف"}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-grade-subject-${grade.id}`}>{grade.subject}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{grade.assessmentType}</TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{grade.score}/{grade.totalMarks}</div>
                          <div className="text-xs text-muted-foreground">{pctGrade}%</div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${gradeClass(grade.grade)}`} data-testid={`badge-grade-${grade.id}`}>
                            {grade.grade}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(grade.createdAt!).toLocaleDateString("ar-SA")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => handleSendWhatsApp(grade)}
                              disabled={sendWhatsAppMutation.isPending || !!grade.sentToParent}
                              className={!!grade.sentToParent ? "text-muted-foreground" : "text-emerald-600 hover:text-emerald-700"}
                              title={!!grade.sentToParent ? "تم الإرسال" : "إرسال عبر واتساب"}
                              data-testid={`button-whatsapp-${grade.id}`}
                            >
                              <MessageCircle size={13} />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("حذف هذه الدرجة؟")) deleteMutation.mutate(grade.id); }}
                              data-testid={`button-delete-grade-${grade.id}`}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
