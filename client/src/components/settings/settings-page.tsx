import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Palette, GraduationCap, Calendar, DollarSign, Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [local, setLocal] = useState<Record<string, string>>({});

  useEffect(() => { if (Object.keys(settings).length) setLocal(settings); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await Promise.all(Object.entries(data).map(([key, value]) => apiRequest("PUT", `/api/settings/${key}`, { value })));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings"] }); toast({ title: "✅ تم حفظ الإعدادات" }); },
    onError: (e: any) => toast({ title: "فشل الحفظ", description: e.message, variant: "destructive" }),
  });

  const set = (key: string, value: string) => setLocal(prev => ({ ...prev, [key]: value }));
  const get = (key: string, fallback = "") => local[key] ?? fallback;

  return (
    <div className="max-w-3xl space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general"><Settings size={14} className="mr-1" />عام</TabsTrigger>
          <TabsTrigger value="grading"><GraduationCap size={14} className="mr-1" />التقدير</TabsTrigger>
          <TabsTrigger value="semester"><Calendar size={14} className="mr-1" />الفصل</TabsTrigger>
          <TabsTrigger value="finance"><DollarSign size={14} className="mr-1" />المالية</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b"><h3 className="font-semibold">إعدادات عامة</h3></div>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-2">
                <Label>اسم المنصة / السنتر</Label>
                <Input value={get("app_name", "نظام المدرسة")} onChange={e => set("app_name", e.target.value)} placeholder="اسم السنتر" data-testid="input-app-name" />
                <p className="text-xs text-muted-foreground">يظهر في الشريط الجانبي وعنوان المتصفح</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={get("primary_color", "#3b82f6")} onChange={e => set("primary_color", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border" data-testid="input-primary-color" />
                  <Input value={get("primary_color", "#3b82f6")} onChange={e => set("primary_color", e.target.value)} className="font-mono w-32" />
                  <span className="text-xs text-muted-foreground">اضغط لفتح منتقي الألوان</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عملة الرسوم</Label>
                  <Input value={get("currency", "ج")} onChange={e => set("currency", e.target.value)} placeholder="ج / جنيه / EGP" data-testid="input-currency" />
                </div>
                <div className="space-y-2">
                  <Label>رمز الدولة (واتساب)</Label>
                  <Input value={get("country_code", "+20")} onChange={e => set("country_code", e.target.value)} placeholder="+20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading */}
        <TabsContent value="grading" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b"><h3 className="font-semibold">نظام التقدير</h3><p className="text-xs text-muted-foreground mt-0.5">الحد الأدنى للنسبة المئوية لكل تقدير</p></div>
            <CardContent className="p-5 space-y-4">
              {[
                { label: "تقدير A (ممتاز)", key: "grade_a_min", default: "90", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
                { label: "تقدير B (جيد جدًا)", key: "grade_b_min", default: "80", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
                { label: "تقدير C (جيد)", key: "grade_c_min", default: "70", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
                { label: "تقدير D (مقبول)", key: "grade_d_min", default: "60", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
              ].map(({ label, key, default: def, color }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                    {key.replace("grade_", "").replace("_min", "").toUpperCase()}
                  </div>
                  <Label className="flex-1 font-normal">{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="100" value={get(key, def)} onChange={e => set(key, e.target.value)}
                      className="w-20 text-center font-mono" data-testid={`input-${key}`} />
                    <span className="text-sm text-muted-foreground">% فأعلى</span>
                  </div>
                </div>
              ))}
              <div className="mt-3 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                ⚠️ تحت {get("grade_d_min", "60")}% = تقدير F (راسب)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semester */}
        <TabsContent value="semester" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b"><h3 className="font-semibold">إعدادات الفصل الدراسي</h3></div>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>بداية الفصل الدراسي</Label>
                  <Input type="date" value={get("semester_start", "2025-09-01")} onChange={e => set("semester_start", e.target.value)} data-testid="input-semester-start" />
                </div>
                <div className="space-y-2">
                  <Label>نهاية الفصل الدراسي</Label>
                  <Input type="date" value={get("semester_end", "2026-06-30")} onChange={e => set("semester_end", e.target.value)} data-testid="input-semester-end" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>اسم الفصل الدراسي</Label>
                <Input value={get("semester_name", "الفصل الأول 2025-2026")} onChange={e => set("semester_name", e.target.value)} placeholder="مثال: الفصل الأول 2025-2026" />
              </div>
              <div className="space-y-2">
                <Label>درجة النجاح (حد الاجتياز)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="100" value={get("pass_mark", "60")} onChange={e => set("pass_mark", e.target.value)} className="w-24" />
                  <span className="text-sm text-muted-foreground">% من الدرجة الكلية</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b"><h3 className="font-semibold">إعدادات المالية</h3></div>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الرسوم الشهرية الافتراضية</Label>
                  <Input type="number" value={get("default_monthly_fee", "500")} onChange={e => set("default_monthly_fee", e.target.value)} placeholder="500" data-testid="input-default-fee" />
                </div>
                <div className="space-y-2">
                  <Label>يوم استحقاق الرسوم</Label>
                  <Input type="number" min="1" max="31" value={get("due_day", "5")} onChange={e => set("due_day", e.target.value)} placeholder="1-31" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>رسالة واتساب للتذكير بالدفع</Label>
                <textarea
                  value={get("payment_reminder_template", "السلام عليكم، نود التذكير بموعد سداد رسوم {student_name} البالغة {amount} {currency}. يرجى السداد قبل {due_date}.")}
                  onChange={e => set("payment_reminder_template", e.target.value)}
                  className="w-full min-h-[100px] text-sm border rounded-lg p-3 bg-background resize-y"
                  placeholder="نص رسالة التذكير..."
                />
                <p className="text-xs text-muted-foreground">المتغيرات المتاحة: {"{student_name}"}, {"{amount}"}, {"{currency}"}, {"{due_date}"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <Button className="w-full" size="lg" onClick={() => saveMutation.mutate(local)} disabled={saveMutation.isPending} data-testid="button-save-settings">
        <Save size={16} className="mr-2" />{saveMutation.isPending ? "جاري الحفظ..." : "حفظ جميع الإعدادات"}
      </Button>
    </div>
  );
}
