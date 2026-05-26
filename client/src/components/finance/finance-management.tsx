import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertFinanceSchema, insertExpenseSchema,
  type Finance, type InsertFinance, type Student,
  type Expense, type InsertExpense,
} from "@shared/schema";
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
import {
  DollarSign, Plus, Trash2, AlertCircle, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Receipt, PieChart,
} from "lucide-react";

const FINANCE_TYPES = ["اشتراك شهري","اشتراك فصلي","اشتراك سنوي","رسوم تسجيل","كتب ومذكرات","أنشطة","أخرى"];

const EXPENSE_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "rent",         label: "إيجار",           color: "bg-purple-500" },
  { value: "electricity",  label: "كهرباء وخدمات",  color: "bg-yellow-500" },
  { value: "salaries",     label: "مرتبات",          color: "bg-blue-500"   },
  { value: "printing",     label: "طباعة ومستلزمات",color: "bg-orange-500" },
  { value: "maintenance",  label: "صيانة",           color: "bg-red-500"    },
  { value: "other",        label: "أخرى",            color: "bg-gray-500"   },
];

function categoryLabel(cat: string) { return EXPENSE_CATEGORIES.find(c => c.value === cat)?.label ?? cat; }
function categoryColor(cat: string) { return EXPENSE_CATEGORIES.find(c => c.value === cat)?.color ?? "bg-gray-500"; }

