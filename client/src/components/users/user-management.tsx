import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Trash2, Edit, Key, Save, Eye, EyeOff, UserCheck, UserX, Users, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  teacherId?: string | null;
  createdAt?: string;
}

const ROLES = [
  { value: "admin",      label: "مدير النظام",  color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "reception",  label: "الاستقبال",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"         },
  { value: "teacher",    label: "مدرس",          color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "accountant", label: "محاسب",         color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"     },
];

function roleLabel(role: string) { return ROLES.find(r => r.value === role)?.label ?? role; }
function roleColor(role: string) { return ROLES.find(r => r.value === role)?.color ?? "bg-gray-100 text-gray-600"; }

export default function UserManagement() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showCreatePass, setShowCreatePass] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reception", status: "active" });
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const r = await fetch("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!r.ok) throw new Error("فشل تحميل المستخدمين");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/users", data)).json(),
    onSuccess: (u: User) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "reception", status: "active" });
      toast({ title: `✅ تم إنشاء حساب: ${u.name}` });
    },
    onError: (e: any) => toast({ title: "فشل الإنشاء", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) =>
      (await apiRequest("PUT", `/api/users/${id}`, updates)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({ title: "✅ تم تحديث الحساب" });
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "✅ تم حذف الحساب" });
    },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const resetPassMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      (await apiRequest("PUT", `/api/users/${id}`, { password })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setResetUser(null);
      setNewPass("");
      toast({ title: "✅ تم تغيير كلمة المرور" });
    },
    onError: (e: any) => toast({ title: "فشل تغيير كلمة المرور", description: e.message, variant: "destructive" }),
  });

  const activeCount = users.filter(u => u.status === "active").length;
  const byRole = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length })).filter(r => r.count > 0);

  return (
    <div className="space-y-6">
      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={o => { setShowCreate(o); if (!o) setForm({ name:"",email:"",password:"",role:"reception",status:"active" }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus size={16} />إنشاء حساب جديد</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label className="text-xs">الاسم الكامل *</Label>
              <Input className="h-9" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="محمد أحمد" />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">البريد الإلكتروني *</Label>
              <Input className="h-9" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@school.edu" />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">كلمة المرور *</Label>
              <div className="relative">
                <Input className="h-9 pl-9" type={showCreatePass ? "text" : "password"} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="8 أحرف على الأقل" />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCreatePass(p => !p)}>
                  {showCreatePass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">الدور الوظيفي *</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full mt-1" disabled={createMutation.isPending || !form.name || !form.email || form.password.length < 6}
              onClick={() => createMutation.mutate(form)}>
              <Plus size={14} className="mr-2" />
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={o => { if (!o) setEditingUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit size={16} />تعديل الحساب</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label className="text-xs">الاسم الكامل</Label>
              <Input className="h-9" value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">البريد الإلكتروني</Label>
              <Input className="h-9" type="email" value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">الدور الوظيفي</Label>
                <Select value={editForm.role || ""} onValueChange={v => setEditForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">الحالة</Label>
                <Select value={editForm.status || "active"} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" disabled={updateMutation.isPending}
              onClick={() => editingUser && updateMutation.mutate({ id: editingUser.id, updates: editForm })}>
              <Save size={14} className="mr-2" />
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={o => { if (!o) { setResetUser(null); setNewPass(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key size={16} />إعادة تعيين كلمة المرور</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">تغيير كلمة مرور: <strong>{resetUser?.name}</strong></p>
          <div className="space-y-3 pt-1">
            <div className="relative">
              <Input className="h-9 pl-9" type={showNewPass ? "text" : "password"} value={newPass}
                onChange={e => setNewPass(e.target.value)} placeholder="كلمة المرور الجديدة" />
              <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNewPass(p => !p)}>
                {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button className="w-full" disabled={newPass.length < 6 || resetPassMutation.isPending}
              onClick={() => resetUser && resetPassMutation.mutate({ id: resetUser.id, password: newPass })}>
              <Key size={14} className="mr-2" />
              {resetPassMutation.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {byRole.map(r => (
            <div key={r.value} className={`text-xs px-3 py-1.5 rounded-full font-medium ${r.color}`}>
              {r.label}: {r.count}
            </div>
          ))}
          <Badge variant="outline">{activeCount} نشط</Badge>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-user">
          <Plus size={14} className="mr-2" />مستخدم جديد
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Shield size={15} className="text-muted-foreground" />
          <h3 className="font-semibold">حسابات المستخدمين</h3>
          <Badge variant="secondary">{users.length}</Badge>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Users size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">لا توجد حسابات بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">الاسم</TableHead>
                  <TableHead className="text-xs">البريد الإلكتروني</TableHead>
                  <TableHead className="text-xs">الدور</TableHead>
                  <TableHead className="text-xs">الحالة</TableHead>
                  <TableHead className="text-xs">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-xs">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/20" data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                          {user.name.slice(0, 1)}
                        </div>
                        <span className="font-medium text-sm">{user.name}</span>
                        {user.status !== "active" && <Lock size={12} className="text-muted-foreground" title="حساب معطّل" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{user.email}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${user.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {user.status === "active" ? <UserCheck size={10} /> : <UserX size={10} />}
                        {user.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700"
                          onClick={() => { setEditingUser(user); setEditForm({ name: user.name, email: user.email, role: user.role, status: user.status }); }}
                          title="تعديل" data-testid={`button-edit-user-${user.id}`}>
                          <Edit size={12} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600"
                          onClick={() => setResetUser(user)}
                          title="تغيير كلمة المرور" data-testid={`button-reset-pass-${user.id}`}>
                          <Key size={12} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => {
                            if (authUser?.id === user.id) return;
                            updateMutation.mutate({ id: user.id, updates: { status: user.status === "active" ? "inactive" : "active" } });
                          }}
                          title={authUser?.id === user.id ? "لا يمكن تعطيل حسابك الخاص" : (user.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب")}
                          disabled={authUser?.id === user.id}
                          data-testid={`button-toggle-user-${user.id}`}>
                          {user.status === "active" ? <UserX size={12} className="text-orange-500" /> : <UserCheck size={12} className="text-emerald-500" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm(`حذف حساب "${user.name}"؟ لا يمكن التراجع.`)) deleteMutation.mutate(user.id); }}
                          title="حذف" data-testid={`button-delete-user-${user.id}`}>
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

      {/* Security Note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30 p-4">
        <div className="flex items-start gap-3">
          <Shield size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">ملاحظات الأمان</p>
            <ul className="text-xs text-amber-700/80 dark:text-amber-500 mt-1 space-y-1 list-disc list-inside">
              <li>يملك مدير النظام صلاحية كاملة على جميع البيانات</li>
              <li>يملك الاستقبال صلاحية إدارة الطلاب والحضور فقط</li>
              <li>يملك المحاسب صلاحية النظام المالي فقط</li>
              <li>لا تشارك كلمات المرور — استخدم "تغيير كلمة المرور" عند الحاجة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
