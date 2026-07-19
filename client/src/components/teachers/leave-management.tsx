import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Trash2, Plus } from "lucide-react";
import type { Teacher, LeaveRequest } from "@shared/schema";

const LEAVE_TYPES = [
  { value: "annual",  label: "سنوية" },
  { value: "sick",    label: "مرضية" },
  { value: "unpaid",  label: "بدون أجر" },
  { value: "other",   label: "أخرى" },
];

function statusBadge(status: string) {
  if (status === "approved")
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">موافق</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">مرفوض</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">قيد الانتظار</Badge>;
}

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

export default function LeaveManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");

  // Form state
  const [teacherId, setTeacherId] = useState("");
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({ queryKey: ["/api/leaves"] });

  const createMutation = useMutation({
    mutationFn: async (data: object) => (await apiRequest("POST", "/api/leaves", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({ title: "✅ تم تقديم طلب الإجازة" });
      setTeacherId(""); setLeaveType("annual"); setStartDate(""); setEndDate(""); setReason("");
      setActiveTab("list");
    },
    onError: (e: any) => toast({ title: "فشل تقديم الطلب", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await apiRequest("PUT", `/api/leaves/${id}`, { status })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/leaves"] }); },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/leaves/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/leaves"] }); toast({ title: "تم حذف الطلب" }); },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !startDate || !endDate) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createMutation.mutate({ teacherId, type: leaveType, startDate, endDate, reason });
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name ?? "—";

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
      <TabsList className="mb-4">
        <TabsTrigger value="list">طلبات الإجازة</TabsTrigger>
        <TabsTrigger value="new">طلب إجازة جديد</TabsTrigger>
      </TabsList>

      {/* List Tab */}
      <TabsContent value="list">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
            ) : leaves.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">لا توجد طلبات إجازة</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">المعلم</TableHead>
                    <TableHead className="text-xs">النوع</TableHead>
                    <TableHead className="text-xs">من</TableHead>
                    <TableHead className="text-xs">إلى</TableHead>
                    <TableHead className="text-xs">عدد الأيام</TableHead>
                    <TableHead className="text-xs">السبب</TableHead>
                    <TableHead className="text-xs">الحالة</TableHead>
                    <TableHead className="text-xs text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map(leave => (
                    <TableRow key={leave.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{getTeacherName(leave.teacherId)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {LEAVE_TYPES.find(t => t.value === leave.type)?.label ?? leave.type}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{leave.startDate}</TableCell>
                      <TableCell className="text-xs font-mono">{leave.endDate}</TableCell>
                      <TableCell className="text-sm font-semibold">{daysBetween(leave.startDate, leave.endDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{leave.reason || "—"}</TableCell>
                      <TableCell>{statusBadge(leave.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {leave.status === "pending" && (
                            <>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-[10px] px-2 text-emerald-600 hover:text-emerald-700"
                                onClick={() => updateMutation.mutate({ id: leave.id, status: "approved" })}
                                disabled={updateMutation.isPending}
                              >
                                <CheckCircle size={12} className="mr-1" />موافقة
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-[10px] px-2 text-red-500 hover:text-red-600"
                                onClick={() => updateMutation.mutate({ id: leave.id, status: "rejected" })}
                                disabled={updateMutation.isPending}
                              >
                                <XCircle size={12} className="mr-1" />رفض
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm("حذف هذا الطلب؟")) deleteMutation.mutate(leave.id); }}
                          >
                            <Trash2 size={12} />
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
      </TabsContent>

      {/* New Request Tab */}
      <TabsContent value="new">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <Label>المعلم *</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>نوع الإجازة *</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>تاريخ البداية *</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ النهاية *</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              {startDate && endDate && (
                <p className="text-xs text-muted-foreground">
                  عدد الأيام: <span className="font-semibold text-foreground">{daysBetween(startDate, endDate)}</span>
                </p>
              )}

              <div className="space-y-1.5">
                <Label>السبب</Label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="سبب الإجازة..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={createMutation.isPending}>
                  <Plus size={14} className="mr-2" />
                  {createMutation.isPending ? "جاري التقديم..." : "تقديم الطلب"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>إلغاء</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
