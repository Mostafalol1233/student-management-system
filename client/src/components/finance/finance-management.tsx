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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DollarSign, Plus, Trash2, AlertCircle, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Receipt, PieChart, Printer, Edit, Save, Search, X,
} from "lucide-react";
import PaymentReceipt from "./payment-receipt";
import { useSettings } from "@/hooks/use-settings";

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

const PAYMENT_METHODS = [
  { value: "cash", label: "نقداً" },
  { value: "transfer", label: "تحويل بنكي" },
  { value: "vodafone_cash", label: "فودافون كاش" },
  { value: "instapay", label: "انستاباي" },
  { value: "other", label: "أخرى" },
];

export default function FinanceManagement() {
  const { toast } = useToast();
  const { get } = useSettings();

  // Edit finance state
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [editFinanceForm, setEditFinanceForm] = useState<Partial<Finance>>({});

  // Receipt state
  const [receiptRecord, setReceiptRecord] = useState<Finance | null>(null);

  // Edit expense state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState<Partial<Expense>>({});

  // Ledger search/filter
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("all");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");

  const { data: finances = [] } = useQuery<Finance[]>({ queryKey: ["/api/finances"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: expenses = [] } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });

  const financeForm = useForm<InsertFinance>({
    resolver: zodResolver(insertFinanceSchema),
    defaultValues: { studentId: "", type: "", amount: 0, paid: 0, dueDate: new Date().toISOString().split("T")[0], status: "pending", notes: "" },
  });

  const expenseForm = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: { category: "", amount: 0, date: new Date().toISOString().split("T")[0], description: "" },
  });

  const createFinanceMutation = useMutation({
    mutationFn: async (data: InsertFinance) => (await apiRequest("POST", "/api/finances", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      financeForm.reset({ studentId:"",type:"",amount:0,paid:0,dueDate:new Date().toISOString().split("T")[0],status:"pending",notes:"" });
      toast({ title: "✅ تم تسجيل الدفعة" });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const updateFinanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Finance> }) =>
      (await apiRequest("PUT", `/api/finances/${id}`, updates)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finances"] });
      setEditingFinance(null);
      toast({ title: "✅ تم التحديث" });
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteFinanceMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/finances/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/finances"] }); toast({ title: "✅ تم الحذف" }); },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => (await apiRequest("POST", "/api/expenses", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      expenseForm.reset({ category:"", amount:0, date:new Date().toISOString().split("T")[0], description:"" });
      toast({ title: "✅ تم تسجيل المصروف" });
    },
    onError: (e: any) => toast({ title: "فشل", description: e.message, variant: "destructive" }),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) =>
      (await apiRequest("PUT", `/api/expenses/${id}`, updates)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setEditingExpense(null);
      toast({ title: "✅ تم تحديث المصروف" });
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); toast({ title: "✅ تم الحذف" }); },
  });

  // Calculations
  const totalIncome  = finances.reduce((s, f) => s + (f.paid ?? 0), 0);
  const totalDue     = finances.reduce((s, f) => s + f.amount, 0);
  const totalPending = totalDue - totalIncome;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit    = totalIncome - totalExpenses;
  const overdueFinances = finances.filter(f => f.status !== "paid" && new Date(f.dueDate) < new Date());

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  // Filtered ledger
  const filteredFinances = finances.filter(f => {
    const student = students.find(s => s.id === f.studentId);
    const matchSearch = !ledgerSearch || student?.name.toLowerCase().includes(ledgerSearch.toLowerCase()) || f.type.includes(ledgerSearch);
    const matchStatus = ledgerStatusFilter === "all" || f.status === ledgerStatusFilter || (ledgerStatusFilter === "overdue" && f.status !== "paid" && new Date(f.dueDate) < new Date());
    const matchFrom = !ledgerDateFrom || f.dueDate >= ledgerDateFrom;
    const matchTo = !ledgerDateTo || f.dueDate <= ledgerDateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const openEditFinance = (f: Finance) => { setEditingFinance(f); setEditFinanceForm({ ...f }); };
  const openEditExpense = (e: Expense) => { setEditingExpense(e); setEditExpenseForm({ ...e }); };

  const printFinanceReport = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filteredFinances.map(f => {
      const student = students.find(s => s.id === f.studentId);
      const pct = f.amount > 0 ? Math.round(((f.paid ?? 0) / f.amount) * 100) : 0;
      const overdue = f.status !== "paid" && new Date(f.dueDate) < new Date();
      return `<tr>
        <td>${student?.name || "—"}</td><td>${f.type}</td>
        <td class="num">${f.amount.toLocaleString()} ج</td>
        <td class="num">${(f.paid ?? 0).toLocaleString()} ج</td>
        <td class="num">${(f.amount - (f.paid ?? 0)).toLocaleString()} ج</td>
        <td>${f.dueDate}</td>
        <td class="${f.status === "paid" ? "paid" : overdue ? "overdue" : "pending"}">
          ${f.status === "paid" ? "مدفوع" : overdue ? "متأخر" : "معلق"}
        </td></tr>`;
    }).join("");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>تقرير مالي</title>
      <style>body{font-family:Arial,sans-serif;direction:rtl;padding:24px;color:#111}
      h1{font-size:20px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f3f4f6;padding:8px;text-align:right;border:1px solid #ddd}
      td{padding:7px 8px;border:1px solid #ddd;text-align:right}
      .num{text-align:left;font-family:monospace}
      .paid{color:#16a34a;font-weight:600}.overdue{color:#dc2626;font-weight:600}.pending{color:#d97706;font-weight:600}
      .summary{margin-top:16px;font-size:13px;display:flex;gap:24px}.summary span{font-weight:700}
      @media print{body{padding:0}}</style></head><body>
      <h1>التقرير المالي</h1>
      <div class="meta">تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")} · السجلات: ${filteredFinances.length}</div>
      <table><thead><tr><th>الطالب</th><th>النوع</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th><th>الاستحقاق</th><th>الحالة</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="summary">
        <div>الإجمالي: <span>${totalIncome.toLocaleString()} ج</span></div>
        <div>المتأخرات: <span>${totalPending.toLocaleString()} ج</span></div>
        <div>صافي الربح: <span>${netProfit.toLocaleString()} ج</span></div>
      </div></body></html>`);
    win.document.close(); win.print();
  };

  const exportCSV = () => {
    const csv = "الطالب,النوع,المبلغ,المدفوع,المتبقي,تاريخ الاستحقاق,الحالة\n" +
      filteredFinances.map(f => {
        const s = students.find(st => st.id === f.studentId);
        const overdue = f.status !== "paid" && new Date(f.dueDate) < new Date();
        return `"${s?.name || ""}","${f.type}",${f.amount},${f.paid ?? 0},${f.amount - (f.paid ?? 0)},"${f.dueDate}","${f.status === "paid" ? "مدفوع" : overdue ? "متأخر" : "معلق"}"`;
      }).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "finance-report.csv" });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "✅ تم تصدير التقرير" });
  };

  return (
    <div className="space-y-6">
      {/* Edit Finance Dialog */}
      <Dialog open={!!editingFinance} onOpenChange={o => { if (!o) setEditingFinance(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تعديل سجل الدفعة</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">الطالب</Label>
              <Select value={editFinanceForm.studentId || ""} onValueChange={v => setEditFinanceForm(p => ({ ...p, studentId: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر طالباً" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع الرسوم</Label>
              <Select value={editFinanceForm.type || ""} onValueChange={v => setEditFinanceForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent>{FINANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">المبلغ الكلي</Label>
                <Input type="number" min="0" className="h-8 text-sm" value={editFinanceForm.amount ?? 0}
                  onChange={e => setEditFinanceForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">المدفوع</Label>
                <Input type="number" min="0" className="h-8 text-sm" value={editFinanceForm.paid ?? 0}
                  onChange={e => {
                    const paid = parseFloat(e.target.value) || 0;
                    const status = paid >= (editFinanceForm.amount ?? 0) ? "paid" : paid > 0 ? "partial" : "pending";
                    setEditFinanceForm(p => ({ ...p, paid, status }));
                  }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاريخ الاستحقاق</Label>
              <Input type="date" className="h-8 text-sm" value={editFinanceForm.dueDate || ""}
                onChange={e => setEditFinanceForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الحالة</Label>
              <Select value={editFinanceForm.status || "pending"} onValueChange={v => setEditFinanceForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">طريقة الدفع</Label>
              <Select value={editFinanceForm.paymentMethod || "cash"} onValueChange={v => setEditFinanceForm(p => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">رقم الإيصال (اختياري)</Label>
              <Input className="h-8 text-sm" placeholder="مثال: REC-001" value={editFinanceForm.receiptNumber || ""}
                onChange={e => setEditFinanceForm(p => ({ ...p, receiptNumber: e.target.value }))} />
            </div>
            {(editFinanceForm.status === "paid" || editFinanceForm.status === "partial") && (
              <div className="space-y-1.5">
                <Label className="text-xs">تاريخ الدفع (اختياري)</Label>
                <Input type="date" className="h-8 text-sm" value={editFinanceForm.paidDate || ""}
                  onChange={e => setEditFinanceForm(p => ({ ...p, paidDate: e.target.value }))} />
              </div>
            )}
            <Button className="w-full" disabled={updateFinanceMutation.isPending}
              onClick={() => {
                if (!editingFinance) return;
                if (!editFinanceForm.studentId) { alert("يرجى اختيار الطالب"); return; }
                if (!editFinanceForm.dueDate) { alert("يرجى تحديد تاريخ الاستحقاق"); return; }
                if ((editFinanceForm.amount ?? 0) <= 0) { alert("يجب أن يكون المبلغ أكبر من صفر"); return; }
                updateFinanceMutation.mutate({ id: editingFinance.id, updates: editFinanceForm });
              }}>
              <Save size={14} className="mr-2" />
              {updateFinanceMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptRecord} onOpenChange={o => { if (!o) setReceiptRecord(null); }}>
        <DialogContent className="max-w-md p-0">
          {receiptRecord && (() => {
            const student = students.find(s => s.id === receiptRecord.studentId);
            const centerName = get("app_name", "المركز");
            return student ? (
              <PaymentReceipt
                finance={receiptRecord}
                student={student}
                centerName={centerName}
                onClose={() => setReceiptRecord(null)}
              />
            ) : null;
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={o => { if (!o) setEditingExpense(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>تعديل المصروف</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">الفئة</Label>
              <Select value={editExpenseForm.category || ""} onValueChange={v => setEditExpenseForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">المبلغ</Label>
              <Input type="number" min="0" className="h-8 text-sm" value={editExpenseForm.amount ?? 0}
                onChange={e => setEditExpenseForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">التاريخ</Label>
              <Input type="date" className="h-8 text-sm" value={editExpenseForm.date || ""}
                onChange={e => setEditExpenseForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">البيان</Label>
              <Input className="h-8 text-sm" placeholder="تفاصيل..." value={editExpenseForm.description || ""}
                onChange={e => setEditExpenseForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <Button className="w-full" disabled={updateExpenseMutation.isPending}
              onClick={() => editingExpense && updateExpenseMutation.mutate({ id: editingExpense.id, updates: editExpenseForm })}>
              <Save size={14} className="mr-2" />
              {updateExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
          {/* Search + filter bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label className="text-xs text-muted-foreground">بحث بالاسم أو النوع</Label>
                  <div className="relative">
                    <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-8 text-sm pr-8" placeholder="ابحث..." value={ledgerSearch}
                      onChange={e => setLedgerSearch(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1 w-36">
                  <Label className="text-xs text-muted-foreground">الحالة</Label>
                  <Select value={ledgerStatusFilter} onValueChange={setLedgerStatusFilter}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="overdue">متأخر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">من تاريخ</Label>
                  <Input type="date" className="h-8 text-sm w-36" value={ledgerDateFrom} onChange={e => setLedgerDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
                  <Input type="date" className="h-8 text-sm w-36" value={ledgerDateTo} onChange={e => setLedgerDateTo(e.target.value)} />
                </div>
                {(ledgerSearch || ledgerStatusFilter !== "all" || ledgerDateFrom || ledgerDateTo) && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
                    onClick={() => { setLedgerSearch(""); setLedgerStatusFilter("all"); setLedgerDateFrom(""); setLedgerDateTo(""); }}>
                    <X size={12} className="mr-1" />مسح
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Net profit summary */}
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
                  {[
                    { label: "الإيرادات", value: totalIncome, color: "bg-emerald-500" },
                    { label: "المصروفات", value: totalExpenses, color: "bg-red-500" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="text-xs w-20 text-muted-foreground">{r.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${r.color} rounded-full`} style={{ width: totalIncome + totalExpenses > 0 ? `${(r.value / (totalIncome + totalExpenses)) * 100}%` : "0%" }} />
                      </div>
                      <span className="text-xs font-mono w-20 text-left">{r.value.toLocaleString()} ج</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-muted-foreground" />
                <h3 className="font-semibold text-sm">جميع الدفعات</h3>
                {filteredFinances.length !== finances.length && (
                  <Badge variant="secondary" className="text-xs">{filteredFinances.length} / {finances.length}</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportCSV} data-testid="button-export-finance">تصدير CSV</Button>
                <Button size="sm" variant="outline" onClick={printFinanceReport} data-testid="button-print-finance">
                  <Printer size={13} className="mr-1" />طباعة
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              {filteredFinances.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <DollarSign size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{ledgerSearch || ledgerStatusFilter !== "all" || ledgerDateFrom || ledgerDateTo ? "لا توجد نتائج مطابقة" : "لا توجد سجلات مالية بعد"}</p>
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
                        <TableHead className="text-xs">إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFinances.map(f => {
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
                              <div className="flex gap-0.5">
                                {f.status !== "paid" && (
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-1.5"
                                    onClick={() => updateFinanceMutation.mutate({ id: f.id, updates: { status: "paid", paid: f.amount } })}
                                    data-testid={`button-mark-paid-${f.id}`}>مدفوع</Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700"
                                  onClick={() => openEditFinance(f)}
                                  data-testid={`button-edit-finance-${f.id}`} title="تعديل">
                                  <Edit size={11} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => { if (confirm("حذف هذا السجل المالي؟")) deleteFinanceMutation.mutate(f.id); }}
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
                  <span>الإجمالي</span><span>{totalExpenses.toLocaleString()} ج</span>
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
                            <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
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
                          <TableHead className="text-xs">إجراء</TableHead>
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
                              <div className="flex gap-0.5">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700"
                                  onClick={() => openEditExpense(e)} title="تعديل">
                                  <Edit size={11} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => { if (confirm("حذف هذا المصروف؟")) deleteExpenseMutation.mutate(e.id); }}>
                                  <Trash2 size={11} />
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
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700"
                            onClick={() => updateFinanceMutation.mutate({ id: f.id, updates: { status: "paid", paid: f.amount } })}>
                            تسوية
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600"
                            onClick={() => openEditFinance(f)} title="تعديل"><Edit size={12} /></Button>
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
