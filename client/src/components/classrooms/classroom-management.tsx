import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassroomSchema, type Classroom, type InsertClassroom } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, DoorOpen } from "lucide-react";

export default function ClassroomManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

  const { data: classrooms = [], isLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
  });

  const form = useForm<InsertClassroom>({
    resolver: zodResolver(insertClassroomSchema),
    defaultValues: { name: "", capacity: 30, floor: "", notes: "" },
  });

  const openAdd = () => {
    setEditingClassroom(null);
    form.reset({ name: "", capacity: 30, floor: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    form.reset({
      name: classroom.name,
      capacity: classroom.capacity ?? 30,
      floor: classroom.floor ?? "",
      notes: classroom.notes ?? "",
    });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertClassroom) =>
      (await apiRequest("POST", "/api/classrooms", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "✅ تم إضافة القاعة" });
    },
    onError: (e: any) =>
      toast({ title: "فشل الإضافة", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertClassroom }) =>
      (await apiRequest("PUT", `/api/classrooms/${id}`, data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      setDialogOpen(false);
      setEditingClassroom(null);
      form.reset();
      toast({ title: "✅ تم تعديل القاعة" });
    },
    onError: (e: any) =>
      toast({ title: "فشل التعديل", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/classrooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({ title: "✅ تم حذف القاعة" });
    },
    onError: (e: any) =>
      toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const handleDelete = (classroom: Classroom) => {
    if (confirm(`حذف القاعة "${classroom.name}"؟`)) {
      deleteMutation.mutate(classroom.id);
    }
  };

  const onSubmit = (data: InsertClassroom) => {
    if (editingClassroom) {
      updateMutation.mutate({ id: editingClassroom.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DoorOpen size={18} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold">إدارة القاعات</h2>
          <Badge variant="secondary">{classrooms.length}</Badge>
        </div>
        <Button onClick={openAdd}>
          <Plus size={14} className="ml-2" />
          إضافة قاعة
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
      ) : classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <DoorOpen size={40} className="text-muted-foreground/20" />
          <p className="text-muted-foreground text-sm">لا توجد قاعات مُسجّلة</p>
          <Button variant="outline" onClick={openAdd}>
            <Plus size={14} className="ml-2" />
            إضافة قاعة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classrooms.map((classroom) => (
            <Card key={classroom.id} className="relative group">
              <CardContent className="p-5 space-y-3">
                {/* Name + action buttons */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-base leading-tight">{classroom.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(classroom)}
                      title="تعديل"
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(classroom)}
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    سعة: {classroom.capacity ?? 30}
                  </Badge>
                  {classroom.floor && (
                    <Badge variant="outline" className="text-xs">
                      الطابق: {classroom.floor}
                    </Badge>
                  )}
                </div>

                {/* Notes */}
                {classroom.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{classroom.notes}</p>
                )}

                {/* Status */}
                <div>
                  <Badge
                    className={`text-xs ${
                      classroom.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                    variant="outline"
                  >
                    {classroom.status === "active" ? "نشطة" : "غير نشطة"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingClassroom ? "تعديل القاعة" : "إضافة قاعة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="classroom-name">اسم القاعة *</Label>
              <Input
                id="classroom-name"
                placeholder="قاعة أ، قاعة 101..."
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <Label htmlFor="classroom-capacity">السعة (عدد الطلاب)</Label>
              <Input
                id="classroom-capacity"
                type="number"
                min={1}
                placeholder="30"
                {...form.register("capacity", { valueAsNumber: true })}
              />
            </div>

            {/* Floor */}
            <div className="space-y-1.5">
              <Label htmlFor="classroom-floor">الطابق (اختياري)</Label>
              <Input
                id="classroom-floor"
                placeholder="الأول، الثاني..."
                {...form.register("floor")}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="classroom-notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="classroom-notes"
                placeholder="أي ملاحظات إضافية..."
                rows={3}
                {...form.register("notes")}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "جاري الحفظ..." : editingClassroom ? "حفظ التعديلات" : "إضافة القاعة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
