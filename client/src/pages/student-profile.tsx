import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import QRGenerator, { QRGeneratorRef } from "@/components/ui/qr-generator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type Student, type InsertStudent, type Grade, type Attendance, type HomeworkSubmission, type Finance, type StudentNote, type Group, type Session, type Homework } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, QrCode, Download, Phone, MapPin, GraduationCap, Star, ClipboardList, DollarSign, MessageSquare, Printer, Plus, Trash2, Users } from "lucide-react";

const NOTE_TYPES = [
  { value: "general", label: "ملاحظة عامة", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "behavioral", label: "سلوكية", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "academic", label: "أكاديمية", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "positive", label: "إيجابية", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
];

export default function StudentProfile() {
  const [, params] = useRoute("/student/:id");
  const studentId = params?.id;
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const qrRef = useRef<QRGeneratorRef>(null);
  const { toast } = useToast();

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ["/api/students", studentId],
    queryFn: () => fetch(`/api/students/${studentId}`).then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
    enabled: !!studentId,
  });
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades/student", studentId],
    queryFn: () => fetch(`/api/grades/student/${studentId}`).then(r => r.json()),
    enabled: !!studentId,
  });
  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/student", studentId],
    queryFn: () => fetch(`/api/attendance/student/${studentId}`).then(r => r.json()),
    enabled: !!studentId,
  });
  const { data: hwSubmissions = [] } = useQuery<HomeworkSubmission[]>({
    queryKey: ["/api/homework/submissions/student", studentId],
    queryFn: () => fetch(`/api/homework/submissions/student/${studentId}`).then(r => r.json()),
    enabled: !!studentId,
  });
  const { data: finances = [] } = useQuery<Finance[]>({
    queryKey: ["/api/finances/student", studentId],
    queryFn: () => fetch(`/api/finances/student/${studentId}`).then(r => r.json()),
    enabled: !!studentId,
  });
  const { data: notes = [] } = useQuery<StudentNote[]>({
    queryKey: ["/api/student-notes", studentId],
    queryFn: () => fetch(`/api/student-notes/${studentId}`).then(r => r.json()),
    enabled: !!studentId,
  });
  const { data: sessions = [] } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: homework = [] } = useQuery<Homework[]>({ queryKey: ["/api/homework"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    values: student ? { name: student.name, guardianPhone: student.guardianPhone, guardianPhone2: student.guardianPhone2 || "", address: student.address || "", gradeLevel: student.gradeLevel, section: student.section } : { name: "", guardianPhone: "", guardianPhone2: "", address: "", gradeLevel: "", section: "" },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertStudent) => (await apiRequest("PUT", `/api/students/${studentId}`, data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] }); setEditOpen(false); toast({ title: "✅ تم تحديث بيانات الطالب" }); },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/student-notes", { studentId, content: noteContent, type: noteType })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/student-notes", studentId] }); setNoteContent(""); toast({ title: "✅ تمت إضافة الملاحظة" }); },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/student-notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/student-notes", studentId] }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">جاري التحميل...</div></div>;
  if (!student) return <div className="p-6 text-center"><h2 className="text-xl mb-4">الطالب غير موجود</h2><Link href="/students"><Button>العودة</Button></Link></div>;

  const avg = grades.length > 0 ? grades.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / grades.length : 0;
  const attendanceRate = attendance.length > 0 ? (attendance.filter(a => a.status === "present").length / attendance.length) * 100 : 0;
  const totalPaid = finances.reduce((s, f) => s + (f.paid ?? 0), 0);
  const totalDue = finances.reduce((s, f) => s + f.amount, 0);
  const group = groups.find(g => g.id === student.groupId);
  const hwDone = hwSubmissions.filter(s => s.status !== "pending").length;

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const printProfile = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${student.name}</title>
      <style>body{font-family:Arial,sans-serif;direction:rtl;padding:20px}h1{color:#1e40af}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f4f6}.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;background:#dbeafe;color:#1e40af}</style>
      </head><body>
      <h1>${student.name}</h1><p>الكود: ${student.code} | الصف: ${student.gradeLevel}-${student.section}</p>
      <p>ولي الأمر: ${student.guardianPhone}</p>
      <h2>الدرجات</h2>
      <table><tr><th>المادة</th><th>النوع</th><th>الدرجة</th><th>من</th><th>التقدير</th></tr>
      ${grades.map(g => `<tr><td>${g.subject}</td><td>${g.assessmentType}</td><td>${g.score}</td><td>${g.totalMarks}</td><td>${g.grade}</td></tr>`).join("")}
      </table>
      <p><strong>المعدل العام: ${avg.toFixed(1)}%</strong></p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href="/students"><Button variant="ghost" size="sm"><ArrowLeft size={15} className="mr-1" />العودة</Button></Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printProfile} data-testid="button-print-profile"><Printer size={14} className="mr-1" />طباعة</Button>
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><QrCode size={14} className="mr-1" />QR</Button></DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogHeader><DialogTitle className="text-center">{student.name}</DialogTitle></DialogHeader>
              <div className="flex flex-col items-center gap-4">
                <QRGenerator ref={qrRef} value={student.code} size={180} studentName={student.name} />
                <div className="text-2xl font-bold text-primary">{student.code}</div>
                <Button className="w-full" onClick={() => { qrRef.current?.downloadQR(); toast({ title: "✅ تم تحميل QR" }); }}>
                  <Download size={14} className="mr-1" />تحميل
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild><Button size="sm" data-testid="button-edit-student"><Edit size={14} className="mr-1" />تحرير</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>تحرير بيانات الطالب</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="gradeLevel" render={({ field }) => (<FormItem><FormLabel>الصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="section" render={({ field }) => (<FormItem><FormLabel>الشعبة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="guardianPhone" render={({ field }) => (<FormItem><FormLabel>هاتف ولي الأمر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="guardianPhone2" render={({ field }) => (<FormItem><FormLabel>هاتف إضافي</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl></FormItem>)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>إلغاء</Button>
                    <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "جاري..." : "حفظ"}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <Avatar className="w-20 h-20 flex-shrink-0">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-violet-500 text-white">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <Badge variant={student.status === "active" ? "default" : "outline"}>{student.status === "active" ? "نشط" : "غير نشط"}</Badge>
                <Badge variant="outline" className="font-mono">{student.code}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><GraduationCap size={13} />{student.gradeLevel} - {student.section}</span>
                <span className="flex items-center gap-1"><Phone size={13} />{student.guardianPhone}</span>
                {group && <span className="flex items-center gap-1"><Users size={13} />{group.name}</span>}
                {student.address && <span className="flex items-center gap-1"><MapPin size={13} />{student.address}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
              {[
                { label: "المعدل", value: `${avg.toFixed(0)}%`, good: avg >= 70 },
                { label: "الحضور", value: `${attendanceRate.toFixed(0)}%`, good: attendanceRate >= 75 },
                { label: "واجبات", value: `${hwDone}/${homework.length}`, good: true },
                { label: "مسدد", value: `${((totalDue > 0 ? totalPaid / totalDue : 0) * 100).toFixed(0)}%`, good: totalPaid >= totalDue },
              ].map(({ label, value, good }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${good ? "text-primary" : "text-amber-600"}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="grades">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="grades"><Star size={13} className="mr-1" />الدرجات</TabsTrigger>
          <TabsTrigger value="attendance"><GraduationCap size={13} className="mr-1" />الحضور</TabsTrigger>
          <TabsTrigger value="homework"><ClipboardList size={13} className="mr-1" />الواجبات</TabsTrigger>
          <TabsTrigger value="finance"><DollarSign size={13} className="mr-1" />المالية</TabsTrigger>
          <TabsTrigger value="notes"><MessageSquare size={13} className="mr-1" />ملاحظات</TabsTrigger>
        </TabsList>

        {/* Grades */}
        <TabsContent value="grades" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {grades.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">لا توجد درجات مسجلة</div> : (
                <>
                  {/* Subject bars */}
                  {(() => {
                    const bySubject = Array.from(new Set(grades.map(g => g.subject))).map(sub => {
                      const sg = grades.filter(g => g.subject === sub);
                      const avg = sg.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / sg.length;
                      return { sub, avg, count: sg.length };
                    });
                    return (
                      <div className="p-5 border-b grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {bySubject.map(({ sub, avg, count }) => (
                          <div key={sub}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{sub}</span>
                              <span className={`font-bold ${avg >= 70 ? "text-primary" : "text-amber-600"}`}>{avg.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full"><div className={`h-full rounded-full ${avg >= 70 ? "bg-primary" : "bg-amber-500"}`} style={{ width: `${avg}%` }} /></div>
                            <div className="text-xs text-muted-foreground mt-0.5">{count} تقييمات</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>المادة</TableHead><TableHead>النوع</TableHead><TableHead>الدرجة</TableHead><TableHead>من</TableHead><TableHead>التقدير</TableHead><TableHead>التاريخ</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {[...grades].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).map(g => (
                        <TableRow key={g.id}><TableCell className="font-medium">{g.subject}</TableCell><TableCell>{g.assessmentType}</TableCell><TableCell className="font-mono">{g.score}</TableCell><TableCell className="font-mono">{g.totalMarks}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${g.grade === "A" ? "bg-emerald-100 text-emerald-700" : g.grade === "B" ? "bg-blue-100 text-blue-700" : g.grade === "C" ? "bg-yellow-100 text-yellow-700" : g.grade === "D" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>{g.grade}</span></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{g.createdAt ? new Date(g.createdAt).toLocaleDateString("ar-EG") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <span className="font-medium text-sm">سجل الحضور</span>
              <div className="flex items-center gap-3">
                <span className="text-sm">الحضور: <strong className={attendanceRate >= 75 ? "text-primary" : "text-amber-600"}>{attendanceRate.toFixed(0)}%</strong></span>
                <div className="w-24 h-1.5 bg-muted rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${attendanceRate}%` }} /></div>
              </div>
            </div>
            <CardContent className="p-0">
              {attendance.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">لا سجلات حضور</div> : (
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>الحصة</TableHead><TableHead>الحالة</TableHead><TableHead>الطريقة</TableHead><TableHead>الوقت</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {[...attendance].sort((a, b) => new Date(b.timeRecorded!).getTime() - new Date(a.timeRecorded!).getTime()).map(a => {
                      const session = sessions.find(s => s.id === a.sessionId);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">{session?.name || "—"}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{a.status === "present" ? "حاضر" : "غائب"}</span></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.scanMethod === "qr" ? "QR" : "يدوي"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.timeRecorded ? new Date(a.timeRecorded).toLocaleString("ar-EG") : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homework */}
        <TabsContent value="homework" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {homework.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">لا توجد واجبات</div> : (
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>الواجب</TableHead><TableHead>المادة</TableHead><TableHead>الموعد</TableHead><TableHead>الحالة</TableHead><TableHead>الدرجة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {homework.map(hw => {
                      const sub = hwSubmissions.find(s => s.homeworkId === hw.id);
                      return (
                        <TableRow key={hw.id}>
                          <TableCell className="font-medium text-sm">{hw.title}</TableCell>
                          <TableCell className="text-sm">{hw.subject}</TableCell>
                          <TableCell className={`text-xs ${new Date(hw.deadline) < new Date() && !sub ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{hw.deadline}</TableCell>
                          <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub?.status === "graded" ? "bg-emerald-100 text-emerald-700" : sub?.status === "submitted" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>{sub?.status === "graded" ? "مصحح" : sub?.status === "submitted" ? "مُسلَّم" : "لم يُسلَّم"}</span></TableCell>
                          <TableCell className="font-mono text-sm">{sub?.score !== null && sub?.score !== undefined ? `${sub.score}/${hw.totalMarks}` : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <span className="font-medium text-sm">السجل المالي</span>
              {totalDue > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm">مدفوع: <strong className="text-primary">{totalPaid} / {totalDue} ج</strong></span>
                  <Progress value={totalDue > 0 ? (totalPaid / totalDue) * 100 : 0} className="w-24 h-1.5" />
                </div>
              )}
            </div>
            <CardContent className="p-0">
              {finances.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">لا سجلات مالية</div> : (
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>النوع</TableHead><TableHead>المبلغ</TableHead><TableHead>المدفوع</TableHead><TableHead>الاستحقاق</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {finances.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm">{f.type}</TableCell>
                        <TableCell className="font-mono text-sm">{f.amount} ج</TableCell>
                        <TableCell className="font-mono text-sm">{f.paid ?? 0} ج</TableCell>
                        <TableCell className={`text-xs ${f.status !== "paid" && new Date(f.dueDate) < new Date() ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{f.dueDate}</TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{f.status === "paid" ? "مدفوع" : "معلق"}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <div className="space-y-4">
            <Card>
              <div className="px-5 py-4 border-b"><h3 className="font-semibold text-sm">إضافة ملاحظة</h3></div>
              <CardContent className="p-5 space-y-3">
                <Textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="اكتب ملاحظتك هنا..." className="min-h-[80px]" data-testid="input-note-content" />
                <div className="flex gap-2">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{NOTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={() => { if (noteContent.trim()) addNoteMutation.mutate(); }} disabled={!noteContent.trim() || addNoteMutation.isPending} data-testid="button-add-note">
                    <Plus size={14} className="mr-1" />إضافة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8"><MessageSquare size={28} className="mx-auto mb-2 opacity-30" /><p>لا توجد ملاحظات بعد</p></div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => {
                  const cfg = NOTE_TYPES.find(t => t.value === note.type);
                  return (
                    <Card key={note.id} className="overflow-hidden" data-testid={`note-${note.id}`}>
                      <div className={`h-1 ${note.type === "behavioral" ? "bg-amber-400" : note.type === "academic" ? "bg-emerald-400" : note.type === "positive" ? "bg-violet-400" : "bg-blue-400"}`} />
                      <CardContent className="p-4 flex gap-3">
                        <div className="flex-1">
                          <p className="text-sm">{note.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg?.color}`}>{cfg?.label}</span>
                            <span className="text-xs text-muted-foreground">{note.createdAt ? new Date(note.createdAt).toLocaleDateString("ar-EG") : ""}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0 flex-shrink-0"
                          onClick={() => deleteNoteMutation.mutate(note.id)} data-testid={`button-delete-note-${note.id}`}><Trash2 size={12} /></Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
