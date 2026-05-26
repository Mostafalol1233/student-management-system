import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sparkles, LayoutDashboard, Users, QrCode, Star, DollarSign, Settings } from "lucide-react";
import type { ActiveSection } from "@/pages/dashboard";

const TOUR_KEY = "onboarding_completed";
const NEW_USER_KEY = "is_new_user";

interface TourStep {
  section: ActiveSection;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const steps: TourStep[] = [
  { section: "overview",            icon: LayoutDashboard, title: "لوحة التحكم",    description: "نظرة شاملة على إحصائيات المركز: الطلاب، الحضور، الإيرادات، والأداء العام — كل شيء في مكان واحد." },
  { section: "student-registration",icon: Users,           title: "تسجيل الطلاب",   description: "سجّل طلابًا جددًا بسهولة أو استورد قائمة كاملة. كل طالب يحصل على كود فريد وبطاقة هوية جاهزة للطباعة." },
  { section: "attendance-scanning", icon: QrCode,          title: "تسجيل الحضور",   description: "امسح رمز QR للطالب بالكاميرا أو أدخل الكود يدويًا لتسجيل الحضور في ثوانٍ." },
  { section: "grade-entry",         icon: Star,            title: "إدخال الدرجات",  description: "أدخل درجات الطلاب في كل مادة وأرسل النتائج مباشرة لأولياء الأمور عبر واتساب." },
  { section: "finance-management",  icon: DollarSign,      title: "النظام المالي",   description: "تابع الرسوم والمدفوعات والمتأخرات. أرسل تذكيرات الدفع تلقائيًا عبر واتساب." },
  { section: "settings",            icon: Settings,        title: "الإعدادات",       description: "خصّص اسم المركز، اللوجو، الألوان، وإعدادات النظام لتعكس هوية مركزك." },
];

interface TourProps {
  onNavigate: (section: ActiveSection) => void;
  onClose: () => void;
}

function TourOverlay({ onNavigate, onClose }: TourProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  useEffect(() => {
    onNavigate(current.section);
  }, [step]);

  const next = () => {
    if (isLast) {
      localStorage.setItem(TOUR_KEY, "true");
      onClose();
    } else {
      setStep(s => s + 1);
    }
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  const skip = () => {
    localStorage.setItem(TOUR_KEY, "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-4 pointer-events-none">
      {/* Dimmed overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={skip} />

      {/* Tour card */}
      <div
        className="relative z-10 w-full max-w-md pointer-events-auto rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        dir="rtl"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  background: i === step ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
              />
            ))}
          </div>
          <button onClick={skip} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <Icon size={18} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">{step + 1} / {steps.length}</p>
              <h3 className="text-[15px] font-bold leading-tight" style={{ color: "hsl(var(--foreground))" }}>{current.title}</h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{current.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 pb-5">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={prev} className="gap-1">
              <ChevronRight size={14} />
              السابق
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground text-xs">
            تخطي الجولة
          </Button>
          <Button size="sm" onClick={next} className="gap-1">
            {isLast ? "ابدأ الاستخدام" : "التالي"}
            {!isLast && <ChevronLeft size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface OnboardingGateProps {
  onNavigate: (section: ActiveSection) => void;
}

export function OnboardingGate({ onNavigate }: OnboardingGateProps) {
  const [state, setState] = useState<"idle" | "asking" | "touring" | "done">("idle");

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      setTimeout(() => setState("asking"), 600);
    }
  }, []);

  if (state === "done" || state === "idle") return null;

  if (state === "asking") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" dir="rtl">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <Sparkles size={24} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h2 className="text-lg font-bold mb-1">مرحبًا بك! 👋</h2>
            <p className="text-sm text-muted-foreground">هل تستخدم النظام لأول مرة؟</p>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => setState("touring")}
            >
              ✨ نعم، أرِني جولة سريعة
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                localStorage.setItem(TOUR_KEY, "true");
                setState("done");
              }}
            >
              لا، أعرف كيف أستخدمه
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "touring") {
    return (
      <TourOverlay
        onNavigate={onNavigate}
        onClose={() => setState("done")}
      />
    );
  }

  return null;
}
