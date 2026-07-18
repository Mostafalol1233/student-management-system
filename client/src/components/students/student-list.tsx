import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, FileText, QrCode, Edit, Trash2, Download, User, Eye, Save } from "lucide-react";
import QRGenerator, { QRGeneratorRef } from "@/components/ui/qr-generator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

const GRADES = ["الصف الأول","الصف الثاني","الصف الثالث","الصف الرابع","الصف الخامس","الصف السادس","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SECTIONS = ["A","B","C","D","E"];

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const qrRef = useRef<QRGeneratorRef>(null);
  const { toast } = useToast();

  const { data: students = [], isLoading } = useQuery<Student[]>({ queryKey: ["/api/students"] });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "✅ تم حذف الطالب" });
    },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) =>
      (await apiRequest("PUT", `/api/students/${id}`, data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setEditOpen(false);
      setEditingStudent(null);
      toast({ title: "✅ تم تحديث بيانات الطالب" });
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.includes(searchTerm) ||
    s.guardianPhone.includes(searchTerm) ||
    (s.guardianPhone2 && s.guardianPhone2.includes(searchTerm)) ||
    (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setEditForm({ ...s });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingStudent) return;
    updateStudentMutation.mutate({ id: editingStudent.id, data: editForm });
  };

  const field = (key: keyof Student, label: string, opts?: { type?: string; placeholder?: string; required?: boolean }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{opts?.required && " *"}</Label>
      <Input
        type={opts?.type || "text"}
        placeholder={opts?.placeholder}
        value={(editForm[key] as string) ?? ""}
        onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
        className="h-8 text-sm"
      />
    </div>
  );

  const exportCSV = () => {
    const csv = "الاسم,الكود,هاتف ولي الأمر,هاتف 2,العنوان,الصف,الشعبة,الحالة\n" +
      filteredStudents.map(s =>
        `"${s.name}","${s.code}","${s.guardianPhone}","${s.guardianPhone2||""}","${s.address||""}","${s.gradeLevel}","${s.section}","${s.status}"`
      ).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `students_${new Date().toISOString().split("T")[0]}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "✅ تم تصدير الطلاب", description: `${filteredStudents.length} طالب` });
  };

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditingStudent(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {field("name", "الاسم الكامل", { required: true, placeholder: "اسم الطالب" })}
            {field("code", "كود الطالب", { required: true, placeholder: "STU001" })}
            <div className="grid grid-cols-2 gap-3">
              {field("guardianPhone", "هاتف ولي الأمر", { required: true, placeholder: "01xxxxxxxxx" })}
              {field("guardianPhone2", "هاتف ثانوي", { placeholder: "01xxxxxxxxx" })}
            </div>
            {field("address", "العنوان", { placeholder: "عنوان الطالب" })}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الصف *</Label>
                <Select value={editForm.gradeLevel || ""} onValueChange={v => setEditForm(p => ({ ...p, gradeLevel: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                  <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الشعبة *</Label>
                <Select value={editForm.section || ""} onValueChange={v => setEditForm(p => ({ ...p, section: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الحالة</Label>
              <Select value={editForm.status || "active"} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleSaveEdit}
              disabled={updateStudentMutation.isPending || !editForm.name || !editForm.code}
              data-testid="button-save-edit-student"
            >
              <Save size={14} className="mr-2" />
              {updateStudentMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold">قائمة الطلاب</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="بحث بالاسم أو الكود أو الهاتف..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pr-4 pl-10 h-8 text-sm w-56"
                  data-testid="input-search-students"
                />
                <Search className="absolute left-3 top-2 text-muted-foreground" size={15} />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-students">
                <FileText size={14} className="mr-1.5" />
                تصدير CSV
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">جاري التحميل...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد طلاب مسجلون بعد"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">الطالب</TableHead>
                    <TableHead className="text-xs">الكود</TableHead>
                    <TableHead className="text-xs">هاتف ولي الأمر</TableHead>
                    <TableHead className="text-xs">العنوان</TableHead>
                    <TableHead className="text-xs">الصف</TableHead>
                    <TableHead className="text-xs">الحالة</TableHead>
                    <TableHead className="text-xs">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-muted/30" data-testid={`row-student-${student.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium" data-testid={`text-student-name-${student.id}`}>{student.name}</div>
                            <div className="text-xs text-muted-foreground">STU-{student.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded" data-testid={`text-student-code-${student.id}`}>
                          {student.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-guardian-phone-${student.id}`}>
                        <div className="font-mono text-xs">{student.guardianPhone}</div>
                        {student.guardianPhone2 && (
                          <div className="text-xs text-muted-foreground font-mono">{student.guardianPhone2}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate" data-testid={`text-student-address-${student.id}`}>
                        {student.address || <span className="italic">—</span>}
                      </TableCell>
                      <TableCell className="text-xs" data-testid={`text-student-grade-${student.id}`}>
                        {student.gradeLevel} / {student.section}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            student.status === "active" ? "status-active" :
                            student.status === "suspended" ? "status-overdue" : "status-warning"
                          }`}
                          data-testid={`badge-student-status-${student.id}`}
                        >
                          {student.status === "active" ? "نشط" : student.status === "suspended" ? "موقوف" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {/* QR */}
                          <Dialog open={qrModalOpen && selectedStudentForQR?.id === student.id} onOpenChange={open => { if (!open) { setQrModalOpen(false); setSelectedStudentForQR(null); } }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-qr-${student.id}`}
                                onClick={() => { setSelectedStudentForQR(student); setQrModalOpen(true); }}>
                                <QrCode size={14} className="text-primary" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader><DialogTitle className="text-center">QR — {student.name}</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div className="flex justify-center">
                                  {selectedStudentForQR && (
                                    <QRGenerator ref={qrRef} value={selectedStudentForQR.code} size={200}
                                      studentName={selectedStudentForQR.name}
                                      onRegenerate={() => toast({ title: "تم إعادة إنتاج QR" })} />
                                  )}
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-primary">{selectedStudentForQR?.code}</div>
                                  <p className="text-xs text-muted-foreground mt-1">كود الطالب الفريد</p>
                                </div>
                                <Button className="w-full" onClick={() => { qrRef.current?.downloadQR(); toast({ title: "تم تحميل QR" }); }}>
                                  <Download size={14} className="mr-2" />تحميل QR
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Profile */}
                          <Link href={`/student/${student.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-view-${student.id}`} title="ملف الطالب">
                              <Eye size={14} className="text-primary" />
                            </Button>
                          </Link>

                          {/* Comprehensive */}
                          <Link href={`/student-comprehensive/${student.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-comprehensive-${student.id}`} title="الملف الشامل">
                              <User size={14} className="text-emerald-600" />
                            </Button>
                          </Link>

                          {/* Edit */}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-edit-${student.id}`}
                            title="تعديل" onClick={() => openEdit(student)}>
                            <Edit size={14} className="text-amber-600" />
                          </Button>

                          {/* Delete */}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            data-testid={`button-delete-${student.id}`}
                            onClick={() => { if (confirm(`حذف الطالب "${student.name}"؟ لا يمكن التراجع.`)) deleteStudentMutation.mutate(student.id); }}
                            disabled={deleteStudentMutation.isPending}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredStudents.length > 0 && (
            <div className="px-5 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>عرض {filteredStudents.length} من {students.length} طالب</span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
