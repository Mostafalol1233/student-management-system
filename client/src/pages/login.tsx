import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تسجيل الدخول");
      login(data.token, data.user);
      setLocation("/");
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "hsl(var(--sidebar))" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">نظام إدارة السنتر</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              إدارة سنتر<br />
              <span className="text-primary">احترافية وسريعة</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              نظام متكامل لإدارة الطلاب، الحضور، الدرجات،<br />
              والنظام المالي في مكان واحد.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "طلاب", d: "إدارة كاملة" },
              { n: "حضور", d: "QR سريع" },
              { n: "درجات", d: "تتبع دقيق" },
              { n: "مالية", d: "تقارير فورية" },
            ].map(item => (
              <div key={item.n} className="rounded-lg p-3 border"
                style={{ background: "hsl(var(--sidebar-foreground)/0.05)", borderColor: "hsl(var(--sidebar-foreground)/0.1)" }}>
                <div className="text-white font-semibold text-sm">{item.n}</div>
                <div className="text-white/50 text-xs mt-0.5">{item.d}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">نظام إدارة سنتر © 2025 — جميع الحقوق محفوظة</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-semibold text-foreground">نظام إدارة السنتر</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">مرحباً بعودتك 👋</h2>
            <p className="text-sm text-muted-foreground">سجل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                autoComplete="email"
                required
                data-testid="input-email"
                className="h-11 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  data-testid="input-password"
                  className="h-11 text-sm pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading} data-testid="button-login">
              {loading ? <Loader2 size={16} className="animate-spin ml-2" /> : null}
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          {/* Demo accounts hint */}
          <div className="rounded-lg border border-dashed p-4 space-y-2" style={{ borderColor: "hsl(var(--border))" }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">حسابات تجريبية</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">مدير النظام</span>
                <span className="font-mono">admin@school.edu / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-foreground">الاستقبال</span>
                <span className="font-mono">reception@school.edu / rec123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-foreground">مدرس</span>
                <span className="font-mono">teacher@school.edu / teach123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-foreground">محاسب</span>
                <span className="font-mono">accountant@school.edu / acc123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
