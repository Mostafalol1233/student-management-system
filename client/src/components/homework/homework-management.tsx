import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHomeworkSchema, type Homework, type InsertHomework, type Student, type Group, type HomeworkSubmission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Plus, Trash2, Check, Clock, AlertTriangle, Edit, Save } from "lucide-react";

const SUBJECTS = ["الرياضيات","الفيزياء","الكيمياء","الأحياء","اللغة العربية","اللغة الإنجليزية","التاريخ","الجغرافيا","الحاسوب","العلوم","Mathematics","Physics","English","Science"];

export default function HomeworkManagement() {
  const { toast } = useToast();
  const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [editForm, setEditForm] = useState<Partial<Homework>>({});

  const { data: homework = [] } = useQuery<Homework[]>({ queryKey: ["/api/homework"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });
  const { data: submissions = [] } = useQuery<HomeworkSubmission[]>({ queryKey: ["/api/homework/submissions"] });

  const form = useForm<InsertHomework>({
    resolver: zodResolver(insertHomeworkSchema),
    defaultValues: { title: "", description: "", subject: "", groupId: "", deadline: new Date().toISOString().split("T")[0], totalMarks: 10 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHomework) => (await apiRequest("POST", "/api/homework", data)).json(),
    onSuccess: (hw: Homework) => {
      queryClient.invalidateQueries({ queryKey: ["/api/homework"] });
      form.reset({ title:"",description:"",subject:"",groupId:"",deadline:new Date().toISOString().split("T")[0],totalMarks:10 });
      toast({ title: `✅ تم إنشاء الواجب: ${hw.title}` });
    },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Homework> }) =>
      (await apiRequest("PUT", `/api/homework/${id}`, updates)).json(),
    onSuccess: (updated: Homework) => {
      queryClient.invalidateQueries({ queryKey: ["/api/homework"] });
      setEditingHw(null);
      if (selectedHw?.id === updated.id) setSelectedHw(updated);
      toast({ title: "✅ تم تحديث الواجب" });
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/homework/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homework"] });
      setSelectedHw(null);
      toast({ title: "✅ تم حذف الواجب" });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ studentId, homeworkId, score, status }: any) =>
      (await apiRequest("POST", "/api/homework/submissions", { studentId, homeworkId, score, status })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/homework/submissions"] }); toast({ title: "✅ تم حفظ الدرجة" }); },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => (await apiRequest("PUT", `/api/homework/submissions/${id}`, updates)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/homework/submissions"] }); toast({ title: "✅ تم تحديث الدرجة" }); },
  });

  const getHwSubmissions = (hwId: string) => submissions.filter(s => s.homeworkId === hwId);
  const getStudentSubmission = (hwId: string, studentId: string) => submissions.find(s => s.homeworkId === hwId && s.studentId === studentId);
  const isOverdue = (deadline: string) => new Date(deadline) < new Date();
  const daysLeft = (deadline: string) => Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);

  const hwStudents = selectedHw ? (selectedHw.groupId && selectedHw.groupId !== "all" ? students.filter(s => s.groupId === selectedHw.groupId) : students) : [];
  const hwSubmissions = selectedHw ? getHwSubmissions(selectedHw.id) : [];
  const submittedCount = hwSubmissions.filter(s => s.status !== "pending").length;
  const completionPct = hwStudents.length > 0 ? Math.round((submittedCount / hwStudents.length) * 100) : 0;

  const openEdit = (hw: Homework) => {
    setEditingHw(hw);
    setEditForm({ title: hw.title, subject: hw.subject, groupId: hw.groupId, deadline: hw.deadline, totalMarks: hw.totalMarks, description: hw.description });
  };

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      <Dialog open={!!editingHw} onOpenChange={o => { if (!o) setEditingHw(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تعديل الواجب</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label className="text-xs">عنوان الواجب *</Label>
              <Input className="h-8 text-sm" value={editForm.title || ""} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">المادة *</Label>
              <Select value={editForm.subject || ""} onValueChange={v => setEditForm(p => ({ ...p, subject: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">المجموعة</Label>
              <Select value={editForm.groupId || "all"} onValueChange={v => setEditForm(p => ({ ...p, groupId: v === "all" ? "" : v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الطلاب</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">الموعد النهائي</Label>
                <Input type="date" className="h-8 text-sm" value={editForm.deadline || ""} onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="space-y-1.5"><Label className="text-xs">الدرجة الكلية</Label>
                <Input type="number" min="1" className="h-8 text-sm" value={editForm.totalMarks ?? 10}
                  onChange={e => setEditForm(p => ({ ...p, totalMarks: parseInt(e.target.value) || 10 }))} />
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">التفاصيل</Label>
              <Textarea className="text-sm min-h-[60px]" value={editForm.description || ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <Button className="w-full" disabled={updateMutation.isPending || !editForm.title || !editForm.subject}
              onClick={() => editingHw && updateMutation.mutate({ id: editingHw.id, updates: editForm })}>
              <Save size={14} className="mr-2" />{updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Plus size={16} className="text-muted-foreground" /><h3 className="font-semibold">واجب جديد</h3>
          </div>
          <CardContent className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>عنوان الواجب *</FormLabel>
                    <FormControl><Input placeholder="مثال: حل تمارين الفصل الثالث" data-testid="input-hw-title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>المادة *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-hw-subject"><SelectValue placeholder="اختر المادة" /></SelectTrigger></FormControl>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="groupId" render={({ field }) => (
                  <FormItem><FormLabel>المجموعة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="كل الطلاب" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="all">كل الطلاب</SelectItem>
                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="deadline" render={({ field }) => (
                    <FormItem><FormLabel>الموعد النهائي *</FormLabel>
                      <FormControl><Input type="date" data-testid="input-hw-deadline" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalMarks" render={({ field }) => (
                    <FormItem><FormLabel>الدرجة الكلية</FormLabel>
                      <FormControl><Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value)||10)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>التفاصيل</FormLabel>
                    <FormControl><Textarea placeholder="وصف الواجب..." className="min-h-[70px]" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-create-hw">
                  <Plus size={14} className="mr-2" />{createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الواجب"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Homework List + Detail */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <BookOpen size={16} className="text-muted-foreground" /><h3 className="font-semibold">الواجبات</h3>
              <Badge variant="secondary">{homework.length}</Badge>
            </div>
            <CardContent className="p-0">
              {homework.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد واجبات بعد</p>
                </div>
              ) : (
                <div className="divide-y">
                  {[...homework].sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map(hw => {
                    const subs = getHwSubmissions(hw.id);
                    const days = daysLeft(hw.deadline);
                    const overdue = isOverdue(hw.deadline);
                    const group = groups.find(g => g.id === hw.groupId);
                    return (
                      <div key={hw.id} className={`px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors ${selectedHw?.id === hw.id ? "bg-primary/5" : ""}`}
                        data-testid={`hw-row-${hw.id}`}>
                        {/* Status icon — click to select */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer ${overdue ? "bg-red-100 dark:bg-red-900/30" : days <= 2 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}
                          onClick={() => setSelectedHw(hw === selectedHw ? null : hw)}>
                          {overdue ? <AlertTriangle size={16} className="text-red-600" /> : <Clock size={16} className={days <= 2 ? "text-amber-600" : "text-blue-600"} />}
                        </div>

                        {/* Info — click to select */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedHw(hw === selectedHw ? null : hw)}>
                          <div className="font-medium text-sm truncate">{hw.title}</div>
                          <div className="text-xs text-muted-foreground">{hw.subject}{group ? ` · ${group.name}` : ""}</div>
                        </div>

                        {/* Meta */}
                        <div className="text-right flex-shrink-0 cursor-pointer" onClick={() => setSelectedHw(hw === selectedHw ? null : hw)}>
                          <div className={`text-xs font-medium ${overdue ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {overdue ? "منتهي" : days === 0 ? "اليوم" : `${days} يوم`}
                          </div>
                          <div className="text-xs text-muted-foreground">{subs.length} تسليم</div>
                        </div>

                        {/* Actions */}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 flex-shrink-0"
                          onClick={e => { e.stopPropagation(); openEdit(hw); }}
                          data-testid={`button-edit-hw-${hw.id}`} title="تعديل الواجب">
                          <Edit size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive flex-shrink-0 h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); if (confirm("حذف هذا الواجب؟")) deleteMutation.mutate(hw.id); }}
                          data-testid={`button-delete-hw-${hw.id}`}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail / Grading Panel */}
          {selectedHw && (
            <Card>
              <div className="px-5 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedHw.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedHw.subject} · الموعد: {selectedHw.deadline} · الدرجة الكلية: {selectedHw.totalMarks}
                    </p>
                    {selectedHw.description && <p className="text-xs text-muted-foreground mt-1">{selectedHw.description}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{completionPct}%</div>
                    <div className="text-xs text-muted-foreground">{submittedCount}/{hwStudents.length} إنجاز</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              <CardContent className="p-0">
                {hwStudents.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">لا يوجد طلاب في هذه المجموعة</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>الطالب</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الدرجة</TableHead>
                        <TableHead>تصحيح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hwStudents.map(student => {
                        const sub = getStudentSubmission(selectedHw.id, student.id);
                        return (
                          <TableRow key={student.id} className="hover:bg-muted/30">
                            <TableCell className="text-sm font-medium">{student.name}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub?.status === "submitted" || sub?.status === "graded" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                                {sub?.status === "submitted" ? "مُسلَّم" : sub?.status === "graded" ? "مُصحَّح" : "لم يُسلَّم"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {sub?.score !== null && sub?.score !== undefined ? `${sub.score}/${selectedHw.totalMarks}` : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 items-center">
                                {!sub ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs"
                                    onClick={() => gradeMutation.mutate({ studentId: student.id, homeworkId: selectedHw.id, score: null, status: "submitted" })}>
                                    <Check size={11} className="mr-1" />تسليم
                                  </Button>
                                ) : (
                                  <Input type="number" placeholder="درجة" min="0" max={selectedHw.totalMarks}
                                    defaultValue={sub.score ?? ""}
                                    className="h-7 w-16 text-xs"
                                    onBlur={e => {
                                      const score = parseInt(e.target.value);
                                      if (!isNaN(score)) {
                                        if (sub.id) {
                                          updateSubmissionMutation.mutate({ id: sub.id, updates: { score, status: "graded" } });
                                        } else {
                                          gradeMutation.mutate({ studentId: student.id, homeworkId: selectedHw.id, score, status: "graded" });
                                        }
                                      }
                                    }}
                                  />
                                )}
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
          )}
        </div>
      </div>
    </div>
  );
}
