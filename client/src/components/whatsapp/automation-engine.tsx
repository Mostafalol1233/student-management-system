import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Zap, Plus, Trash2, Play, Pause, Edit, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, AlertCircle, Copy, Users, BookOpen, DollarSign, Star, QrCode, Calendar } from "lucide-react";
import type { Group } from "@shared/schema";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  triggerConfig: string | null;
  messageTemplate: string;
  targetGroup: string | null;
  status: string;
  runCount: number;
  lastRun: string | null;
  createdAt: string;
}

interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string | null;
  studentId: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
}

const TRIGGERS = [
  { value: "grade_added", label: "إضافة درجة", icon: Star, color: "text-amber-500", desc: "يُطلق عند تسجيل درجة جديدة لطالب" },
  { value: "low_grade", label: "درجة منخفضة", icon: AlertCircle, color: "text-red-500", desc: "يُطلق عند تسجيل درجة أقل من حدٍّ معين" },
  { value: "attendance_absent", label: "غياب الطالب", icon: QrCode, color: "text-orange-500", desc: "يُطلق عند تسجيل غياب الطالب عن الحصة" },
  { value: "payment_overdue", label: "متأخر في الدفع", icon: DollarSign, color: "text-red-500", desc: "يُطلق للطلاب المتأخرين في سداد الاشتراكات" },
  { value: "session_start", label: "بدء الحصة", icon: Calendar, color: "text-blue-500", desc: "يُطلق عند تفعيل حصة دراسية جديدة" },
  { value: "homework_due", label: "اقتراب موعد واجب", icon: BookOpen, color: "text-violet-500", desc: "يُطلق قبل يوم من موعد تسليم الواجب" },
  { value: "manual", label: "يدوي", icon: Play, color: "text-gray-500", desc: "يُطلق يدوياً عند الضغط على زر التشغيل" },
];

const TEMPLATE_VARS = [
  { var: "{{اسم_الطالب}}", desc: "اسم الطالب" },
  { var: "{{المادة}}", desc: "المادة الدراسية" },
  { var: "{{الدرجة}}", desc: "الدرجة / النتيجة" },
  { var: "{{التاريخ}}", desc: "التاريخ الحالي" },
  { var: "{{اسم_المدرسة}}", desc: "اسم المدرسة" },
  { var: "{{الحصة}}", desc: "اسم الحصة" },
  { var: "{{الواجب}}", desc: "عنوان الواجب" },
];

const PRESET_TEMPLATES: Record<string, string> = {
  grade_added: `مرحباً، \nنتيجة {{اسم_الطالب}} في {{المادة}}:\nالدرجة: {{الدرجة}}\nبتاريخ: {{التاريخ}}\n\n{{اسم_المدرسة}}`,
  low_grade: `تنبيه هام ⚠️\nحصل {{اسم_الطالب}} على درجة منخفضة في {{المادة}}: {{الدرجة}}\nنرجو التواصل معنا لمتابعة المستوى.\n\n{{اسم_المدرسة}}`,
  attendance_absent: `إشعار غياب 📋\nتغيّب {{اسم_الطالب}} عن حصة {{الحصة}} اليوم {{التاريخ}}.\nيرجى المراجعة في حال وجود عذر.\n\n{{اسم_المدرسة}}`,
  payment_overdue: `تذكير بالدفع 💳\nعزيزنا ولي أمر {{اسم_الطالب}}،\nلديكم اشتراك متأخر السداد.\nيرجى التواصل معنا لترتيب الدفع.\n\n{{اسم_المدرسة}}`,
  session_start: `إشعار بدء الحصة 🏫\nعزيزنا ولي أمر {{اسم_الطالب}}،\nتبدأ حصة {{الحصة}} الآن.\nنتمنى لطفلكم يوماً دراسياً موفقاً.\n\n{{اسم_المدرسة}}`,
  homework_due: `تذكير بالواجب 📚\nعزيزنا ولي أمر {{اسم_الطالب}}،\nيُستحق واجب {{الواجب}} غداً.\nيرجى متابعة الطالب لإتمام الواجب.\n\n{{اسم_المدرسة}}`,
  manual: `رسالة من {{اسم_المدرسة}} 📣\nعزيزنا ولي أمر {{اسم_الطالب}}،\n\n[اكتب رسالتك هنا]\n\nمع تحياتنا`,
};

