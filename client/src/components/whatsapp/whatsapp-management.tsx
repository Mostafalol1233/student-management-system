import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CheckCircle2, XCircle, Send, RefreshCw, Clock, AlertCircle } from "lucide-react";
import type { Student, Grade } from "@shared/schema";

interface WhatsAppStatus { isConnected: boolean; state: string; }
interface WhatsAppMessage { id: string; to: string; message: string; status: "sent" | "failed" | "pending"; timestamp: string; }

const gradeClass = (g: string | null) => {
  switch (g) {
    case "A": return "grade-a";
    case "B": return "grade-b";
    case "C": return "grade-c";
    case "D": return "grade-d";
    default: return "grade-f";
  }
};

export function WhatsAppManagement() {
  const { toast } = useToast();
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());

  const { data: status, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000,
  });
  const { data: messages = [] } = useQuery<WhatsAppMessage[]>({ queryKey: ["/api/whatsapp/messages"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ["/api/grades"] });

  const connectMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/whatsapp/connect")).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] }); toast({ title: "✅ جاري الاتصال بواتساب" }); },
    onError: (e: any) => toast({ title: "فشل الاتصال", description: e.message, variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/whatsapp/disconnect")).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] }); toast({ title: "✅ تم قطع الاتصال" }); },
  });

  const sendSingleMutation = useMutation({
    mutationFn: async (gradeId: string) =>
      (await apiRequest("POST", "/api/whatsapp/send-grade-notification", { gradeIds: [gradeId] })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      toast({ title: "✅ تم إرسال الإشعار" });
    },
    onError: (e: any) => toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" }),
  });

  const sendSelectedMutation = useMutation({
    mutationFn: async (gradeIds: string[]) =>
      (await apiRequest("POST", "/api/whatsapp/send-grade-notification", { gradeIds })).json(),
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      setSelectedGrades(new Set());
      toast({ title: "✅ تم الإرسال الجماعي", description: `أُرسل ${r.sent} من ${r.total} رسالة` });
    },
    onError: (e: any) => toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" }),
  });

  const isConnected = status?.isConnected ?? false;
  const unsentGrades = grades.filter(g => !g.sentToParent);
  const sentGradesCount = grades.filter(g => g.sentToParent).length;
  const sentMsgCount = messages.filter(m => m.status === "sent").length;
  const failedMsgCount = messages.filter(m => m.status === "failed").length;

  const toggleGrade = (id: string) => {
    setSelectedGrades(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selectedGrades.size === unsentGrades.length) setSelectedGrades(new Set());
    else setSelectedGrades(new Set(unsentGrades.map(g => g.id)));
  };

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                <MessageCircle size={22} className={isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"} />
              </div>
              <div>
                <h3 className="font-semibold">اتصال واتساب</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                  <span className={`text-sm ${isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} data-testid="text-connection-status">
                    {isConnected ? "متصل" : "غير متصل"}
                  </span>
                  {status?.state && <Badge variant="outline" className="text-xs">{status.state}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetchStatus()} data-testid="button-refresh-status">
                <RefreshCw size={14} />
              </Button>
              {isConnected ? (
                <Button
                  variant="outline"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  data-testid="button-disconnect"
                >
                  <XCircle size={14} className="mr-2" />
                  قطع الاتصال
                </Button>
              ) : (
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-connect"
                >
                  <MessageCircle size={14} className="mr-2" />
                  {connectMutation.isPending ? "جاري الاتصال..." : "الاتصال بواتساب"}
                </Button>
              )}
            </div>
          </div>

          {!isConnected && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                <AlertCircle size={14} />
                كيفية الاتصال
              </div>
              <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-500">
                اضغط "الاتصال بواتساب" ثم امسح رمز QR الذي سيظهر باستخدام تطبيق واتساب على هاتفك. بعد الاتصال، يمكنك إرسال إشعارات الدرجات لأولياء الأمور تلقائياً.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "في الانتظار", value: unsentGrades.length, icon: Clock, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", testId: "text-unsent-count" },
          { label: "أُرسلت", value: sentMsgCount, icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", testId: "text-sent-count" },
          { label: "فشل الإرسال", value: failedMsgCount, icon: XCircle, bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", testId: "text-failed-count" },
        ].map(({ label, value, icon: Icon, bg, text, testId }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={text} />
            </div>
            <div>
              <div className="text-xl font-bold" data-testid={testId}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" data-testid="tab-pending">
            درجات في الانتظار
            {unsentGrades.length > 0 && <Badge className="mr-2 h-4 min-w-4 text-xs" variant="secondary">{unsentGrades.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">سجل الرسائل</TabsTrigger>
        </TabsList>

        {/* Pending Grades */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">درجات لم تُرسل بعد</h3>
                <Badge variant="secondary">{unsentGrades.length}</Badge>
              </div>
              {selectedGrades.size > 0 && (
                <Button
                  size="sm"
                  onClick={() => sendSelectedMutation.mutate(Array.from(selectedGrades))}
                  disabled={sendSelectedMutation.isPending || !isConnected}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                  data-testid="button-send-selected"
                >
                  <Send size={12} className="mr-1" />
                  إرسال المحدد ({selectedGrades.size})
                </Button>
              )}
            </div>
            <CardContent className="p-0">
              {unsentGrades.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-500" />
                  <p className="text-sm font-medium">جميع الدرجات أُرسلت!</p>
                  <p className="text-xs text-muted-foreground mt-1">لا توجد درجات في الانتظار</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedGrades.size === unsentGrades.length && unsentGrades.length > 0}
                            onChange={toggleAll}
                            className="rounded"
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>الطالب</TableHead>
                        <TableHead>المادة</TableHead>
                        <TableHead>الدرجة</TableHead>
                        <TableHead>التقدير</TableHead>
                        <TableHead>هاتف ولي الأمر</TableHead>
                        <TableHead>إرسال</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unsentGrades.map((grade) => {
                        const student = students.find(s => s.id === grade.studentId);
                        const pct = Math.round((grade.score / grade.totalMarks) * 100);
                        return (
                          <TableRow key={grade.id} className={`hover:bg-muted/30 ${selectedGrades.has(grade.id) ? "bg-primary/5" : ""}`} data-testid={`row-pending-${grade.id}`}>
                            <TableCell>
                              <input type="checkbox" checked={selectedGrades.has(grade.id)} onChange={() => toggleGrade(grade.id)} className="rounded" data-testid={`checkbox-grade-${grade.id}`} />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{student?.name || "غير معروف"}</div>
                              <div className="text-xs text-muted-foreground">{student?.gradeLevel} - {student?.section}</div>
                            </TableCell>
                            <TableCell className="text-sm" data-testid={`text-pending-subject-${grade.id}`}>{grade.subject}</TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{grade.score}/{grade.totalMarks}</span>
                              <div className="text-xs text-muted-foreground">{pct}%</div>
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${gradeClass(grade.grade)}`}>{grade.grade}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{student?.guardianPhone || "—"}</TableCell>
                            <TableCell>
                              <Button
                                size="sm" variant="outline"
                                onClick={() => sendSingleMutation.mutate(grade.id)}
                                disabled={sendSingleMutation.isPending || !isConnected || !student?.guardianPhone}
                                className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                                data-testid={`button-send-grade-${grade.id}`}
                              >
                                <Send size={11} className="mr-1" />
                                إرسال
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <h3 className="font-semibold">سجل الرسائل المرسلة</h3>
              <Badge variant="secondary">{messages.length}</Badge>
            </div>
            <CardContent className="p-0">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">لا توجد رسائل مرسلة بعد</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>الرقم</TableHead>
                        <TableHead>الرسالة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => (
                        <TableRow key={msg.id} className="hover:bg-muted/30" data-testid={`row-message-${msg.id}`}>
                          <TableCell className="font-mono text-xs">{msg.to}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{msg.message}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                              msg.status === "sent" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : msg.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`} data-testid={`badge-msg-status-${msg.id}`}>
                              {msg.status === "sent" ? <CheckCircle2 size={11} /> : msg.status === "failed" ? <XCircle size={11} /> : <Clock size={11} />}
                              {msg.status === "sent" ? "أُرسلت" : msg.status === "failed" ? "فشل" : "انتظار"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleDateString("ar-SA")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
