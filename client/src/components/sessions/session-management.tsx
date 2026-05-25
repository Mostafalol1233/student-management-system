import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSessionSchema, type Session, type InsertSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarPlus, QrCode, StopCircle, Play, Clock, CheckCircle2, Calendar } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "مجدولة", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Calendar },
  active: { label: "نشطة", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Play },
  completed: { label: "مكتملة", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: CheckCircle2 },
};

export default function SessionManagement() {
  const { toast } = useToast();

  const { data: sessions = [] } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: activeSession } = useQuery<Session | null>({ queryKey: ["/api/sessions/active"] });

  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: 60,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSession) => (await apiRequest("POST", "/api/sessions", data)).json(),
    onSuccess: (session: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      form.reset({ name: "", date: new Date().toISOString().split("T")[0], time: new Date().toTimeString().slice(0, 5), duration: 60 });
      toast({ title: "✅ تم إنشاء الحصة", description: session.name });
    },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Session> }) =>
      (await apiRequest("PUT", `/api/sessions/${id}`, updates)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      toast({ title: "✅ تم تحديث الحصة" });
    },
  });

  const formatTime = (time: string) => {
    try {
      const [h, m] = time.split(":");
      const d = new Date();
      d.setHours(+h, +m);
      return d.toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch { return time; }
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  const completedCount = sessions.filter(s => s.status === "completed").length;
  const scheduledCount = sessions.filter(s => s.status === "scheduled").length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الحصص", value: sessions.length, color: "text-foreground" },
          { label: "مجدولة", value: scheduledCount, color: "text-blue-600" },
          { label: "مكتملة", value: completedCount, color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Form */}
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <CalendarPlus size={16} className="text-muted-foreground" />
            <h3 className="font-semibold">إنشاء حصة جديدة</h3>
          </div>
          <CardContent className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الحصة *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: الرياضيات - الفصل الثاني" data-testid="input-session-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>التاريخ *</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-session-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوقت *</FormLabel>
                      <FormControl>
                        <Input type="time" data-testid="input-session-time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدة (دقيقة) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" min="15" max="300" data-testid="input-session-duration"
                        {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
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

        {/* Active Session Card */}
        <Card className={activeSession ? "border-emerald-200 dark:border-emerald-800" : ""}>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">الحصة الحالية</h3>
            </div>
            {activeSession && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot"></span>
                نشطة
              </div>
            )}
          </div>
          <CardContent className="p-5">
            {activeSession ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="font-semibold text-lg" data-testid="text-active-session-name">{activeSession.name}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    <span>📅 {activeSession.date}</span>
                    <span>⏰ {formatTime(activeSession.time)}</span>
                    <span>⏱️ {activeSession.duration} دقيقة</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => updateMutation.mutate({ id: activeSession.id, updates: { status: "completed" } })}
                  disabled={updateMutation.isPending}
                  data-testid="button-end-session"
                >
                  <StopCircle size={14} className="mr-2" />
                  إنهاء الحصة
                </Button>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarPlus size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">لا توجد حصة نشطة</p>
                <p className="text-xs mt-1">أنشئ حصة وابدأها لتسجيل الحضور</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions History */}
      <Card>
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <h3 className="font-semibold">سجل الحصص</h3>
          <Badge variant="secondary">{sessions.length}</Badge>
        </div>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">لم يتم إنشاء حصص بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>الحصة</TableHead>
                    <TableHead>التاريخ والوقت</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSessions.map((session) => {
                    const cfg = statusConfig[session.status] || statusConfig.scheduled;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={session.id} className="hover:bg-muted/30" data-testid={`row-session-${session.id}`}>
                        <TableCell className="font-medium text-sm" data-testid={`text-session-name-${session.id}`}>
                          {session.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {session.date} · {formatTime(session.time)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {session.duration} دقيقة
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`} data-testid={`badge-session-status-${session.id}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {session.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => updateMutation.mutate({ id: session.id, updates: { status: "active" } })}
                              disabled={updateMutation.isPending || !!activeSession}
                              className="h-7 text-xs"
                              data-testid={`button-start-${session.id}`}
                            >
                              <Play size={12} className="mr-1" />
                              بدء
                            </Button>
                          )}
                          {session.status === "active" && (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => updateMutation.mutate({ id: session.id, updates: { status: "completed" } })}
                              disabled={updateMutation.isPending}
                              className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                              data-testid={`button-end-${session.id}`}
                            >
                              <StopCircle size={12} className="mr-1" />
                              إنهاء
                            </Button>
                          )}
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