export default function FinanceManagement() {
  const { toast } = useToast();

  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: expenses = [] } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });

  // ── Finance form ────────────────────────────────────────────────────────
  const financeForm = useForm<InsertFinance>({
    resolver: zodResolver(insertFinanceSchema),
    defaultValues: { studentId: "", type: "", amount: 0, paid: 0, dueDate: new Date().toISOString().split("T")[0], status: "pending", notes: "" },
  });

  // ── Expense form ────────────────────────────────────────────────────────
  const expenseForm = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: { category: "", amount: 0, date: new Date().toISOString().split("T")[0], description: "" },
  });

  const createFinanceMutation = useMutation({
    mutationFn: async (data: InsertFinance) => (await apiRequest("POST", "/api/finances", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      financeForm.reset({ studentId:"",type:"",amount:0,paid:0,dueDate:new Date().toISOString().split("T")[0],status:"pending",notes:"" });
      toast({ title: "تم تسجيل الدفعة" });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const updateFinanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Finance> }) =>
      (await apiRequest("PUT", `/api/finances/${id}`, updates)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "تم التحديث" }); },
  });

  const deleteFinanceMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/finances/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "تم الحذف" }); },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => (await apiRequest("POST", "/api/expenses", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      expenseForm.reset({ category:"", amount:0, date:new Date().toISOString().split("T")[0], description:"" });
      toast({ title: "تم تسجيل المصروف" });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); toast({ title: "تم الحذف" }); },
  });

  // ── Calculations ─────────────────────────────────────────────────────────
  const totalIncome  = finances.reduce((s, f) => s + (f.paid ?? 0), 0);
  const totalDue     = finances.reduce((s, f) => s + f.amount, 0);
  const totalPending = totalDue - totalIncome;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit    = totalIncome - totalExpenses;
  const paidCount    = finances.filter(f => f.status === "paid").length;
  const overdueFinances = finances.filter(f => f.status !== "paid" && new Date(f.dueDate) < new Date());

  // Expense by category
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  const exportCSV = () => {
    const csv = "الطالب,النوع,المبلغ,المدفوع,المتبقي,تاريخ الاستحقاق,الحالة\n" +
      finances.map(f => {
        const s = students.find(st => st.id === f.studentId);
        return `"${s?.name || ""}","${f.type}",${f.amount},${f.paid ?? 0},${f.amount - (f.paid ?? 0)},"${f.dueDate}","${f.status === "paid" ? "مدفوع" : "معلق"}"`;
      }).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "finance-report.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "تم تصدير التقرير" });
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإيرادات",   value: `${totalIncome.toLocaleString()} ج`,   icon: TrendingUp,   bg: "bg-emerald-50 dark:bg-emerald-900/20",  ic: "text-emerald-600 dark:text-emerald-400" },
          { label: "إجمالي المصروفات",   value: `${totalExpenses.toLocaleString()} ج`, icon: TrendingDown, bg: "bg-red-50 dark:bg-red-900/20",          ic: "text-red-600 dark:text-red-400"         },
          { label: "صافي الربح",          value: `${netProfit.toLocaleString()} ج`,    icon: Wallet,       bg: netProfit >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20", ic: netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400" },
          { label: "المتأخرات",            value: `${totalPending.toLocaleString()} ج`, icon: AlertCircle,  bg: "bg-amber-50 dark:bg-amber-900/20",      ic: "text-amber-600 dark:text-amber-400"     },
        ].map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={ic} />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="ledger">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ledger">السجل المالي</TabsTrigger>
          <TabsTrigger value="add">دفعة جديدة</TabsTrigger>
          <TabsTrigger value="expenses">
            المصروفات
            {expenses.length > 0 && <Badge variant="secondary" className="mr-1 h-4 text-[10px]">{expenses.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            المتأخرون
            {overdueFinances.length > 0 && <Badge variant="destructive" className="mr-1 h-4 text-[10px]">{overdueFinances.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── Ledger ── */}
        <TabsContent value="ledger" className="mt-4 space-y-4">
          {/* Net profit summary bar */}
          {(totalIncome > 0 || totalExpenses > 0) && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PieChart size={14} className="text-muted-foreground" />
                    <span className="text-sm font-semibold">ملخص الميزانية</span>
                  </div>
                  <div className={`text-sm font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    صافي: {netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()} ج
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-20 text-muted-foreground">الإيرادات</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: totalIncome + totalExpenses > 0 ? `${(totalIncome / (totalIncome + totalExpenses)) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-xs font-mono w-20 text-left">{totalIncome.toLocaleString()} ج</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-20 text-muted-foreground">المصروفات</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: totalIncome + totalExpenses > 0 ? `${(totalExpenses / (totalIncome + totalExpenses)) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-xs font-mono w-20 text-left">{totalExpenses.toLocaleString()} ج</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-muted-foreground" />
                <h3 className="font-semibold text-sm">جميع الدفعات</h3>
              </div>
              <Button size="sm" variant="outline" onClick={exportCSV} data-testid="button-export-finance">تصدير CSV</Button>
            </div>
            <CardContent className="p-0">
              {finances.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <DollarSign size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد سجلات مالية بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs">الطالب</TableHead>
                        <TableHead className="text-xs">النوع</TableHead>
                        <TableHead className="text-xs">المبلغ</TableHead>
                        <TableHead className="text-xs">المدفوع</TableHead>
                        <TableHead className="text-xs">التقدم</TableHead>
                        <TableHead className="text-xs">الاستحقاق</TableHead>
                        <TableHead className="text-xs">الحالة</TableHead>
                        <TableHead className="text-xs text-left">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finances.map(f => {
                        const student = students.find(s => s.id === f.studentId);
                        const pct = f.amount > 0 ? Math.round(((f.paid ?? 0) / f.amount) * 100) : 0;
                        const overdue = f.status !== "paid" && new Date(f.dueDate) < new Date();
                        return (
                          <TableRow key={f.id} className="hover:bg-muted/20" data-testid={`finance-row-${f.id}`}>
                            <TableCell className="font-medium text-sm">{student?.name || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{f.type}</TableCell>
                            <TableCell className="font-mono text-sm">{f.amount.toLocaleString()} ج</TableCell>
                            <TableCell className="font-mono text-sm">{(f.paid ?? 0).toLocaleString()} ج</TableCell>
                            <TableCell className="min-w-[90px]">
                              <div className="flex items-center gap-1.5">
                                <Progress value={pct} className="h-1.5 flex-1" />
                                <span className="text-[10px] text-muted-foreground w-6">{pct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{f.dueDate}</TableCell>
                            <TableCell>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${f.status === "paid" ? "status-active" : overdue ? "status-overdue" : "status-warning"}`}>
                                {f.status === "paid" ? "مدفوع" : overdue ? "متأخر" : "معلق"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {f.status !== "paid" && (
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => updateFinanceMutation.mutate({ id: f.id, updates: { status: "paid", paid: f.amount } })}
                                    data-testid={`button-mark-paid-${f.id}`}>مدفوع</Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => { if (confirm("حذف السجل؟")) deleteFinanceMutation.mutate(f.id); }}
                                  data-testid={`button-delete-finance-${f.id}`}><Trash2 size={11} /></Button>
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

        {/* ── Add Payment ── */}
        <TabsContent value="add" className="mt-4">
          <Card className="max-w-lg">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <Plus size={15} className="text-muted-foreground" />
              <h3 className="font-semibold text-sm">تسجيل دفعة جديدة</h3>
            </div>
            <CardContent className="p-5">
              <Form {...financeForm}>
                <form onSubmit={financeForm.handleSubmit(d => createFinanceMutation.mutate(d))} className="space-y-4">
                  <FormField control={financeForm.control} name="studentId" render={({ field }) => (
                    <FormItem><FormLabel>الطالب *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-finance-student"><SelectValue placeholder="اختر طالباً" /></SelectTrigger></FormControl>
                        <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={financeForm.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>نوع الرسوم *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                        <SelectContent>{FINANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={financeForm.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>المبلغ الكلي *</FormLabel>
                        <FormControl><Input type="number" min="0" placeholder="500" data-testid="input-finance-amount" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={financeForm.control} name="paid" render={({ field }) => (
                      <FormItem><FormLabel>المدفوع الآن</FormLabel>
                        <FormControl><Input type="number" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={financeForm.control} name="dueDate" render={({ field }) => (
                    <FormItem><FormLabel>تاريخ الاستحقاق *</FormLabel>
                      <FormControl><Input type="date" data-testid="input-finance-due" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createFinanceMutation.isPending} data-testid="button-save-finance">
                    <Plus size={14} className="mr-2" />{createFinanceMutation.isPending ? "جاري الحفظ..." : "حفظ الدفعة"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Expenses ── */}
        <TabsContent value="expenses" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown */}
            {expenseByCategory.length > 0 && (
              <div className="space-y-3">
                <div className="font-semibold text-sm">التوزيع حسب الفئة</div>
                {expenseByCategory.map(cat => (
                  <div key={cat.value} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${cat.color} flex-shrink-0`} />
                    <div className="flex-1 text-sm">{cat.label}</div>
                    <div className="font-mono text-sm font-semibold">{cat.total.toLocaleString()} ج</div>
                    <div className="text-xs text-muted-foreground w-10 text-left">
                      {totalExpenses > 0 ? `${Math.round((cat.total / totalExpenses) * 100)}%` : "—"}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between text-sm font-semibold">
                  <span>الإجمالي</span>
                  <span>{totalExpenses.toLocaleString()} ج</span>
                </div>
              </div>
            )}

            <div className={`${expenseByCategory.length > 0 ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
              {/* Add expense form */}
              <Card>
                <div className="px-5 py-4 border-b flex items-center gap-2">
                  <Plus size={14} className="text-muted-foreground" />
                  <h3 className="font-semibold text-sm">تسجيل مصروف جديد</h3>
                </div>
                <CardContent className="p-5">
                  <Form {...expenseForm}>
                    <form onSubmit={expenseForm.handleSubmit(d => createExpenseMutation.mutate(d))} className="grid grid-cols-2 gap-3">
                      <FormField control={expenseForm.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>الفئة *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={expenseForm.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>المبلغ *</FormLabel>
                          <FormControl><Input type="number" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value)||0)} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={expenseForm.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>التاريخ *</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={expenseForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>البيان</FormLabel>
                          <FormControl><Input placeholder="تفاصيل..." {...field} value={field.value || ""} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <div className="col-span-2">
                        <Button type="submit" className="w-full" disabled={createExpenseMutation.isPending}>
                          <Plus size={14} className="mr-2" />
                          {createExpenseMutation.isPending ? "جاري الحفظ..." : "إضافة المصروف"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Expenses list */}
              <Card>
                <CardContent className="p-0">
                  {expenses.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Receipt size={28} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">لا توجد مصروفات مسجلة</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs">الفئة</TableHead>
                          <TableHead className="text-xs">البيان</TableHead>
                          <TableHead className="text-xs">التاريخ</TableHead>
                          <TableHead className="text-xs">المبلغ</TableHead>
                          <TableHead className="text-xs text-left">حذف</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map(e => (
                          <TableRow key={e.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${categoryColor(e.category)}`} />
                                <span className="text-xs">{categoryLabel(e.category)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{e.description || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{e.date}</TableCell>
                            <TableCell className="font-mono text-sm font-semibold text-red-600">{e.amount.toLocaleString()} ج</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                                onClick={() => { if (confirm("حذف المصروف؟")) deleteExpenseMutation.mutate(e.id); }}>
                                <Trash2 size={11} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Overdue ── */}
        <TabsContent value="overdue" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" />
              <h3 className="font-semibold text-sm">الطلاب المتأخرون في السداد</h3>
              <Badge variant="destructive" className="text-xs">{overdueFinances.length}</Badge>
            </div>
            <CardContent className="p-0">
              {overdueFinances.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">لا يوجد متأخرون — ممتاز!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {overdueFinances.map(f => {
                    const student = students.find(s => s.id === f.studentId);
                    const remaining = f.amount - (f.paid ?? 0);
                    const daysLate = Math.floor((Date.now() - new Date(f.dueDate).getTime()) / 86400000);
                    return (
                      <div key={f.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                          <AlertCircle size={15} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{student?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{f.type} · {daysLate} يوم تأخير · {student?.guardianPhone}</div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-red-600 text-sm">{remaining.toLocaleString()} ج</div>
                          <div className="text-[10px] text-muted-foreground">متبقي</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700"
                          onClick={() => updateFinanceMutation.mutate({ id: f.id, updates: { status: "paid", paid: f.amount } })}>
                          تسوية
                        </Button>
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
