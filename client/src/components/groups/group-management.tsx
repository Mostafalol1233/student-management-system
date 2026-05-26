import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGroupSchema, type Group, type InsertGroup, type Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Users, Plus, BookOpen } from "lucide-react";

const GRADES = ["الصف الأول","الصف الثاني","الصف الثالث","الصف الرابع","الصف الخامس","الصف السادس","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SECTIONS = ["A","B","C","D","E"];
const COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];

export default function GroupManagement() {
  const { toast } = useToast();
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema),
    defaultValues: { name: "", gradeLevel: "", section: "A", subject: "", description: "", color: "#3b82f6" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGroup) => (await apiRequest("POST", "/api/groups", data)).json(),
    onSuccess: (g: Group) => { queryClient.invalidateQueries({ queryKey: ["/api/groups"] }); form.reset({ name:"",gradeLevel:"",section:"A",subject:"",description:"",color:"#3b82f6" }); toast({ title: `✅ تم إنشاء المجموعة: ${g.name}` }); },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/groups/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/groups"] }); toast({ title: "✅ تم حذف المجموعة" }); },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ studentId, groupId }: { studentId: string; groupId: string | null }) =>
      (await apiRequest("PUT", `/api/students/${studentId}`, { groupId })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/students"] }),
  });

  const getGroupStudents = (groupId: string) => students.filter(s => s.groupId === groupId);
  const unassigned = students.filter(s => !s.groupId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Plus size={16} className="text-muted-foreground" />
            <h3 className="font-semibold">مجموعة جديدة</h3>
          </div>
          <CardContent className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم المجموعة *</FormLabel><FormControl><Input placeholder="مثال: ثالثة ثانوي A" data-testid="input-group-name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="gradeLevel" render={({ field }) => (
                    <FormItem><FormLabel>الصف *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-group-grade"><SelectValue placeholder="اختر" /></SelectTrigger></FormControl>
                        <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="section" render={({ field }) => (
                    <FormItem><FormLabel>الشعبة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>المادة</FormLabel><FormControl><Input placeholder="مثال: الرياضيات" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <div>
                  <FormLabel className="text-sm font-medium">لون المجموعة</FormLabel>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => form.setValue("color", c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.watch("color") === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-create-group">
                  <Plus size={14} className="mr-2" />{createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المجموعة"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Groups List */}
        <div className="lg:col-span-2 space-y-4">
          {groups.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground"><BookOpen size={40} className="mx-auto mb-3 opacity-30" /><p>لا توجد مجموعات بعد</p></CardContent></Card>
          ) : groups.map(group => {
            const groupStudents = getGroupStudents(group.id);
            return (
              <Card key={group.id} className="overflow-hidden" data-testid={`group-card-${group.id}`}>
                <div className="h-1" style={{ backgroundColor: group.color || "#3b82f6" }} />
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: group.color || "#3b82f6" }}>
                      {group.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold" data-testid={`text-group-name-${group.id}`}>{group.name}</div>
                      <div className="text-xs text-muted-foreground">{group.gradeLevel} - {group.section}{group.subject ? ` · ${group.subject}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary"><Users size={11} className="mr-1" />{groupStudents.length} طالب</Badge>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`حذف مجموعة ${group.name}?`)) deleteMutation.mutate(group.id); }}
                      data-testid={`button-delete-group-${group.id}`}><Trash2 size={13} /></Button>
                  </div>
                </div>
                {groupStudents.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {groupStudents.map(s => (
                        <div key={s.id} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-xs">
                          <span>{s.name}</span>
                          <button onClick={() => assignMutation.mutate({ studentId: s.id, groupId: null })} className="text-muted-foreground hover:text-destructive ml-1">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Unassigned Students */}
          {unassigned.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <Users size={15} className="text-muted-foreground" />
                <h3 className="font-semibold text-sm">طلاب بدون مجموعة</h3>
                <Badge variant="outline">{unassigned.length}</Badge>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {unassigned.map(s => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="flex-1 text-sm">{s.name} <span className="text-muted-foreground text-xs">({s.code})</span></div>
                      <Select onValueChange={gId => assignMutation.mutate({ studentId: s.id, groupId: gId })}>
                        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="إضافة لمجموعة" /></SelectTrigger>
                        <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
