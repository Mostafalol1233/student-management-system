import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinanceSchema, type Finance, type InsertFinance, type Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Trash2, AlertCircle, CheckCircle2, TrendingUp, Users } from "lucide-react";

const FINANCE_TYPES = ["اشتراك شهري","اشتراك فصلي","اشتراك سنوي","رسوم تسجيل","كتب ومذكرات","أنشطة","أخرى"];

export default function FinanceManagement() {
  const { toast } = useToast();
  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });

  const form = useForm<InsertFinance>({
    resolver: zodResolver(insertFinanceSchema),
    defaultValues: { studentId: "", type: "", amount: 0, paid: 0, dueDate: new Date().toISOString().split("T")[0], status: "pending", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFinance) => (await apiRequest("POST", "/api/finances", data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); form.reset({ studentId:"",type:"",amount:0,paid:0,dueDate:new Date().toISOString().split("T")[0],status:"pending",notes:"" }); toast({ title: "✅ تم تسجيل الدفعة" }); },
    onError: (e: any) => toast({ title: "فشل التسجيل", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Finance> }) =>
      (await apiRequest("PUT", `/api/finances/${id}`, updates)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "✅ تم التحديث" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/finances/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "✅ تم الحذف" }); },
  });

  const totalRevenue = finances.reduce((s, f) => s + (f.paid ?? 0), 0);
  const totalDue = finances.reduce((s, f) => s + f.amount, 0);
  const totalPending = totalDue - totalRevenue;
  const paidCount = finances.filter(f => f.status === "paid").length;
  const overdueFinances = finances.filter(f => f.status !== "paid" && new Date(f.dueDate) < new Date());

  const exportCSV = () => {
    const csv = "الطالب,النوع,المبلغ,المدفوع,المتبقي,تاريخ الاستحقاق,الحالة\n" +
      finances.map(f => {
        const s = students.find(st => st.id === f.studentId);
        return `"${s?.name || ""}","${f.type}",${f.amount},${f.paid ?? 0},${f.amount - (f.paid ?? 0)},"${f.dueDate}","${f.status === "paid" ? "مدفوع" : "معلق"}"`;
      }).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "finance-report.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "✅ تم تصدير التقرير المالي" });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: `${totalRevenue.toLocaleString()} ج`, icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
          { label: "إجمالي المستحق", value: `${totalDue.toLocaleString()} ج`, icon: DollarSign, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
          { label: "المتأخرات", value: `${totalPending.toLocaleString()} ج`, icon: AlertCircle, bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
          { label: "مدفوع بالكامل", value: paidCount, icon: CheckCircle2, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon size={18} className={text} /></div>
            <div><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">السجل المالي</TabsTrigger>
          <TabsTrigger value="add">تسجيل دفعة</TabsTrigger>
          <TabsTrigger value="overdue">المتأخرون{overdueFinances.length > 0 && <Badge variant="destructive" className="mr-2 h-4 text-xs">{overdueFinances.length}</Badge>}</TabsTrigger>
        </TabsList>

        {/* List */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">جميع الدفعات</h3>
              <Button size="sm" variant="outline" onClick={exportCSV} data-testid="button-export-finance">تصدير CSV</Button>
            </div>
            <CardContent className="p-0">
              {finances.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm"><DollarSign size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد سجلات مالية</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead>الطالب</TableHead><TableHead>النوع</TableHead><TableHead>المبلغ</TableHead><TableHead>المدفوع</TableHead><TableHead>تقدم الدفع</TableHead><TableHead>الاستحقاق</TableHead><TableHead>الحالة</TableHead><TableHead>إجراء</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {finances.map(f => {
                        const student = students.find(s => s.id === f.studentId);
                        const pct = f.amount > 0 ? Math.round(((f.paid ?? 0) / f.amount) * 100) : 0;
                        const overdue = f.status !== "paid" && new Date(f.dueDate) < new Date();
                        return (
                          <TableRow key={f.id} className="hover:bg-muted/30" data-testid={`finance-row-${f.id}`}>
                            <TableCell className="font-medium text-sm">{student?.name || "—"}</TableCell>
                            <TableCell className="text-sm">{f.type}</TableCell>
                            <TableCell className="font-mono text-sm">{f.amount.toLocaleString()} ج</TableCell>
                            <TableCell className="font-mono text-sm">{(f.paid ?? 0).toLocaleString()} ج</TableCell>
                            <TableCell className="min-w-[100px]">
                              <div className="flex items-center gap-2"><Progress value={pct} className="h-1.5 flex-1" /><span className="text-xs text-muted-foreground w-8">{pct}%</span></div>
                            </TableCell>
                            <TableCell className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{f.dueDate}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : overdue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                                {f.status === "paid" ? "مدفوع" : overdue ? "متأخر" : "معلق"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {f.status !== "paid" && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => updateMutation.mutate({ id: f.id, updates: { status: "paid", paid: f.amount } })}
                                    data-testid={`button-mark-paid-${f.id}`}>مدفوع</Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive"
                                  onClick={() => { if (confirm("حذف هذا السجل؟")) deleteMutation.mutate(f.id); }}
                                  data-testid={`button-delete-finance-${f.id}`}><Trash2 size={12} /></Button>
                              </div>
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
        </TabsContent>

        {/* Add Form */}
        <TabsContent value="add" className="mt-4">
          <Card className="max-w-lg">
            <div className="px-5 py-4 border-b flex items-center gap-2"><Plus size={16} className="text-muted-foreground" /><h3 className="font-semibold">تسجيل دفعة جديدة</h3></div>
            <CardContent className="p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="studentId" render={({ field }) => (
                    <FormItem><FormLabel>الطالب *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-finance-student"><SelectValue placeholder="اختر طالباً" /></SelectTrigger></FormControl>
                        <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>نوع الرسوم *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                        <SelectContent>{FINANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>المبلغ الكلي *</FormLabel><FormControl><Input type="number" min="0" placeholder="500" data-testid="input-finance-amount" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="paid" render={({ field }) => (
                      <FormItem><FormLabel>المدفوع</FormLabel><FormControl><Input type="number" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem><FormLabel>تاريخ الاستحقاق *</FormLabel><FormControl><Input type="date" data-testid="input-finance-due" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-finance">
                    <Plus size={14} className="mr-2" />{createMutation.isPending ? "جاري الحفظ..." : "حفظ الدفعة"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue */}
        <TabsContent value="overdue" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2"><AlertCircle size={16} className="text-red-500" /><h3 className="font-semibold">الطلاب المتأخرون في السداد</h3><Badge variant="destructive">{overdueFinances.length}</Badge></div>
            <CardContent className="p-0">
              {overdueFinances.length === 0 ? (
                <div className="p-8 text-center"><CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-500" /><p className="text-sm text-muted-foreground">لا يوجد متأخرون!</p></div>
              ) : (
                <div className="divide-y">
                  {overdueFinances.map(f => {
                    const student = students.find(s => s.id === f.studentId);
                    const remaining = f.amount - (f.paid ?? 0);
                    return (
                      <div key={f.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertCircle size={16} className="text-red-600" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{student?.name}</div>
                          <div className="text-xs text-muted-foreground">{f.type} · استحق في {f.dueDate} · {student?.guardianPhone}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{remaining.toLocaleString()} ج</div>
                          <div className="text-xs text-muted-foreground">متبقي</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
