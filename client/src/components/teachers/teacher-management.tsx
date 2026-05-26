import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeacherSchema, type Teacher, type InsertTeacher, type Enrollment } from "@shared/schema";
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
import { Plus, Trash2, Edit, Users, Phone, BookOpen, DollarSign, Search } from "lucide-react";

const SALARY_TYPES = [
  { value: "fixed", label: "مرتب ثابت" },
  { value: "per_student", label: "نسبة لكل طالب" },
  { value: "percentage", label: "نسبة من الإيرادات" },
];

export default function TeacherManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
  const { data: enrollments = [] } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments"] });

  const form = useForm<InsertTeacher>({
    resolver: zodResolver(insertTeacherSchema),
    defaultValues: { name: "", subject: "", phone: "", email: "", salaryType: "fixed", salaryAmount: 0, notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTeacher) => (await apiRequest("POST", "/api/teachers", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      form.reset();
      setShowForm(false);
      toast({ title: "تم إضافة المدرس" });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      (await apiRequest("PUT", `/api/teachers/${id}`, data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setEditingTeacher(null);
      toast({ title: "تم تحديث بيانات المدرس" });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "تم حذف المدرس" });
    },
  });

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getStudentCount = (teacherId: string) =>
    enrollments.filter(e => e.teacherId === teacherId && e.status === "active").length;

  const getSalaryLabel = (type: string, amount: number) => {
    if (type === "fixed") return `${amount} ج / شهر`;
    if (type === "per_student") return `${amount} ج / طالب`;
    return `${amount}%`;
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.reset({
      name: teacher.name, subject: teacher.subject,
      phone: teacher.phone || "", email: teacher.email || "",
      salaryType: teacher.salaryType, salaryAmount: teacher.salaryAmount || 0,
      notes: teacher.notes || "",
    });
  };

  const handleSubmit = (data: InsertTeacher) => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const totalSalary = teachers.reduce((sum, t) => {
    if (t.salaryType === "fixed") return sum + (t.salaryAmount || 0);
    if (t.salaryType === "per_student") return sum + (t.salaryAmount || 0) * getStudentCount(t.id);
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المدرسين", value: teachers.length, icon: Users },
          { label: "إجمالي الطلاب", value: enrollments.filter(e => e.status === "active").length, icon: BookOpen },
          { label: "إجمالي المرتبات / شهر", value: `${totalSalary.toLocaleString()} ج`, icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
              <s.icon size={16} className="text-muted-foreground" />
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم المدرس أو المادة..." className="pl-8 h-8 text-sm" />
        </div>
        <Button onClick={() => { setEditingTeacher(null); form.reset({ name: "", subject: "", phone: "", email: "", salaryType: "fixed", salaryAmount: 0, notes: "" }); setShowForm(true); }} data-testid="button-add-teacher">
          <Plus size={14} className="mr-2" />
          إضافة مدرس
        </Button>
      </div>

      {/* Teachers table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
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
                  <TableHead className="text-xs">رقم الهاتف</TableHead>
                  <TableHead className="text-xs">الطلاب</TableHead>
                  <TableHead className="text-xs">المرتب</TableHead>
                  <TableHead className="text-xs">الحالة</TableHead>
                  <TableHead className="text-xs text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(teacher => (
                  <TableRow key={teacher.id} className="hover:bg-muted/20" data-testid={`row-teacher-${teacher.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary text-xs font-semibold">{teacher.name.slice(0, 1)}</span>
                        </div>
                        <span className="font-medium text-sm">{teacher.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{teacher.subject}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{teacher.phone || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{getStudentCount(teacher.id)}</span>
                      <span className="text-xs text-muted-foreground"> طالب</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getSalaryLabel(teacher.salaryType, teacher.salaryAmount || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === "active" ? "secondary" : "outline"} className="text-xs">
                        {teacher.status === "active" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { openEdit(teacher); setShowForm(true); }} data-testid={`button-edit-teacher-${teacher.id}`}>
                          <Edit size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm(`حذف ${teacher.name}?`)) deleteMutation.mutate(teacher.id); }}
                          data-testid={`button-delete-teacher-${teacher.id}`}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditingTeacher(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "تعديل بيانات المدرس" : "إضافة مدرس جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم *</FormLabel>
                    <FormControl><Input placeholder="اسم المدرس" {...field} data-testid="input-teacher-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المادة *</FormLabel>
                    <FormControl><Input placeholder="الرياضيات، الفيزياء..." {...field} data-testid="input-teacher-subject" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الهاتف</FormLabel>
                    <FormControl><Input placeholder="+201234567890" type="tel" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl><Input placeholder="teacher@school.com" type="email" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="salaryType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المرتب</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SALARY_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="salaryAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Input placeholder="ملاحظات اختيارية..." {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-teacher">
                  {editingTeacher ? "حفظ التعديلات" : "إضافة المدرس"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
