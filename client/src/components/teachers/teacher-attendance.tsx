import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Save, CalendarDays } from "lucide-react";
import type { Teacher, TeacherAttendance } from "@shared/schema";

const STATUS_OPTIONS = [
  { value: "present", label: "حاضر" },
  { value: "absent",  label: "غائب" },
  { value: "late",    label: "متأخر" },
  { value: "leave",   label: "إجازة" },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    present: "bg-emerald-100 text-emerald-700",
    absent:  "bg-red-100 text-red-700",
    late:    "bg-amber-100 text-amber-700",
    leave:   "bg-blue-100 text-blue-700",
  };
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label ?? status;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? ""}`}>{label}</span>;
}

interface AttendanceRow {
  teacherId: string;
  date: string;
  status: string;
  clockIn: string;
  clockOut: string;
  notes: string;
}

export default function TeacherAttendancePanel() {
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [rows, setRows] = useState<Record<string, AttendanceRow>>({});
  const [initialized, setInitialized] = useState<string | null>(null);

  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const { data: existingAttendance = [], isLoading } = useQuery<TeacherAttendance[]>({
    queryKey: ["/api/teacher-attendance", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/teacher-attendance?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Initialize rows when teachers or attendance data loads
  if (!isLoading && teachers.length > 0 && initialized !== selectedDate) {
    const init: Record<string, AttendanceRow> = {};
    teachers.forEach(t => {
      const existing = existingAttendance.find(a => a.teacherId === t.id);
      init[t.id] = {
        teacherId: t.id,
        date: selectedDate,
        status: existing?.status ?? "present",
        clockIn: existing?.clockIn ?? "",
        clockOut: existing?.clockOut ?? "",
        notes: existing?.notes ?? "",
      };
    });
    setRows(init);
    setInitialized(selectedDate);
  }

  const saveMutation = useMutation({
    mutationFn: async (records: AttendanceRow[]) => {
      const res = await apiRequest("POST", "/api/teacher-attendance", records);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-attendance"] });
      toast({ title: "✅ تم حفظ سجل الحضور بنجاح" });
    },
    onError: (e: any) => toast({ title: "فشل الحفظ", description: e.message, variant: "destructive" }),
  });

  const updateRow = (teacherId: string, field: keyof AttendanceRow, value: string) => {
    setRows(prev => ({ ...prev, [teacherId]: { ...prev[teacherId], [field]: value, date: selectedDate } }));
  };

  const handleSave = () => {
    const records = Object.values(rows);
    if (records.length === 0) return;
    saveMutation.mutate(records);
  };

  const counts = Object.values(rows).reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      {/* Date picker + summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-muted-foreground" />
              <Label>التاريخ:</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setInitialized(null); }}
                className="w-40 h-8 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                حاضر: {counts["present"] ?? 0}
              </Badge>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                غائب: {counts["absent"] ?? 0}
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                متأخر: {counts["late"] ?? 0}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                إجازة: {counts["leave"] ?? 0}
              </Badge>
            </div>
            <Button
              className="mr-auto"
              onClick={handleSave}
              disabled={saveMutation.isPending || teachers.length === 0}
            >
              <Save size={14} className="mr-2" />
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الكل"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">سجل الحضور اليومي</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">لا يوجد معلمون مسجلون</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">المعلم</TableHead>
                  <TableHead className="text-xs">المادة</TableHead>
                  <TableHead className="text-xs">الحالة</TableHead>
                  <TableHead className="text-xs">وقت الدخول</TableHead>
                  <TableHead className="text-xs">وقت الخروج</TableHead>
                  <TableHead className="text-xs">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map(teacher => {
                  const row = rows[teacher.id];
                  if (!row) return null;
                  return (
                    <TableRow key={teacher.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-[11px] font-semibold">{teacher.name.slice(0, 1)}</span>
                          </div>
                          <span className="font-medium text-sm">{teacher.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{teacher.subject}</TableCell>
                      <TableCell>
                        <Select
                          value={row.status}
                          onValueChange={val => updateRow(teacher.id, "status", val)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="HH:MM"
                          value={row.clockIn}
                          onChange={e => updateRow(teacher.id, "clockIn", e.target.value)}
                          className="h-8 w-24 text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="HH:MM"
                          value={row.clockOut}
                          onChange={e => updateRow(teacher.id, "clockOut", e.target.value)}
                          className="h-8 w-24 text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="ملاحظة..."
                          value={row.notes}
                          onChange={e => updateRow(teacher.id, "notes", e.target.value)}
                          className="h-8 text-xs"
                        />
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
  );
}
