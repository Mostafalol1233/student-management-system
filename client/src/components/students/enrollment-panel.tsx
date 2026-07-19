import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertEnrollmentSchema, type Enrollment, type Group, type Teacher } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Users } from "lucide-react";

interface EnrollmentPanelProps {
  studentId: string;
}

export default function EnrollmentPanel({ studentId }: EnrollmentPanelProps) {
  const { toast } = useToast();
  const [groupId, setGroupId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/student", studentId],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/enrollments/student/${studentId}`);
      return r.json();
    },
    enabled: !!studentId,
  });

  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const createMutation = useMutation({
    mutationFn: async (data: { studentId: string; groupId: string; teacherId?: string; notes?: string }) =>
      (await apiRequest("POST", "/api/enrollments", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/student", studentId] });
      setGroupId("");
      setTeacherId("");
      setNotes("");
      toast({ title: "✅ تم التسجيل في المجموعة" });
    },
    onError: (e: any) =>
      toast({ title: "فشل التسجيل", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/enrollments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/student", studentId] });
      toast({ title: "✅ تم إلغاء التسجيل" });
    },
    onError: (e: any) =>
      toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) {
      toast({ title: "يرجى اختيار مجموعة", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      studentId,
      groupId,
      teacherId: teacherId || undefined,
      notes: notes || undefined,
    });
  };

  const getGroupName = (gId: string) => {
    const g = groups.find(x => x.id === gId);
    return g ? `${g.name} (${g.gradeLevel})` : gId;
  };

  const getTeacherName = (tId: string | null | undefined) => {
    if (!tId) return "—";
    const t = teachers.find(x => x.id === tId);
    return t ? t.name : tId;
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-muted-foreground" />
        <h3 className="font-semibold text-sm">التسجيلات والمجموعات</h3>
        <Badge variant="secondary">{enrollments.length}</Badge>
      </div>

      {/* Enrollments list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">جاري التحميل...</div>
      ) : enrollments.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          لا توجد تسجيلات
        </div>
      ) : (
        <div className="space-y-2">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-muted/20"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {enrollment.groupId ? getGroupName(enrollment.groupId) : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  المدرس: {getTeacherName(enrollment.teacherId)}
                  {enrollment.notes && ` • ${enrollment.notes}`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  className={`text-xs ${
                    enrollment.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                  variant="outline"
                >
                  {enrollment.status === "active" ? "نشط" : "غير نشط"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(enrollment.id)}
                  title="إلغاء التسجيل"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add enrollment form */}
      <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3 bg-muted/10">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">إضافة تسجيل</h4>

        <div className="space-y-1.5">
          <Label className="text-xs">المجموعة *</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="اختر مجموعة..." />
            </SelectTrigger>
            <SelectContent>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} ({g.gradeLevel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">المدرس (اختياري)</Label>
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="اختر مدرساً..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— بدون مدرس —</SelectItem>
              {teachers.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">ملاحظات (اختياري)</Label>
          <Input
            className="h-8 text-sm"
            placeholder="ملاحظة..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" size="sm" disabled={createMutation.isPending} className="w-full">
          <Plus size={13} className="ml-1" />
          {createMutation.isPending ? "جاري التسجيل..." : "تسجيل"}
        </Button>
      </form>
    </div>
  );
}
