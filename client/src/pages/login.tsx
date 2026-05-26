import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Users, QrCode, Star, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@school.edu");
  const [password, setPassword] = useState("admin123");
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
      toast({ title: "خطأ في تسجيل الدخول", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users,  label: "طلاب",  desc: "إدارة كاملة" },
    { icon: QrCode, label: "حضور",  desc: "QR سريع"     },
    { icon: Star,   label: "درجات", desc: "تتبع دقيق"   },
    { icon: Wallet, label: "مالية", desc: "تقارير فورية" },
  ];

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* ── Left / Branding Panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--sidebar-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--sidebar-foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo row */}
        <div className="relative flex items-center gap-3">
          <img src="/logo.svg" alt="Center M" className="w-9 h-9 rounded-xl" />
          <span className="text-white font-semibold text-[15px] tracking-tight">Center M</span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-10">
          <div className="space-y-4">
            <h1 className="text-[42px] font-bold text-white leading-[1.15] tracking-tight">
              إدارة سنتر<br />
              <span style={{ color: "hsl(var(--sidebar-primary))" }}>احترافية وسريعة</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-xs">
              نظام متكامل لإدارة الطلاب، الحضور، الدرجات،<br />
              والنظام المالي في مكان واحد.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: "hsl(var(--sidebar-foreground)/0.05)",
                  border: "1px solid hsl(var(--sidebar-foreground)/0.08)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--sidebar-primary)/0.2)" }}
                >
                  <Icon size={15} style={{ color: "hsl(var(--sidebar-primary))" }} />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold leading-tight">{label}</div>
                  <div className="text-white/40 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-xs">
          Center M © 2025 — جميع الحقوق محفوظة
        </p>
      </div>

      {/* ── Right / Form Panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[340px] space-y-7">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <img src="/logo.svg" alt="Center M" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-foreground">Center M</span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-[22px] font-bold text-foreground tracking-tight">مرحباً بك</h2>
            <p className="text-sm text-muted-foreground">سجّل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                autoComplete="email"
                required
                data-testid="input-email"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium">كلمة المرور</Label>
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
                  className="h-10 text-sm pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={loading} data-testid="button-login">
              {loading && <Loader2 size={14} className="animate-spin ml-2" />}
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          {/* Demo accounts */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.4)" }}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">حسابات تجريبية</p>
            <div className="space-y-2">
              {[
                { role: "مدير النظام",  email: "admin@school.edu",     pass: "admin123" },
                { role: "الاستقبال",    email: "reception@school.edu", pass: "rec123"   },
                { role: "مدرس",         email: "teacher@school.edu",   pass: "teach123" },
                { role: "محاسب",        email: "accountant@school.edu",pass: "acc123"   },
              ].map(({ role, email: e, pass }) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmail(e); setPassword(pass); }}
                  className="w-full flex items-center justify-between text-xs rounded-lg px-3 py-2 hover:bg-muted transition-colors text-right"
                  data-testid={`demo-${role}`}
                >
                  <span className="font-semibold text-foreground">{role}</span>
                  <span className="font-mono text-muted-foreground">{pass}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
