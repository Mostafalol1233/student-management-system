import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Video, Check, X, Users, UserCheck, AlertCircle, Clock } from "lucide-react";
import type { Session, Student, Attendance, InsertAttendance } from "@shared/schema";

declare global { interface Window { Html5Qrcode: any; } }

export default function AttendanceScanner() {
  const [manualCode, setManualCode] = useState("");
  const [manualCodeError, setManualCodeError] = useState("");
  const [manualCodeOk, setManualCodeOk] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<Array<{ student: Student; time: Date }>>([]);
  const qrScannerRef = useRef<any>(null);
  const { toast } = useToast();

  const { data: activeSession } = useQuery<Session | null>({ queryKey: ["/api/sessions/active"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: sessionAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/session", activeSession?.id],
    enabled: !!activeSession?.id,
    refetchInterval: 5000,
  });

  const recordMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => (await apiRequest("POST", "/api/attendance", data)).json(),
    onSuccess: (att: Attendance) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/session", activeSession?.id] });
      const student = students.find(s => s.id === att.studentId);
      if (student) setRecentScans(prev => [{ student, time: new Date() }, ...prev.slice(0, 9)]);
      toast({ title: "✅ تم تسجيل الحضور", description: student?.name });
    },
    onError: (e: any) => toast({ title: "فشل تسجيل الحضور", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!window.Html5Qrcode) {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      document.head.appendChild(s);
    }
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    if (!window.Html5Qrcode) {
      toast({ title: "المسح غير متاح", description: "جاري تحميل مكتبة QR...", variant: "destructive" });
      return;
    }
    try {
      if (!qrScannerRef.current) qrScannerRef.current = new window.Html5Qrcode("qr-reader");
      await qrScannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded: string) => handleCodeScan(decoded, "qr"),
        () => {}
      );
      setIsScanning(true);
    } catch {
      toast({ title: "فشل الوصول للكاميرا", description: "يرجى السماح بالوصول للكاميرا", variant: "destructive" });
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && isScanning) {
      try { await qrScannerRef.current.stop(); } catch {}
      setIsScanning(false);
    }
  };

  const handleCodeScan = (code: string, method: "qr" | "manual") => {
    if (!activeSession) {
      toast({ title: "لا توجد حصة نشطة", description: "يرجى بدء حصة أولاً", variant: "destructive" });
      return;
    }
    const student = students.find(s => s.code === code);
    if (!student) {
      if (method === "manual") setManualCodeError("لا يوجد طالب بهذا الكود");
      return;
    }
    const alreadyPresent = sessionAttendance.some(a => a.studentId === student.id);
    if (alreadyPresent) {
      if (method === "manual") setManualCodeError(`${student.name} سبق تسجيل حضوره`);
      return;
    }
    recordMutation.mutate({ studentId: student.id, sessionId: activeSession.id, status: "present", scanMethod: method });
    if (method === "manual") { setManualCode(""); setManualCodeError(""); setManualCodeOk(""); }
  };

  const validateCode = (code: string) => {
    setManualCodeError(""); setManualCodeOk("");
    if (code.length === 3) {
      const student = students.find(s => s.code === code);
      if (!student) { setManualCodeError("لا يوجد طالب بهذا الكود"); }
      else if (sessionAttendance.some(a => a.studentId === student.id)) {
        setManualCodeError(`${student.name} سبق تسجيل حضوره`);
      } else {
        setManualCodeOk(`جاهز لتسجيل حضور: ${student.name}`);
      }
    }
  };

  const presentCount = sessionAttendance.length;
  const totalStudents = students.length;
  const absentCount = totalStudents - presentCount;
  const attendancePct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const presentStudents = students.filter(s => sessionAttendance.some(a => a.studentId === s.id));
  const absentStudents = students.filter(s => !sessionAttendance.some(a => a.studentId === s.id));

  if (!activeSession) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">لا توجد حصة نشطة</h3>
          <p className="text-sm text-muted-foreground">يرجى إنشاء وبدء حصة من صفحة إدارة الحصص أولاً.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-white pulse-dot"></span>
              <span className="text-sm font-medium text-white/80">حصة نشطة</span>
            </div>
            <h2 className="text-xl font-bold">{activeSession.name}</h2>
            <p className="text-sm text-white/70 mt-0.5">📅 {activeSession.date} · ⏰ {activeSession.time} · ⏱️ {activeSession.duration} دقيقة</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" data-testid="text-present-count">{presentCount}/{totalStudents}</div>
            <div className="text-sm text-white/70">حضور {attendancePct}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${attendancePct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* QR Scanner */}
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">مسح رمز QR</h3>
              </div>
              {isScanning && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot mr-1.5 inline-block"></span>
                  جاري المسح
                </Badge>
              )}
            </div>
            <CardContent className="p-5">
              <div className="rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
                {!isScanning ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
                      <Camera size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">اضغط لتشغيل الكاميرا ومسح رموز QR</p>
                    <Button onClick={startScanner} data-testid="button-enable-camera">
                      <Video size={14} className="mr-2" />
                      تشغيل الكاميرا
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <div id="qr-reader" className="w-full h-full"></div>
                    <Button
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white h-8 text-xs"
                      onClick={stopScanner} data-testid="button-stop-camera"
                    >
                      <X size={12} className="mr-1" /> إيقاف
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <span className="text-base">⌨️</span>
              <h3 className="font-semibold">إدخال الكود يدوياً</h3>
            </div>
            <CardContent className="p-5">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="الكود المكون من 3 أرقام"
                    value={manualCode}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                      setManualCode(v);
                      validateCode(v);
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && manualCode.length === 3 && !manualCodeError) handleCodeScan(manualCode, "manual"); }}
                    maxLength={3}
                    className={`font-mono text-center text-xl h-12 border-2 transition-colors ${
                      manualCodeError ? "border-red-400 focus:border-red-400" :
                      manualCodeOk ? "border-emerald-400 focus:border-emerald-400" :
                      "border-border"
                    }`}
                    data-testid="input-manual-code"
                  />
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        i < manualCode.length ? manualCodeError ? "bg-red-400" : "bg-primary" : "bg-muted"
                      }`} />
                    ))}
                  </div>
                  {manualCodeError && <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{manualCodeError}</p>}
                  {manualCodeOk && !manualCodeError && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><Check size={12} />{manualCodeOk}</p>}
                </div>
                <Button
                  onClick={() => handleCodeScan(manualCode, "manual")}
                  disabled={manualCode.length !== 3 || !!manualCodeError || recordMutation.isPending}
                  className="h-12 px-6"
                  data-testid="button-mark-present"
                >
                  <UserCheck size={16} className="mr-1" />
                  {recordMutation.isPending ? "..." : "تسجيل"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Panel */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card flex-col text-center">
              <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
              <div className="text-xs text-muted-foreground">حاضر</div>
            </div>
            <div className="stat-card flex-col text-center">
              <div className="text-2xl font-bold text-red-500">{absentCount}</div>
              <div className="text-xs text-muted-foreground">غائب</div>
            </div>
          </div>

          {/* Recent Scans */}
          <Card>
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">آخر عمليات التسجيل</h3>
            </div>
            <CardContent className="p-0">
              {recentScans.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">لا توجد عمليات بعد</div>
              ) : (
                <div className="divide-y">
                  {recentScans.map((scan, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-2" data-testid={`recent-scan-${i}`}>
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{scan.student.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scan.time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Absent Students */}
      {absentStudents.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <h3 className="font-semibold">الغائبون</h3>
            <Badge variant="destructive" className="text-xs">{absentStudents.length}</Badge>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>الطالب</TableHead>
                    <TableHead>الكود</TableHead>
                    <TableHead>الصف</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absentStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{student.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{student.code}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.gradeLevel} - {student.section}</TableCell>
                      <TableCell>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleCodeScan(student.code, "manual")}
                          disabled={recordMutation.isPending}
                          className="h-7 text-xs"
                        >
                          <Check size={11} className="mr-1" />
                          تسجيل حضور
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
