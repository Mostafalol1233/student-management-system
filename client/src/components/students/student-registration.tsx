import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type Student, type InsertStudent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QRGenerator, { QRGeneratorRef } from "@/components/ui/qr-generator";
import { Plus, Download, Upload, FileText, AlertCircle, CheckCircle, Search, Trash2, Eye, Users, UserPlus, Printer, GraduationCap } from "lucide-react";

const GRADES = ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SECTIONS = ["A", "B", "C", "D", "E"];

function StudentIDCard({ student }: { student: Student }) {
  const qrRef = useRef<QRGeneratorRef>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Printable card */}
      <div id="student-id-card" className="flex items-center justify-center">
        <div
          className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          style={{ width: 320, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          {/* Card header stripe */}
          <div className="h-2 bg-primary w-full" />

          {/* Card body */}
          <div className="px-6 py-5 flex flex-col items-center gap-4">
            {/* School name */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GraduationCap size={13} />
              <span className="text-xs font-medium tracking-wide uppercase">نظام المدرسة</span>
            </div>

            {/* Student name */}
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 leading-snug">{student.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{student.gradeLevel} — {student.section}</div>
            </div>

            {/* QR code */}
            <div className="p-2 border border-gray-100 rounded-lg bg-white">
              <QRGenerator ref={qrRef} value={student.code} size={130} studentName={student.name} />
            </div>

            {/* Student ID */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Student ID</span>
              <span className="text-base font-bold font-mono tracking-widest text-gray-900">
                {student.code}
              </span>
            </div>

            {/* Guardian phone */}
            <div className="w-full flex items-center justify-between text-xs text-gray-400">
              <span>ولي الأمر</span>
              <span className="font-mono">{student.guardianPhone}</span>
            </div>
          </div>

          {/* Card footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-2 text-center">
            <span className="text-[10px] text-gray-400 tracking-wider">STUDENT ACCESS CARD</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 w-full">
        <Button variant="outline" className="flex-1" onClick={handlePrint} data-testid="button-print-card">
          <Printer size={14} className="mr-2" />
          طباعة البطاقة
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => { qrRef.current?.downloadQR(); }}
          data-testid="button-download-qr">
          <Download size={14} className="mr-2" />
          تحميل QR
        </Button>
      </div>
    </div>
  );
}

export default function StudentRegistration() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [bulkImportResults, setBulkImportResults] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: students = [], isLoading } = useQuery<Student[]>({ queryKey: ["/api/students"] });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: { name: "", guardianPhone: "", guardianPhone2: undefined, address: undefined, gradeLevel: "", section: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => (await apiRequest("POST", "/api/students", data)).json(),
    onSuccess: (student: Student) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      form.reset();
      setSelectedStudent(student);
      toast({ title: "تم تسجيل الطالب", description: `${student.name} — الكود: ${student.code}` });
    },
    onError: (e: any) => toast({ title: "فشل التسجيل", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "تم حذف الطالب" });
    },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const bulkMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("csvFile", file);
      const r = await fetch("/api/students/bulk-import", { method: "POST", body: fd });
      if (!r.ok) throw new Error((await r.json()).message);
      return r.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setBulkImportResults(result);
      toast({ title: "تم الاستيراد الجماعي", description: `${result.successCount} طالب — ${result.errorCount} أخطاء` });
    },
    onError: (e: any) => toast({ title: "فشل الاستيراد", description: e.message, variant: "destructive" }),
  });

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.includes(search);
    const matchGrade = gradeFilter === "all" || s.gradeLevel === gradeFilter;
    return matchSearch && matchGrade;
  });

  const downloadSampleCSV = () => {
    const csv = `name,guardian phone,guardian phone 2,address,grade,section\nأحمد محمد,+201234567890,+201987654321,القاهرة,Grade 10,A\nفاطمة علي,+201555666777,,الإسكندرية,Grade 11,B`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "student_template.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast({ title: "نوع ملف غير صحيح", description: "يرجى اختيار ملف CSV", variant: "destructive" });
      return;
    }
    bulkMutation.mutate(file);
  };

  const uniqueGrades = Array.from(new Set(students.map(s => s.gradeLevel)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Area */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="individual">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="individual" data-testid="tab-individual">
                <UserPlus size={13} className="mr-2" />
                تسجيل فردي
              </TabsTrigger>
              <TabsTrigger value="bulk" data-testid="tab-bulk">
                <Upload size={13} className="mr-2" />
                استيراد جماعي
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
                    <UserPlus size={14} className="text-muted-foreground" />
                    تسجيل طالب جديد
                  </h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل *</FormLabel>
                            <FormControl>
                              <Input placeholder="أحمد محمد علي" data-testid="input-student-name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div>
                          <Label className="text-sm font-medium">كود الطالب</Label>
                          <Input
                            value={selectedStudent ? `STU-${selectedStudent.code}` : "يتم توليده تلقائياً"}
                            readOnly className="bg-muted text-muted-foreground mt-1.5 font-mono" data-testid="display-student-id"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>هاتف ولي الأمر *</FormLabel>
                            <FormControl>
                              <Input placeholder="+201234567890" type="tel" data-testid="input-guardian-phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="guardianPhone2" render={({ field }) => (
                          <FormItem>
                            <FormLabel>هاتف ثانٍ (اختياري)</FormLabel>
                            <FormControl>
                              <Input placeholder="+201234567890" type="tel" data-testid="input-guardian-phone2" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان (اختياري)</FormLabel>
                          <FormControl>
                            <Input placeholder="القاهرة، مصر الجديدة" data-testid="input-address" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="gradeLevel" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الصف الدراسي *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-grade-level">
                                  <SelectValue placeholder="اختر الصف" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="section" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الشعبة *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-section">
                                  <SelectValue placeholder="اختر الشعبة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" onClick={() => { form.reset(); setSelectedStudent(null); }} data-testid="button-clear-form">
                          مسح
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending} className="flex-1" data-testid="button-register-student">
                          <Plus size={14} className="mr-2" />
                          {createMutation.isPending ? "جاري التسجيل..." : "تسجيل الطالب"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card>
                <CardContent className="p-6 space-y-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Upload size={14} className="text-muted-foreground" />
                    استيراد طلاب من CSV
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ارفع ملف CSV يحتوي على بيانات الطلاب. يجب أن يشمل الأعمدة: الاسم، هاتف ولي الأمر، الصف، والشعبة.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={downloadSampleCSV} data-testid="button-download-sample">
                      <FileText size={13} className="mr-2" />
                      تحميل نموذج CSV
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={bulkMutation.isPending} data-testid="button-upload-csv">
                      <Upload size={13} className="mr-2" />
                      {bulkMutation.isPending ? "جاري المعالجة..." : "رفع ملف CSV"}
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  {bulkImportResults && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sm">نتائج الاستيراد</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <CheckCircle size={14} className="text-emerald-600" />
                          <span className="text-sm"><span className="font-bold text-emerald-700 dark:text-emerald-400">{bulkImportResults.successCount}</span> تم استيرادهم</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <AlertCircle size={14} className="text-red-600" />
                          <span className="text-sm"><span className="font-bold text-red-700 dark:text-red-400">{bulkImportResults.errorCount}</span> أخطاء</span>
                        </div>
                      </div>
                      {bulkImportResults.errors?.length > 0 && (
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {bulkImportResults.errors.map((e: any, i: number) => (
                            <div key={i} className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                              الصف {e.row}: {e.error}
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setBulkImportResults(null)}>مسح النتائج</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Student ID Card Panel */}
        <div className="bg-card rounded-lg border p-5 flex flex-col">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <GraduationCap size={14} className="text-muted-foreground" />
            بطاقة الطالب
          </h3>
          {selectedStudent ? (
            <StudentIDCard student={selectedStudent} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
              <div className="w-16 h-20 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <GraduationCap size={22} className="text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">لم يتم اختيار طالب</p>
                <p className="text-xs text-muted-foreground/60 mt-1">سجّل طالباً جديداً أو اختر طالباً من القائمة</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Users size={15} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">قائمة الطلاب</h3>
            <Badge variant="secondary">{students.length}</Badge>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الكود..."
                className="pl-8 h-8 text-sm w-48"
                data-testid="input-search-students"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-filter-grade">
                <SelectValue placeholder="كل الصفوف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الصفوف</SelectItem>
                {uniqueGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Users size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">{search ? "لا توجد نتائج" : "لم يتم تسجيل طلاب بعد"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">الطالب</TableHead>
                    <TableHead className="text-xs">الكود</TableHead>
                    <TableHead className="text-xs">الصف / الشعبة</TableHead>
                    <TableHead className="text-xs">هاتف ولي الأمر</TableHead>
                    <TableHead className="text-xs">الحالة</TableHead>
                    <TableHead className="text-xs text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/20" data-testid={`row-student-${student.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-foreground text-xs font-semibold">{student.name.slice(0, 1)}</span>
                          </div>
                          <span className="font-medium text-sm" data-testid={`text-student-name-${student.id}`}>{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs" data-testid={`text-student-code-${student.id}`}>{student.code}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.gradeLevel} - {student.section}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{student.guardianPhone}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "secondary" : "outline"} className="text-xs">
                          {student.status === "active" ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(student)}
                            title="عرض البطاقة" data-testid={`button-view-card-${student.id}`}>
                            <Eye size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`حذف الطالب ${student.name}?`)) deleteMutation.mutate(student.id); }}
                            data-testid={`button-delete-${student.id}`}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
