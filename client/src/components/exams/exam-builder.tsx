import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExamSchema, type Exam, type InsertExam, type ExamQuestion, type Group, type Student, type ExamSubmission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ClipboardList, BookOpen, CheckSquare } from "lucide-react";

const SUBJECTS = ["الرياضيات","الفيزياء","الكيمياء","الأحياء","اللغة العربية","اللغة الإنجليزية","التاريخ","الجغرافيا","الحاسوب","Mathematics","Physics","English","Science"];
const QUESTION_TYPES = [
  { value: "mcq", label: "اختيار من متعدد" },
  { value: "true_false", label: "صح أم خطأ" },
  { value: "short", label: "إجابة قصيرة" },
];

export default function ExamBuilder() {
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: "", type: "short", options: "", correctAnswer: "", marks: 5 });

  const { data: exams = [] } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: questions = [] } = useQuery<ExamQuestion[]>({
    queryKey: ["/api/exams", selectedExam?.id, "questions"],
    queryFn: async () => selectedExam ? (await fetch(`/api/exams/${selectedExam.id}/questions`)).json() : [],
    enabled: !!selectedExam,
  });
  const { data: submissions = [] } = useQuery<ExamSubmission[]>({
    queryKey: ["/api/exams", selectedExam?.id, "submissions"],
    queryFn: async () => selectedExam ? (await fetch(`/api/exams/${selectedExam.id}/submissions`)).json() : [],
    enabled: !!selectedExam,
  });

  const form = useForm<InsertExam>({
    resolver: zodResolver(insertExamSchema),
    defaultValues: { title: "", subject: "", groupId: "", date: new Date().toISOString().split("T")[0], duration: 60, description: "" },
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: InsertExam) => (await apiRequest("POST", "/api/exams", data)).json(),
    onSuccess: (e: Exam) => { queryClient.invalidateQueries({ queryKey: ["/api/exams"] }); form.reset({ title:"",subject:"",groupId:"",date:new Date().toISOString().split("T")[0],duration:60,description:"" }); setSelectedExam(e); toast({ title: `✅ تم إنشاء امتحان: ${e.title}` }); },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/exams/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/exams"] }); setSelectedExam(null); toast({ title: "✅ تم حذف الامتحان" }); },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (q: typeof newQuestion) => (await apiRequest("POST", `/api/exams/${selectedExam!.id}/questions`, { ...q, examId: selectedExam!.id, orderIndex: questions.length })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams", selectedExam?.id, "questions"] });
      setNewQuestion({ question: "", type: "short", options: "", correctAnswer: "", marks: 5 });
      toast({ title: "✅ تمت إضافة السؤال" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/exam-questions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/exams", selectedExam?.id, "questions"] }),
  });

  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ id, score }: { id: string; score: number }) =>
      (await apiRequest("PUT", `/api/exam-submissions/${id}`, { score, status: "graded" })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/exams", selectedExam?.id, "submissions"] }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => (await apiRequest("PUT", `/api/exams/${selectedExam!.id}`, { status: "published" })).json(),
    onSuccess: (e: Exam) => { setSelectedExam(e); queryClient.invalidateQueries({ queryKey: ["/api/exams"] }); toast({ title: "✅ تم نشر الامتحان" }); },
  });

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const examStudents = selectedExam ? (selectedExam.groupId ? students.filter(s => s.groupId === selectedExam.groupId) : students) : [];
  const avgScore = submissions.length > 0 ? submissions.filter(s => s.score !== null).reduce((a, s) => a + (s.score || 0), 0) / submissions.filter(s => s.score !== null).length : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create + List */}
        <div className="space-y-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2"><Plus size={15} /><h3 className="font-semibold text-sm">امتحان جديد</h3></div>
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => createExamMutation.mutate(d))} className="space-y-3">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">العنوان *</FormLabel><FormControl><Input placeholder="مثال: امتحان نصف العام" className="h-8 text-sm" data-testid="input-exam-title" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">المادة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر" /></SelectTrigger></FormControl>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="groupId" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">المجموعة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="الكل" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="all">كل الطلاب</SelectItem>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">التاريخ *</FormLabel><FormControl><Input type="date" className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="duration" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">المدة (دقيقة)</FormLabel><FormControl><Input type="number" className="h-8 text-sm" {...field} onChange={e => field.onChange(parseInt(e.target.value)||60)} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" size="sm" className="w-full" disabled={createExamMutation.isPending} data-testid="button-create-exam">
                    <Plus size={13} className="mr-1" />{createExamMutation.isPending ? "جاري..." : "إنشاء"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Exam list */}
          <div className="space-y-2">
            {exams.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4"><ClipboardList size={28} className="mx-auto mb-2 opacity-30" /><p>لا توجد امتحانات بعد</p></div>
            ) : exams.map(exam => (
              <div key={exam.id} onClick={() => setSelectedExam(exam)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors hover:bg-muted/50 ${selectedExam?.id === exam.id ? "border-primary bg-primary/5" : ""}`}
                data-testid={`exam-card-${exam.id}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">{exam.title}</div>
                  <Badge variant={exam.status === "published" ? "default" : "outline"} className="text-xs ml-2 flex-shrink-0">{exam.status === "published" ? "منشور" : "مسودة"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{exam.subject} · {exam.date} · {exam.duration} د</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Detail */}
        <div className="lg:col-span-2">
          {!selectedExam ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground"><BookOpen size={40} className="mx-auto mb-3 opacity-20" /><p>اختر امتحاناً لعرض تفاصيله</p></CardContent></Card>
          ) : (
            <Card>
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedExam.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedExam.subject} · {selectedExam.date} · {totalMarks} درجة إجمالية</p>
                </div>
                <div className="flex gap-2">
                  {selectedExam.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => publishMutation.mutate()} className="text-xs" data-testid="button-publish-exam">نشر</Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive text-xs"
                    onClick={() => { if (confirm("حذف هذا الامتحان؟")) deleteExamMutation.mutate(selectedExam.id); }}
                    data-testid="button-delete-exam">حذف</Button>
                </div>
              </div>

              <Tabs defaultValue="questions">
                <TabsList className="mx-5 mt-4 grid w-[calc(100%-40px)] grid-cols-2">
                  <TabsTrigger value="questions">الأسئلة ({questions.length})</TabsTrigger>
                  <TabsTrigger value="grades">الدرجات ({submissions.length})</TabsTrigger>
                </TabsList>

                {/* Questions Tab */}
                <TabsContent value="questions" className="p-5 space-y-4">
                  {/* Add question */}
                  <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                    <div className="text-sm font-medium">إضافة سؤال جديد</div>
                    <Input placeholder="نص السؤال *" value={newQuestion.question} onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))} className="text-sm" data-testid="input-question-text" />
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={newQuestion.type} onValueChange={v => setNewQuestion(p => ({ ...p, type: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                      {newQuestion.type === "mcq" && (
                        <Input placeholder="خيارات: أ,ب,ج,د" value={newQuestion.options} onChange={e => setNewQuestion(p => ({ ...p, options: e.target.value }))} className="h-8 text-xs" />
                      )}
                      {(newQuestion.type === "mcq" || newQuestion.type === "true_false") && (
                        <Input placeholder={newQuestion.type === "true_false" ? "صح أو خطأ" : "الإجابة الصحيحة"} value={newQuestion.correctAnswer} onChange={e => setNewQuestion(p => ({ ...p, correctAnswer: e.target.value }))} className="h-8 text-xs" />
                      )}
                      <Input type="number" min="1" placeholder="درجات" value={newQuestion.marks} onChange={e => setNewQuestion(p => ({ ...p, marks: parseInt(e.target.value)||5 }))} className="h-8 text-xs" />
                    </div>
                    <Button size="sm" disabled={!newQuestion.question || addQuestionMutation.isPending}
                      onClick={() => addQuestionMutation.mutate(newQuestion)} data-testid="button-add-question">
                      <Plus size={13} className="mr-1" />إضافة السؤال
                    </Button>
                  </div>

                  {/* Questions list */}
                  {questions.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">لا توجد أسئلة بعد</div>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          <span className="text-xs text-muted-foreground w-5 font-mono mt-0.5">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{q.question}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">{QUESTION_TYPES.find(t => t.value === q.type)?.label}</Badge>
                              <Badge variant="secondary" className="text-xs">{q.marks} درجة</Badge>
                              {q.correctAnswer && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">✓ {q.correctAnswer}</Badge>}
                            </div>
                            {q.options && <div className="text-xs text-muted-foreground mt-1">الخيارات: {q.options}</div>}
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0 flex-shrink-0"
                            onClick={() => deleteQuestionMutation.mutate(q.id)}><Trash2 size={12} /></Button>
                        </div>
                      ))}
                      <div className="text-right text-sm font-semibold text-muted-foreground">إجمالي: {totalMarks} درجة</div>
                    </div>
                  )}
                </TabsContent>

                {/* Grades Tab */}
                <TabsContent value="grades" className="p-5">
                  {avgScore !== null && (
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {[
                        { label: "متوسط الدرجات", value: avgScore.toFixed(1) },
                        { label: "إجمالي الطلاب", value: examStudents.length },
                        { label: "تم التصحيح", value: submissions.filter(s => s.status === "graded").length },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead>الطالب</TableHead><TableHead>الدرجة</TableHead><TableHead>من</TableHead><TableHead>الحالة</TableHead><TableHead>تصحيح</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {examStudents.map(student => {
                        const sub = submissions.find(s => s.studentId === student.id);
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="text-sm font-medium">{student.name}</TableCell>
                            <TableCell className="font-mono text-sm">{sub?.score ?? "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{totalMarks}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${sub?.status === "graded" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                                {sub?.status === "graded" ? "مصحح" : "لم يصحح"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="0" max={totalMarks}
                                defaultValue={sub?.score ?? ""}
                                className="h-7 w-16 text-xs"
                                onBlur={e => {
                                  const score = parseInt(e.target.value);
                                  if (!isNaN(score)) {
                                    if (sub) gradeSubmissionMutation.mutate({ id: sub.id, score });
                                    else apiRequest("POST", `/api/exam-submissions`, { examId: selectedExam.id, studentId: student.id, score, status: "graded" }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/exams", selectedExam.id, "submissions"] }));
                                  }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
