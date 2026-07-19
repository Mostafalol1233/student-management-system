import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSessionSchema, type Session, type InsertSession, type Group, type Teacher } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarPlus, Play, StopCircle, CheckCircle2, Calendar, XCircle, Clock, Users, Edit, Trash2, Save } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  scheduled: { label: "مجدولة",  cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",     icon: Calendar },
  active:    { label: "نشطة",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400", icon: Play },
  completed: { label: "مكتملة",  cls: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",        icon: CheckCircle2 },
  cancelled: { label: "ملغاة",   cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400",           icon: XCircle },
};

export default function SessionManagement() {
  const { toast } = useToast();
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Session>>({});

  const { data: sessions = [], isLoading } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: activeSession } = useQuery<Session | null>({ queryKey: ["/api/sessions/active"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      name: "", date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5), duration: 60,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSession) => (await apiRequest("POST", "/api/sessions", data)).json(),
    onSuccess: (s: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      form.reset({ name: "", date: new Date().toISOString().split("T")[0], time: new Date().toTimeString().slice(0, 5), duration: 60 });
      toast({ title: `✅ تم إنشاء الحصة: ${s.name}` });
    },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Session> }) =>
      (await apiRequest("PUT", `/api/sessions/${id}`, updates)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      setEditOpen(false);
      setEditingSession(null);
      toast({ title: "✅ تم تحديث الحصة" });
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      toast({ title: "✅ تم حذف الحصة" });
    },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const setStatus = (session: Session, status: string) => {
    if (status === "active" && activeSession && activeSession.id !== session.id) {
      updateMutation.mutate({ id: activeSession.id, updates: { status: "completed" } });
    }
    updateMutation.mutate({ id: session.id, updates: { status } });
  };

  const openEdit = (s: Session) => {
    setEditingSession(s);
    setEditForm({ ...s });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSession) return;
    const { name, date, time, duration, groupId, teacherId } = editForm as any;
    updateMutation.mutate({ id: editingSession.id, updates: { name, date, time, duration: Number(duration), groupId: groupId || null, teacherId: teacherId || null } });
  };

  const formatDuration = (min: number) => min >= 60 ? `${Math.floor(min / 60)}س ${min % 60 > 0 ? `${min % 60}د` : ""}` : `${min}د`;

  const byStatus = (status: string) => sessions.filter(s => s.status === status);
  const stats = [
    { label: "مجدولة",  value: byStatus("scheduled").length, icon: Calendar,    cls: "text-blue-600"    },
    { label: "نشطة",    value: byStatus("active").length,    icon: Play,         cls: "text-emerald-600" },
    { label: "مكتملة",  value: byStatus("completed").length, icon: CheckCircle2, cls: "text-gray-500"    },
    { label: "ملغاة",   value: byStatus("cancelled").length, icon: XCircle,      cls: "text-red-500"     },
  ];

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditingSession(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تعديل الحصة</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">اسم الحصة *</Label>
              <Input className="h-8 text-sm" value={editForm.name || ""}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                placeholder="مثال: رياضيات — الصف الثالث" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">التاريخ *</Label>
                <Input type="date" className="h-8 text-sm" value={editForm.date || ""}
                  onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">الوقت *</Label>
                <Input type="time" className="h-8 text-sm" value={editForm.time || ""}
                  onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">المدة (دقيقة)</Label>
              <Input type="number" min="15" max="300" className="h-8 text-sm" value={editForm.duration ?? 60}
                onChange={e => setEditForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">المجموعة</Label>
              <Select value={editForm.groupId || ""} onValueChange={v => setEditForm(p => ({ ...p, groupId: v || null }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر مجموعة (اختياري)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— بدون مجموعة —</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">المدرس</Label>
              <Select value={editForm.teacherId || ""} onValueChange={v => setEditForm(p => ({ ...p, teacherId: v || null }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر مدرساً (اختياري)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— بدون مدرس —</SelectItem>
                  {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editForm.name || !editForm.date || !editForm.time}>
              <Save size={14} className="mr-2" />
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <s.icon size={16} className={s.cls} />
            <div><div className="text-lg font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Active session banner */}
      {activeSession && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300">{activeSession.name}</div>
            <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70">{activeSession.date} · {activeSession.time} · {formatDuration(activeSession.duration)}</div>
          </div>
          <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700"
            onClick={() => setStatus(activeSession, "completed")}
            data-testid="button-end-session">
            <StopCircle size={13} className="mr-1" />إنهاء الحصة
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <CalendarPlus size={15} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">حصة جديدة</h3>
          </div>
          <CardContent className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم الحصة *</FormLabel>
                    <FormControl><Input placeholder="مثال: رياضيات — الصف الثالث" data-testid="input-session-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>التاريخ *</FormLabel>
                      <FormControl><Input type="date" data-testid="input-session-date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem><FormLabel>الوقت *</FormLabel>
                      <FormControl><Input type="time" data-testid="input-session-time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>المدة (دقيقة)</FormLabel>
                    <FormControl><Input type="number" min="15" max="300" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 60)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="groupId" render={({ field }) => (
                  <FormItem><FormLabel>المجموعة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر مجموعة (اختياري)" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="teacherId" render={({ field }) => (
                  <FormItem><FormLabel>المدرس</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر مدرساً (اختياري)" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-create-session">
                  <CalendarPlus size={14} className="mr-2" />
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحصة"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sessions list */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">جميع الحصص</h3>
              <Badge variant="outline">{sessions.length} حصة</Badge>
            </div>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
              ) : sessions.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Calendar size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد حصص بعد</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">الحصة</TableHead>
                      <TableHead className="text-xs">التاريخ والوقت</TableHead>
                      <TableHead className="text-xs">المدة</TableHead>
                      <TableHead className="text-xs">الحالة</TableHead>
                      <TableHead className="text-xs">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.sort((a, b) => b.date.localeCompare(a.date)).map(session => {
                      const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
                      const Icon = cfg.icon;
                      const teacher = teachers.find(t => t.id === session.teacherId);
                      const group = groups.find(g => g.id === session.groupId);
                      return (
                        <TableRow key={session.id} data-testid={`session-row-${session.id}`} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="font-medium text-sm">{session.name}</div>
                            {(teacher || group) && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {teacher && <span>أ. {teacher.name}</span>}
                                {teacher && group && " · "}
                                {group && <span>{group.name}</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {session.date}<br />{session.time}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatDuration(session.duration)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
                              <Icon size={10} />{cfg.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-0.5 flex-wrap">
                              {session.status === "scheduled" && (
                                <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => setStatus(session, "active")} data-testid={`button-start-session-${session.id}`}>
                                  <Play size={11} className="mr-1" />بدء
                                </Button>
                              )}
                              {session.status === "active" && (
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  onClick={() => setStatus(session, "completed")} data-testid={`button-complete-session-${session.id}`}>
                                  <CheckCircle2 size={11} className="mr-1" />إنهاء
                                </Button>
                              )}
                              {/* Edit — always available except completed */}
                              {session.status !== "completed" && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700"
                                  onClick={() => openEdit(session)} title="تعديل الحصة"
                                  data-testid={`button-edit-session-${session.id}`}>
                                  <Edit size={12} />
                                </Button>
                              )}
                              {/* Cancel (scheduled/active) */}
                              {(session.status === "scheduled" || session.status === "active") && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => setStatus(session, "cancelled")} data-testid={`button-cancel-session-${session.id}`}>
                                  <XCircle size={12} />
                                </Button>
                              )}
                              {/* Reschedule cancelled → opens edit dialog with new date */}
                              {session.status === "cancelled" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-500 px-2"
                                  onClick={() => openEdit(session)} title="إعادة جدولة"
                                  data-testid={`button-reschedule-session-${session.id}`}>
                                  <Calendar size={11} className="mr-1" />إعادة جدولة
                                </Button>
                              )}
                              {/* Delete — cancelled or completed */}
                              {(session.status === "cancelled" || session.status === "completed") && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => { if (confirm(`حذف الحصة "${session.name}"؟`)) deleteMutation.mutate(session.id); }}
                                  data-testid={`button-delete-session-${session.id}`}>
                                  <Trash2 size={12} />
                                </Button>
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
        </div>
      </div>
    </div>
  );
}