const emptyRule = { name: "", description: "", trigger: "grade_added", triggerConfig: "", messageTemplate: PRESET_TEMPLATES.grade_added, targetGroup: "all", threshold: "60" };

export default function AutomationEngine() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState(emptyRule);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("rules");

  const { data: rules = [], isLoading: rulesLoading } = useQuery<AutomationRule[]>({ queryKey: ["/api/automation-rules"] });
  const { data: logs = [], isLoading: logsLoading } = useQuery<AutomationLog[]>({ queryKey: ["/api/automation-logs"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => (await apiRequest("POST", "/api/automation-rules", buildPayload(data))).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] }); setShowDialog(false); toast({ title: "✅ تم إنشاء القاعدة" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof form }) => (await apiRequest("PUT", `/api/automation-rules/${id}`, buildPayload(data))).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] }); setShowDialog(false); toast({ title: "✅ تم تحديث القاعدة" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/automation-rules/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] }); toast({ title: "✅ تم حذف القاعدة" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => (await apiRequest("PUT", `/api/automation-rules/${id}`, { status })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] }),
  });

  const runMutation = useMutation({
    mutationFn: async (id: string) => (await apiRequest("POST", `/api/automation-rules/${id}/run`)).json(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/automation-logs"] });
      toast({ title: "✅ تم تنفيذ القاعدة", description: `أُرسل ${res.sent} رسالة` });
    },
    onError: (e: any) => toast({ title: "فشل التنفيذ", description: e.message, variant: "destructive" }),
  });

  function buildPayload(data: typeof form) {
    return {
      name: data.name,
      description: data.description || null,
      trigger: data.trigger,
      triggerConfig: data.trigger === "low_grade" ? JSON.stringify({ threshold: parseInt(data.threshold) }) : (data.triggerConfig || null),
      messageTemplate: data.messageTemplate,
      targetGroup: data.targetGroup === "all" ? null : data.targetGroup,
    };
  }

  function openCreate() {
    setEditRule(null);
    setForm(emptyRule);
    setShowDialog(true);
  }

  function openEdit(r: AutomationRule) {
    setEditRule(r);
    let threshold = "60";
    try { if (r.triggerConfig) { const cfg = JSON.parse(r.triggerConfig); threshold = String(cfg.threshold || 60); } } catch {}
    setForm({ name: r.name, description: r.description || "", trigger: r.trigger, triggerConfig: r.triggerConfig || "", messageTemplate: r.messageTemplate, targetGroup: r.targetGroup || "all", threshold });
    setShowDialog(true);
  }

  function handleTriggerChange(v: string) {
    setForm(f => ({ ...f, trigger: v, messageTemplate: PRESET_TEMPLATES[v] || f.messageTemplate }));
  }

  function insertVar(v: string) {
    setForm(f => ({ ...f, messageTemplate: f.messageTemplate + v }));
  }

  const triggerInfo = (t: string) => TRIGGERS.find(x => x.value === t);
  const activeRules = rules.filter(r => r.status === "active").length;
  const totalRuns = rules.reduce((s, r) => s + (r.runCount || 0), 0);
  const sentLogs = logs.filter(l => l.status === "sent").length;
  const failedLogs = logs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "قواعد نشطة", value: activeRules, icon: Zap, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", testId: "text-active-rules" },
          { label: "إجمالي القواعد", value: rules.length, icon: Users, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", testId: "text-total-rules" },
          { label: "رسائل أُرسلت", value: sentLogs, icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", testId: "text-sent-logs" },
          { label: "مرات التنفيذ", value: totalRuns, icon: Play, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", testId: "text-total-runs" },
        ].map(({ label, value, icon: Icon, bg, text, testId }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={text} />
            </div>
            <div>
              <div className="text-xl font-bold" data-testid={testId}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="rules" data-testid="tab-automation-rules">
              قواعد الأتمتة
              {rules.length > 0 && <Badge className="mr-2 h-4 min-w-4 text-xs" variant="secondary">{rules.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-automation-logs">
              سجل التنفيذ
              {logs.length > 0 && <Badge className="mr-2 h-4 min-w-4 text-xs" variant="secondary">{logs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">القوالب الجاهزة</TabsTrigger>
          </TabsList>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm" data-testid="button-create-rule">
            <Plus size={14} className="mr-1" />
            قاعدة جديدة
          </Button>
        </div>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-4">
          {rulesLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">جارٍ التحميل…</div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap size={42} className="mx-auto mb-4 text-muted-foreground/40" />
                <p className="font-semibold text-lg mb-1">لا توجد قواعد أتمتة</p>
                <p className="text-sm text-muted-foreground mb-4">أنشئ قاعدتك الأولى لإرسال رسائل واتساب تلقائياً عند وقوع أحداث معينة</p>
                <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-create-first-rule">
                  <Plus size={14} className="mr-1" /> إنشاء أول قاعدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => {
                const trig = triggerInfo(rule.trigger);
                const TrigIcon = trig?.icon || Zap;
                const isExpanded = expandedRule === rule.id;
                return (
                  <Card key={rule.id} className={`transition-all ${rule.status === "paused" ? "opacity-60" : ""}`} data-testid={`card-rule-${rule.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0`}>
                          <TrigIcon size={18} className={trig?.color || "text-gray-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm" data-testid={`text-rule-name-${rule.id}`}>{rule.name}</span>
                            <Badge variant={rule.status === "active" ? "default" : "secondary"} className="text-xs h-5">
                              {rule.status === "active" ? "نشط" : "متوقف"}
                            </Badge>
                            <Badge variant="outline" className="text-xs h-5">{trig?.label || rule.trigger}</Badge>
                            {rule.targetGroup && (
                              <Badge variant="outline" className="text-xs h-5 text-violet-600 dark:text-violet-400">
                                <Users size={10} className="mr-1" />
                                {groups.find(g => g.id === rule.targetGroup)?.name || "مجموعة محددة"}
                              </Badge>
                            )}
                          </div>
                          {rule.description && <p className="text-xs text-muted-foreground mt-1 truncate">{rule.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>🔄 {rule.runCount || 0} مرة</span>
                            {rule.lastRun && <span>آخر تشغيل: {new Date(rule.lastRun).toLocaleDateString("ar-SA")}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={rule.status === "active"}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, status: checked ? "active" : "paused" })}
                            data-testid={`switch-rule-${rule.id}`}
                          />
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => runMutation.mutate(rule.id)}
                            disabled={runMutation.isPending || rule.status === "paused"}
                            data-testid={`button-run-rule-${rule.id}`}
                            title="تشغيل الآن">
                            <Play size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => openEdit(rule)}
                            data-testid={`button-edit-rule-${rule.id}`}>
                            <Edit size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => deleteMutation.mutate(rule.id)}
                            data-testid={`button-delete-rule-${rule.id}`}>
                            <Trash2 size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                            onClick={() => setExpandedRule(isExpanded ? null : rule.id)}>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </Button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">نص الرسالة:</p>
                          <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap font-sans leading-relaxed" data-testid={`text-rule-template-${rule.id}`}>{rule.messageTemplate}</pre>
                          {rule.trigger === "low_grade" && rule.triggerConfig && (() => {
                            try { const c = JSON.parse(rule.triggerConfig); return <p className="text-xs text-muted-foreground mt-2">الحد الأدنى: {c.threshold}%</p>; } catch { return null; }
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <span className="font-semibold">سجل تنفيذ قواعد الأتمتة</span>
                <Badge variant="secondary">{logs.length}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> {sentLogs} أُرسلت</span>
                <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500" /> {failedLogs} فشل</span>
              </div>
            </div>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">جارٍ التحميل…</div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock size={36} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">لا توجد سجلات بعد. شغّل إحدى القواعد لترى النتائج هنا.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>القاعدة</TableHead>
                        <TableHead>الرقم</TableHead>
                        <TableHead>الرسالة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => (
                        <TableRow key={log.id} className="hover:bg-muted/30" data-testid={`row-log-${log.id}`}>
                          <TableCell className="text-xs font-medium">{log.ruleName || "—"}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{log.phone || "—"}</TableCell>
                          <TableCell className="text-xs max-w-xs truncate">{log.message || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              log.status === "sent" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : log.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-600"
                            }`} data-testid={`badge-log-status-${log.id}`}>
                              {log.status === "sent" ? <CheckCircle2 size={10} /> : log.status === "failed" ? <XCircle size={10} /> : <Clock size={10} />}
                              {log.status === "sent" ? "أُرسلت" : log.status === "failed" ? "فشل" : "تخطى"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("ar-SA")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {TRIGGERS.filter(t => t.value !== "manual").map(trig => {
              const TrigIcon = trig.icon;
              return (
                <Card key={trig.value} className="hover:shadow-md transition-shadow" data-testid={`card-template-${trig.value}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrigIcon size={16} className={trig.color} />
                      <span className="font-semibold text-sm">{trig.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{trig.desc}</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground mb-3">{PRESET_TEMPLATES[trig.value]}</pre>
                    <Button size="sm" variant="outline" className="h-7 text-xs w-full"
                      onClick={() => {
                        setForm({ ...emptyRule, trigger: trig.value, messageTemplate: PRESET_TEMPLATES[trig.value], name: `قاعدة: ${trig.label}` });
                        setEditRule(null);
                        setShowDialog(true);
                      }}
                      data-testid={`button-use-template-${trig.value}`}>
                      <Copy size={11} className="mr-1" />
                      استخدام هذا القالب
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editRule ? "تعديل قاعدة الأتمتة" : "قاعدة أتمتة جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>اسم القاعدة *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثال: إشعار الدرجة المنخفضة"
                data-testid="input-rule-name" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>الوصف (اختياري)</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف مختصر للقاعدة"
                data-testid="input-rule-description" />
            </div>

            {/* Trigger */}
            <div className="space-y-1.5">
              <Label>حدث التشغيل *</Label>
              <Select value={form.trigger} onValueChange={handleTriggerChange}>
                <SelectTrigger data-testid="select-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon size={14} className={t.color} />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{triggerInfo(form.trigger)?.desc}</p>
            </div>

            {/* Low Grade Threshold */}
            {form.trigger === "low_grade" && (
              <div className="space-y-1.5">
                <Label>الحد الأدنى للدرجة (%)</Label>
                <Input type="number" min="0" max="100" value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                  placeholder="60"
                  data-testid="input-threshold" />
                <p className="text-xs text-muted-foreground">تُطلق القاعدة عند درجة أقل من هذه النسبة</p>
              </div>
            )}

            {/* Target Group */}
            <div className="space-y-1.5">
              <Label>المجموعة المستهدفة</Label>
              <Select value={form.targetGroup} onValueChange={v => setForm(f => ({ ...f, targetGroup: v }))}>
                <SelectTrigger data-testid="select-target-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المجموعات</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message Template */}
            <div className="space-y-1.5">
              <Label>نص الرسالة *</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TEMPLATE_VARS.map(v => (
                  <button key={v.var} onClick={() => insertVar(v.var)}
                    className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    data-testid={`button-insert-var-${v.var}`} title={v.desc}>
                    {v.var}
                  </button>
                ))}
              </div>
              <Textarea
                value={form.messageTemplate}
                onChange={e => setForm(f => ({ ...f, messageTemplate: e.target.value }))}
                rows={7}
                className="font-mono text-sm leading-relaxed resize-none"
                placeholder="اكتب نص الرسالة هنا…"
                data-testid="textarea-message-template"
              />
              <p className="text-xs text-muted-foreground">اضغط على متغير أعلاه لإدراجه في الرسالة</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-start">
            <Button variant="outline" onClick={() => setShowDialog(false)} data-testid="button-cancel-rule">إلغاء</Button>
            <Button
              onClick={() => editRule ? updateMutation.mutate({ id: editRule.id, data: form }) : createMutation.mutate(form)}
              disabled={!form.name || !form.messageTemplate || createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="button-save-rule">
              {createMutation.isPending || updateMutation.isPending ? "جارٍ الحفظ…" : editRule ? "حفظ التعديلات" : "إنشاء القاعدة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
