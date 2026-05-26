import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Session, Group } from "@shared/schema";
import { Calendar, Clock, Play, CheckCircle2 } from "lucide-react";

const DAYS = ["السبت","الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
const DAY_KEYS = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm

function formatHour(h: number) {
  const ampm = h < 12 ? "ص" : "م";
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
}

function getDayOfWeek(dateStr: string) {
  const d = new Date(dateStr);
  return DAY_KEYS[d.getDay() === 0 ? 6 : d.getDay() - 1]; // adjust for Saturday-first
}

function timeToHour(timeStr: string) {
  const [h] = timeStr.split(":").map(Number);
  return h;
}

export default function Timetable() {
  const { toast } = useToast();
  const { data: sessions = [] } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: groups = [] } = useQuery<Group[]>({ queryKey: ["/api/groups"] });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await apiRequest("PUT", `/api/sessions/${id}`, { status })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sessions"] }); toast({ title: "✅ تم تحديث الحصة" }); },
  });

  const getGroupColor = (groupId: string | null) => {
    if (!groupId) return "#6b7280";
    const group = groups.find(g => g.id === groupId);
    return group?.color || "#3b82f6";
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null;
    return groups.find(g => g.id === groupId)?.name;
  };

  // Group sessions by day
  const sessionsByDay: Record<string, Session[]> = {};
  DAY_KEYS.forEach(d => { sessionsByDay[d] = []; });
  sessions.forEach(s => {
    const day = getDayOfWeek(s.date);
    if (sessionsByDay[day]) sessionsByDay[day].push(s);
  });

  const scheduled = sessions.filter(s => s.status === "scheduled").length;
  const active = sessions.filter(s => s.status === "active").length;
  const completed = sessions.filter(s => s.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "مجدولة", value: scheduled, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "نشطة الآن", value: active, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "مكتملة", value: completed, color: "text-muted-foreground", bg: "bg-muted" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg} text-center`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Weekly Grid */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <h3 className="font-semibold">الجدول الأسبوعي</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            {/* Header row */}
            <div className="border-b border-r py-2 px-1 text-center text-xs text-muted-foreground bg-muted/30">وقت</div>
            {DAYS.map((day, i) => (
              <div key={day} className="border-b border-r last:border-r-0 py-2 text-center">
                <div className="text-sm font-semibold">{day}</div>
                <div className="text-xs text-muted-foreground">{sessionsByDay[DAY_KEYS[i]].length} حصة</div>
              </div>
            ))}

            {/* Time rows */}
            {HOURS.map(hour => (
              <div key={hour} className="contents">
                <div className="border-b border-r py-3 px-1 text-center text-xs text-muted-foreground bg-muted/10 flex items-start justify-center pt-2">
                  {formatHour(hour)}
                </div>
                {DAY_KEYS.map((dayKey, di) => {
                  const daySessions = sessionsByDay[dayKey].filter(s => timeToHour(s.time) === hour);
                  return (
                    <div key={dayKey} className="border-b border-r last:border-r-0 p-1 min-h-[60px] relative">
                      {daySessions.map(session => {
                        const color = getGroupColor(session.groupId);
                        const groupName = getGroupName(session.groupId);
                        return (
                          <div key={session.id}
                            className="rounded-md p-1.5 mb-1 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            style={{ backgroundColor: color }}
                            title={`${session.name} - ${session.time} (${session.duration} دقيقة)`}
                            data-testid={`timetable-session-${session.id}`}>
                            <div className="font-medium leading-tight truncate">{session.name}</div>
                            {groupName && <div className="opacity-80 truncate text-[10px]">{groupName}</div>}
                            <div className="opacity-70 text-[10px] flex items-center gap-0.5 mt-0.5">
                              <Clock size={8} />{session.time}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Session List */}
      <Card>
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" /><h3 className="font-semibold">جميع الحصص</h3>
        </div>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm"><Calendar size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد حصص مجدولة بعد</p></div>
          ) : (
            <div className="divide-y">
              {[...sessions].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).map(session => {
                const color = getGroupColor(session.groupId);
                const groupName = getGroupName(session.groupId);
                return (
                  <div key={session.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30" data-testid={`session-row-${session.id}`}>
                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{session.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{session.date}</span><span>·</span><span>{session.time}</span><span>·</span><span>{session.duration} دقيقة</span>
                        {groupName && <><span>·</span><span>{groupName}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.status === "active" ? "default" : session.status === "completed" ? "secondary" : "outline"} className="text-xs">
                        {session.status === "scheduled" ? "مجدولة" : session.status === "active" ? "نشطة" : "مكتملة"}
                      </Badge>
                      {session.status === "scheduled" && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: session.id, status: "active" })} data-testid={`button-start-session-${session.id}`}>
                          <Play size={11} className="mr-1" />بدء
                        </Button>
                      )}
                      {session.status === "active" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: session.id, status: "completed" })} data-testid={`button-end-session-${session.id}`}>
                          <CheckCircle2 size={11} className="mr-1" />إنهاء
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
