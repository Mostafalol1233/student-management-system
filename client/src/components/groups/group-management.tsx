import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGroupSchema, type Group, type InsertGroup, type Student, type Teacher } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Users, Plus, BookOpen, AlertTriangle, AlertCircle } from "lucide-react";

const GRADES = ["الصف الأول","الصف الثاني","الصف الثالث","الصف الرابع","الصف الخامس","الصف السادس","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SECTIONS = ["A","B","C","D","E"];
const COLORS = ["#6366f1","#10b981","#3b82f6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

function CapacityBar({ count, capacity }: { count: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((count / capacity) * 100, 100) : 0;
  const isNearFull = pct >= 70 && pct < 90;
  const isFull = pct >= 90;
  const color = isFull ? "bg-red-500" : isNearFull ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          {isFull && <AlertCircle size={11} className="text-red-500" />}
          {isNearFull && !isFull && <AlertTriangle size={11} className="text-amber-500" />}
          <span className="text-xs text-muted-foreground">{count}/{capacity} طالب</span>
        </div>
        <span className={`text-xs font-medium ${isFull ? "text-red-600" : isNearFull ? "text-amber-600" : "text-emerald-600"}`}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {isFull && <p className="text-[10px] text-red-600 mt-1">⚠ المجموعة ممتلئة — يُنصح بفتح مجموعة جديدة</p>}
      {isNearFull && !isFull && <p className="text-[10px] text-amber-600 mt-1">مقاعد قليلة متبقية</p>}
    </div>
  );
}

export default function GroupManagement() {
  const { toast } = useToast();
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [capValue, setCapValue] = useState(30);

  const { data: groups = [], isLoading } = useQuery<Group[]>({ queryKey: ["/api/groups"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema),
    defaultValues: { name: "", gradeLevel: "", section: "A", subject: "", description: "", color: "#6366f1", capacity: 30 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGroup) => (await apiRequest("POST", "/api/groups", data)).json(),
    onSuccess: (g: Group) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      form.reset({ name: "", gradeLevel: "", section: "A", subject: "", description: "", color: "#6366f1", capacity: 30 });
      toast({ title: `تم إنشاء المجموعة: ${g.name}` });
    },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Group> }) =>
      (await apiRequest("PUT", `/api/groups/${id}`, data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/groups"] }); setEditingCapacity(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/groups/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/groups"] }); toast({ title: "تم حذف المجموعة" }); },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ studentId, groupId }: { studentId: string; groupId: string | null }) =>
      (await apiRequest("PUT", `/api/students/${studentId}`, { groupId })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/students"] }),
  });

  const getGroupStudents = (groupId: string) => students.filter(s => s.groupId === groupId);
  const unassigned = students.filter(s => !s.groupId);

  const totalCapacity = groups.reduce((s, g) => s + (g.capacity || 30), 0);
  const totalStudents = students.length;
  const nearFullCount = groups.filter(g => {
    const count = getGroupStudents(g.id).length;
    const cap = g.capacity || 30;
    return count / cap >= 0.7;
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المجموعات", value: groups.length, icon: BookOpen },
          { label: "إجمالي الطاقة الاستيعابية", value: totalCapacity, icon: Users },
          { label: "مجموعات قاربت الامتلاء", value: nearFullCount, icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
              <s.icon size={15} className={s.label.includes("امتلاء") && nearFullCount > 0 ? "text-amber-500" : "text-muted-foreground"} />
            </div>
            <div>
              <div className={`text-xl font-bold ${s.label.includes("امتلاء") && nearFullCount > 0 ? "text-amber-600" : ""}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Plus size={15} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">مجموعة جديدة</h3>
          </div>
          <CardContent className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم المجموعة *</FormLabel>
                    <FormControl><Input placeholder="مثال: ثالثة ثانوي A" data-testid="input-group-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="gradeLevel" render={({ field }) => (
                    <FormItem><FormLabel>الصف *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-group-grade"><SelectValue placeholder="اختر" /></SelectTrigger></FormControl>
                        <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="section" render={({ field }) => (
                    <FormItem><FormLabel>الشعبة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>المادة</FormLabel>
                    <FormControl><Input placeholder="الرياضيات..." {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="teacherId" render={({ field }) => (
                  <FormItem><FormLabel>المدرس</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر مدرساً" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem><FormLabel>الطاقة الاستيعابية</FormLabel>
                    <FormControl><Input type="number" min="1" max="200" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 30)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div>
                  <FormLabel className="text-sm font-medium">اللون</FormLabel>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => form.setValue("color", c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.watch("color") === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-create-group">
                  <Plus size={14} className="mr-2" />
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المجموعة"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Groups list */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
          ) : groups.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">لا توجد مجموعات بعد</p>
            </CardContent></Card>
          ) : groups.map(group => {
            const groupStudents = getGroupStudents(group.id);
            const capacity = group.capacity || 30;
            const pct = (groupStudents.length / capacity) * 100;
            const isFull = pct >= 90;
            const isNearFull = pct >= 70 && !isFull;
            const teacher = teachers.find(t => t.id === group.teacherId);
            return (
              <Card key={group.id} className="overflow-hidden" data-testid={`group-card-${group.id}`}>
                <div className="h-1" style={{ backgroundColor: group.color || "#6366f1" }} />
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: group.color || "#6366f1" }}>
                        {group.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" data-testid={`text-group-name-${group.id}`}>{group.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.gradeLevel} - {group.section}
                          {group.subject && ` · ${group.subject}`}
                          {teacher && ` · أ. ${teacher.name}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFull && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">ممتلئة</Badge>}
                      {isNearFull && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">شبه ممتلئة</Badge>}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0"
                        onClick={() => { if (confirm(`حذف مجموعة ${group.name}?`)) deleteMutation.mutate(group.id); }}
                        data-testid={`button-delete-group-${group.id}`}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <CapacityBar count={groupStudents.length} capacity={capacity} />

                  {/* Students */}
                  {groupStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {groupStudents.map(s => (
                        <div key={s.id} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-lg text-xs">
                          <span>{s.name}</span>
                          <button onClick={() => assignMutation.mutate({ studentId: s.id, groupId: null })}
                            className="text-muted-foreground hover:text-destructive mr-0.5">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Unassigned students */}
          {unassigned.length > 0 && (
            <Card>
              <div className="px-5 py-3 border-b flex items-center gap-2">
                <Users size={14} className="text-muted-foreground" />
                <h3 className="font-semibold text-sm">طلاب بدون مجموعة</h3>
                <Badge variant="outline" className="text-xs">{unassigned.length}</Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                {unassigned.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="flex-1 text-sm">{s.name} <span className="text-muted-foreground text-xs">({s.code})</span></div>
                    <Select onValueChange={gId => assignMutation.mutate({ studentId: s.id, groupId: gId })}>
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="إضافة لمجموعة" /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => {
                          const count = getGroupStudents(g.id).length;
                          const cap = g.capacity || 30;
                          const full = count >= cap;
                          return (
                            <SelectItem key={g.id} value={g.id} disabled={full}>
                              {g.name} {full ? "(ممتلئة)" : `(${count}/${cap})`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
