import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, Users } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

interface PnlData {
  revenue: number;
  expenses: number;
  salaries: number;
  net: number;
}

export default function PnlReport() {
  const { get } = useSettings();
  const currency = get("currency", "جنيه");

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [queryParams, setQueryParams] = useState<{ month: string; year: string } | null>(null);

  const { data, isFetching, isError } = useQuery<PnlData>({
    queryKey: ["/api/reports/pnl", queryParams?.month, queryParams?.year],
    queryFn: async () => {
      const res = await fetch(`/api/reports/pnl?month=${queryParams!.month}&year=${queryParams!.year}`);
      if (!res.ok) throw new Error("فشل تحميل البيانات");
      return res.json();
    },
    enabled: !!queryParams,
  });

  const handleFetch = () => {
    setQueryParams({ month, year });
  };

  const fmt = (n: number) => n.toLocaleString("ar-EG");

  const totalOut = data ? data.expenses + data.salaries : 0;
  const totalIn = data ? data.revenue : 0;
  const totalAll = totalIn + totalOut;
  const revenueRatio = totalAll > 0 ? (totalIn / totalAll) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">الشهر</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-8 text-sm w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARABIC_MONTHS.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">السنة</Label>
              <Input
                type="number"
                className="h-8 text-sm w-24"
                value={year}
                onChange={e => setYear(e.target.value)}
                min="2000"
                max="2100"
              />
            </div>
            <Button className="h-8 text-sm" onClick={handleFetch} disabled={isFetching}>
              {isFetching ? "جاري التحميل..." : "تحديث"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {isError && (
        <Card>
          <CardContent className="p-6 text-center text-red-600 text-sm">
            فشل تحميل بيانات التقرير. تأكد من الاتصال وحاول مجدداً.
          </CardContent>
        </Card>
      )}

      {/* Metric Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue */}
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight text-emerald-700 dark:text-emerald-400">
                  {fmt(data.revenue)} {currency}
                </div>
                <div className="text-xs text-muted-foreground">الإيرادات</div>
              </div>
            </div>

            {/* Expenses */}
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight text-red-700 dark:text-red-400">
                  {fmt(data.expenses)} {currency}
                </div>
                <div className="text-xs text-muted-foreground">المصروفات</div>
              </div>
            </div>

            {/* Salaries */}
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight text-orange-700 dark:text-orange-400">
                  {fmt(data.salaries)} {currency}
                </div>
                <div className="text-xs text-muted-foreground">الرواتب</div>
              </div>
            </div>

            {/* Net */}
            <div className="stat-card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${data.net >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                <Wallet size={18} className={data.net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"} />
              </div>
              <div>
                <div className={`text-lg font-bold leading-tight ${data.net >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
                  {data.net >= 0 ? "+" : ""}{fmt(data.net)} {currency}
                </div>
                <div className="text-xs text-muted-foreground">صافي الربح</div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="text-sm font-semibold">نسبة الإيرادات مقابل المصروفات</div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs w-20 text-muted-foreground">الإيرادات</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${revenueRatio}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-32 text-left">
                    {fmt(data.revenue)} {currency} ({Math.round(revenueRatio)}%)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-20 text-muted-foreground">المصروفات + الرواتب</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${100 - revenueRatio}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-32 text-left">
                    {fmt(totalOut)} {currency} ({Math.round(100 - revenueRatio)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center">
            * يعتمد التقرير على الدفعات المسجلة (المدفوع) والمصروفات والرواتب للشهر والسنة المحددين.
          </p>
        </>
      )}

      {!data && !isFetching && !isError && (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground text-sm">
            اختر الشهر والسنة ثم اضغط "تحديث" لعرض تقرير الأرباح والخسائر.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
