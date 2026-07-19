import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, GraduationCap, Calendar, DollarSign, Save, Upload, ImageIcon, X, Download, ShieldCheck, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuditLogViewer from "./audit-log-viewer";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [local, setLocal] = useState<Record<string, string>>({});
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

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

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPw !== confirmPw) throw new Error("كلمة المرور الجديدة وتأكيدها غير متطابقتين");
      if (newPw.length < 6) throw new Error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      await apiRequest("POST", "/api/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
    },
    onSuccess: () => {
      toast({ title: "✅ تم تغيير كلمة المرور بنجاح" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    },
    onError: (e: any) => toast({ title: "فشل تغيير كلمة المرور", description: e.message, variant: "destructive" }),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "نوع ملف غير صحيح", description: "يرجى اختيار صورة", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      set("logo_url", base64);
    };
    reader.readAsDataURL(file);
  };

  const logoUrl = get("logo_url");

  return (
    <div className="max-w-3xl space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general"><Settings size={14} className="mr-1" />عام</TabsTrigger>
          <TabsTrigger value="grading"><GraduationCap size={14} className="mr-1" />التقدير</TabsTrigger>
          <TabsTrigger value="semester"><Calendar size={14} className="mr-1" />الفصل</TabsTrigger>
          <TabsTrigger value="finance"><DollarSign size={14} className="mr-1" />المالية</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck size={14} className="mr-1" />الأمان</TabsTrigger>
          <TabsTrigger value="audit"><FileText size={14} className="mr-1" />سجل التدقيق</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4 space-y-4">
          {/* Identity Card */}
          <Card>
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold">هوية المركز</h3>
              <p className="text-xs text-muted-foreground mt-0.5">الاسم واللوجو يظهران في الشريط الجانبي وبطاقات الطلاب</p>
            </div>
            <CardContent className="p-5 space-y-5">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>لوجو المركز</Label>
                <div className="flex items-center gap-4">
                  {/* Logo preview */}
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ borderColor: logoUrl ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon size={20} />
                        <span className="text-[10px]">لا يوجد</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => logoInputRef.current?.click()}
                      data-testid="button-upload-logo"
                    >
                      <Upload size={13} />
                      رفع لوجو
                    </Button>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => set("logo_url", "")}
                      >
                        <X size={12} />
                        حذف اللوجو
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">PNG أو JPG — بحد أقصى 2 ميجا</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>اسم المركز / السنتر</Label>
                <Input
                  value={get("app_name", "نظام المدرسة")}
                  onChange={e => set("app_name", e.target.value)}
                  placeholder="مثال: سنتر M"
                  data-testid="input-app-name"
                />
                <p className="text-xs text-muted-foreground">يظهر في الشريط الجانبي وبطاقات الطلاب وعنوان المتصفح</p>
              </div>

              <div className="space-y-2">
                <Label>الوصف / الشعار النصي (اختياري)</Label>
                <Input
                  value={get("app_tagline", "")}
                  onChange={e => set("app_tagline", e.target.value)}
                  placeholder="مثال: تعليم احترافي لمستقبل مشرق"
                  data-testid="input-app-tagline"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={get("primary_color", "#6366f1")}
                    onChange={e => set("primary_color", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                    data-testid="input-primary-color"
                  />
                  <Input
                    value={get("primary_color", "#6366f1")}
                    onChange={e => set("primary_color", e.target.value)}
                    className="font-mono w-32"
                  />
                  <span className="text-xs text-muted-foreground">اضغط لفتح منتقي الألوان</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عملة الرسوم</Label>
                  <Input value={get("currency", "جنيه")} onChange={e => set("currency", e.target.value)} placeholder="جنيه / EGP" data-testid="input-currency" />
                </div>
                <div className="space-y-2">
                  <Label>رمز الدولة (واتساب)</Label>
                  <Input value={get("country_code", "+20")} onChange={e => set("country_code", e.target.value)} placeholder="+20" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>قائمة الصفوف الدراسية</Label>
                <Input
                  value={get("grades_list", "")}
                  onChange={e => set("grades_list", e.target.value)}
                  placeholder="الصف الأول,الصف الثاني,Grade 7,Grade 8,..."
                  data-testid="input-grades-list"
                />
                <p className="text-xs text-muted-foreground">أدخل الصفوف مفصولة بفواصل — تظهر في قوائم تسجيل الطلاب والمجموعات</p>
              </div>

              <div className="space-y-2">
                <Label>قائمة الشُعب</Label>
                <Input
                  value={get("sections_list", "")}
                  onChange={e => set("sections_list", e.target.value)}
                  placeholder="A,B,C,أ,ب,ج,..."
                  data-testid="input-sections-list"
                />
                <p className="text-xs text-muted-foreground">أدخل الشُعب مفصولة بفواصل — تظهر في قوائم تسجيل الطلاب والمجموعات</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading */}
        <TabsContent value="grading" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold">نظام التقدير</h3>
              <p className="text-xs text-muted-foreground mt-0.5">الحد الأدنى للنسبة المئوية لكل تقدير</p>
            </div>
            <CardContent className="p-5 space-y-4">
              {[
                { label: "تقدير A (ممتاز)", key: "grade_a_min", default: "90", letter: "A", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
                { label: "تقدير B (جيد جدًا)", key: "grade_b_min", default: "80", letter: "B", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
                { label: "تقدير C (جيد)", key: "grade_c_min", default: "70", letter: "C", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
                { label: "تقدير D (مقبول)", key: "grade_d_min", default: "60", letter: "D", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
              ].map(({ label, key, default: def, letter, color }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>{letter}</div>
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
        {/* Audit Log */}
        <TabsContent value="audit" className="mt-4">
          {user?.role === "admin" ? (
            <AuditLogViewer />
          ) : (
            <div className="p-10 text-center text-muted-foreground text-sm">
              ليس لديك صلاحية عرض سجل التدقيق
            </div>
          )}
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold">تغيير كلمة المرور</h3>
              <p className="text-xs text-muted-foreground mt-0.5">يُنصح بتغيير كلمة المرور بعد أول تسجيل دخول</p>
            </div>
            <CardContent className="p-5 space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label>كلمة المرور الحالية</Label>
                <Input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label>تأكيد كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  data-testid="input-confirm-password"
                />
              </div>
              {newPw && confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
              )}
              <Button
                onClick={() => changePasswordMutation.mutate()}
                disabled={!currentPw || !newPw || !confirmPw || changePasswordMutation.isPending}
                className="w-full"
                data-testid="button-change-password"
              >
                <ShieldCheck size={14} className="mr-2" />
                {changePasswordMutation.isPending ? "جاري الحفظ..." : "تغيير كلمة المرور"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold">معلومات الأمان</h3>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <span className="text-amber-600 text-lg">⚠️</span>
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">تأكد من ضبط JWT_SECRET في متغيرات البيئة</p>
                  <p>يجب تعيين متغير البيئة <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">JWT_SECRET</code> بقيمة عشوائية وطويلة قبل النشر.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-blue-600 text-lg">🔒</span>
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-semibold">الجلسة صالحة لمدة 7 أيام</p>
                  <p>يتم تسجيل الخروج تلقائياً بعد انتهاء صلاحية رمز الجلسة.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => saveMutation.mutate(local)}
        disabled={saveMutation.isPending}
        data-testid="button-save-settings"
      >
        <Save size={16} className="mr-2" />
        {saveMutation.isPending ? "جاري الحفظ..." : "حفظ جميع الإعدادات"}
      </Button>

      {/* Backend Export */}
      <div className="border rounded-xl p-5 space-y-3" style={{ borderColor: "hsl(var(--border))" }}>
        <div>
          <h3 className="font-semibold text-sm">تصدير الباك-إيند</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            حمّل ملف ZIP يحتوي على كود الباك-إيند كاملاً مع تعليمات النشر على أي سيرفر Node.js
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => { window.location.href = "/api/export/backend"; }}
          data-testid="button-export-backend"
        >
          <Download size={14} />
          تحميل ZIP للنشر
        </Button>
      </div>
    </div>
  );
}
