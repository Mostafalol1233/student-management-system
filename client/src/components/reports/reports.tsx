import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, TrendingUp, Calendar, Download, FileText, Target, Award, AlertTriangle, BarChart2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Session, Attendance, Grade } from "@shared/schema";

const gradeClass = (g: string | null) => {
  switch (g) {
    case "A": return "grade-a";
    case "B": return "grade-b";
    case "C": return "grade-c";
    case "D": return "grade-d";
    default: return "grade-f";
  }
};

export default function Reports() {
  const { toast } = useToast();
  const [gradeFilter, setGradeFilter] = useState("all");

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: sessions = [] } = useQuery<Session[]>({ queryKey: ["/api/sessions"] });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ["/api/grades"] });

  const analytics = useMemo(() => {
    const totalStudents = students.length;
    const completedSessions = sessions.filter(s => s.status === "completed").length;
    const classAverage = grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / grades.length : 0;
    const gradeDistribution = {
      A: grades.filter(g => g.grade === "A").length,
      B: grades.filter(g => g.grade === "B").length,
      C: grades.filter(g => g.grade === "C").length,
      D: grades.filter(g => g.grade === "D").length,
      F: grades.filter(g => g.grade === "F").length,
    };
    const subjectPerformance = Array.from(new Set(grades.map(g => g.subject))).map(subject => {
      const sg = grades.filter(g => g.subject === subject);
      const average = sg.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / sg.length;
      return { subject, average, count: sg.length };
    }).sort((a, b) => b.average - a.average);
    const atRiskStudents = students.filter(student => {
      const sg = grades.filter(g => g.studentId === student.id);
      if (sg.length === 0) return false;
      const avg = sg.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / sg.length;
      return avg < 60;
    });
    const topStudents = students.map(student => {
      const sg = grades.filter(g => g.studentId === student.id);
      const avg = sg.length > 0 ? sg.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / sg.length : 0;
      return { student, avg, count: sg.length };
    }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);
    return { totalStudents, completedSessions, classAverage, gradeDistribution, subjectPerformance, atRiskStudents, topStudents };
  }, [students, sessions, grades]);

  const filteredStudents = gradeFilter === "all"
    ? students
    : students.filter(s => s.gradeLevel === gradeFilter);

  const uniqueGrades = Array.from(new Set(students.map(s => s.gradeLevel)));

  const exportCSV = (type: string) => {
    let csv = "";
    if (type === "grades") {
      csv = "الطالب,المادة,نوع التقييم,الدرجة,الكلي,النسبة,التقدير,التاريخ\n";
      grades.forEach(g => {
        const student = students.find(s => s.id === g.studentId);
        const pct = Math.round((g.score / g.totalMarks) * 100);
        csv += `"${student?.name || ""}","${g.subject}","${g.assessmentType}",${g.score},${g.totalMarks},${pct}%,${g.grade},"${new Date(g.createdAt!).toLocaleDateString("ar-SA")}"\n`;
      });
    } else {
      csv = "الطالب,الكود,الصف,الشعبة,هاتف ولي الأمر\n";
      students.forEach(s => {
        csv += `"${s.name}","${s.code}","${s.gradeLevel}","${s.section}","${s.guardianPhone}"\n`;
      });
    }
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${type}-report.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "✅ تم تصدير التقرير", description: `تم حفظ ملف ${type}-report.csv` });
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: analytics.totalStudents, icon: Users, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
          { label: "الحصص المكتملة", value: analytics.completedSessions, icon: Calendar, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
          { label: "المتوسط العام", value: `${analytics.classAverage.toFixed(1)}%`, icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
          { label: "طلاب في خطر", value: analytics.atRiskStudents.length, icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={text} />
            </div>
            <div>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">الطلاب</TabsTrigger>
          <TabsTrigger value="at-risk" data-testid="tab-at-risk">في خطر</TabsTrigger>
          <TabsTrigger value="export" data-testid="tab-export">تصدير</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <Card>
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <BarChart2 size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">توزيع التقديرات</h3>
              </div>
              <CardContent className="p-5 space-y-4">
                {Object.entries(analytics.gradeDistribution).map(([grade, count]) => {
                  const pct = grades.length > 0 ? (count / grades.length) * 100 : 0;
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${gradeClass(grade)}`}>{grade}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Subject Performance */}
            <Card>
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <Award size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">أداء المواد</h3>
              </div>
              <CardContent className="p-5">
                {analytics.subjectPerformance.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4 text-sm">لا توجد درجات بعد</div>
                ) : (
                  <div className="space-y-3">
                    {analytics.subjectPerformance.map((s) => (
                      <div key={s.subject} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{s.subject}</div>
                          <div className="text-xs text-muted-foreground">{s.count} تقييم</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{s.average.toFixed(1)}%</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${gradeClass(s.average >= 90 ? "A" : s.average >= 80 ? "B" : s.average >= 70 ? "C" : s.average >= 60 ? "D" : "F")}`}>
                            {s.average >= 90 ? "ممتاز" : s.average >= 80 ? "جيد جداً" : s.average >= 70 ? "جيد" : s.average >= 60 ? "مقبول" : "ضعيف"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Students */}
          {analytics.topStudents.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <h3 className="font-semibold">أفضل الطلاب</h3>
              </div>
              <CardContent className="p-0">
                <div className="divide-y">
                  {analytics.topStudents.map(({ student, avg }, i) => (
                    <div key={student.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.gradeLevel} - {student.section}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{avg.toFixed(1)}%</div>
                        <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${avg}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">أداء الطلاب التفصيلي</h3>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-36 h-8 text-sm" data-testid="select-grade-filter">
                  <SelectValue placeholder="كل الصفوف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الصفوف</SelectItem>
                  {uniqueGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <CardContent className="p-0">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">لا يوجد طلاب</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>الطالب</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>عدد التقييمات</TableHead>
                        <TableHead>المتوسط</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map(student => {
                        const sg = grades.filter(g => g.studentId === student.id);
                        const avg = sg.length > 0 ? sg.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / sg.length : null;
                        const status = avg === null ? "لا توجد درجات" : avg >= 85 ? "ممتاز" : avg >= 70 ? "جيد" : avg >= 60 ? "مقبول" : "يحتاج دعم";
                        const statusColor = avg === null ? "outline" : avg >= 85 ? "secondary" : avg >= 70 ? "outline" : avg >= 60 ? "outline" : "destructive";
                        return (
                          <TableRow key={student.id} className="hover:bg-muted/30" data-testid={`performance-row-${student.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{student.name.slice(0, 1)}</span>
                                </div>
                                <span className="text-sm font-medium" data-testid={`performance-name-${student.id}`}>{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{student.gradeLevel} - {student.section}</TableCell>
                            <TableCell className="text-sm">{sg.length}</TableCell>
                            <TableCell>
                              {avg !== null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-muted rounded-full">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${avg}%` }} />
                                  </div>
                                  <span className="text-sm font-medium">{avg.toFixed(1)}%</span>
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusColor as any} className="text-xs">{status}</Badge>
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

        {/* At Risk Tab */}
        <TabsContent value="at-risk" className="mt-4">
          <Card>
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-semibold">الطلاب في خطر (أقل من 60%)</h3>
              <Badge variant="destructive">{analytics.atRiskStudents.length}</Badge>
            </div>
            <CardContent className="p-0">
              {analytics.atRiskStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">لا يوجد طلاب في خطر حالياً</p>
                </div>
              ) : (
                <div className="divide-y">
                  {analytics.atRiskStudents.map(student => {
                    const sg = grades.filter(g => g.studentId === student.id);
                    const avg = sg.reduce((s, g) => s + (g.score / g.totalMarks) * 100, 0) / sg.length;
                    return (
                      <div key={student.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <AlertTriangle size={16} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.gradeLevel} - {student.section} · {student.guardianPhone}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-muted rounded-full">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${avg}%` }} />
                            </div>
                            <span className="text-xs font-medium text-red-600">{avg.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{sg.length} تقييم</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover-card">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users size={22} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">تقرير الطلاب</h3>
                  <p className="text-sm text-muted-foreground mt-1">قائمة بجميع الطلاب مع بياناتهم الكاملة</p>
                </div>
                <Button onClick={() => exportCSV("students")} data-testid="button-export-students">
                  <Download size={14} className="mr-2" />
                  تصدير CSV
                </Button>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Star size={22} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">تقرير الدرجات</h3>
                  <p className="text-sm text-muted-foreground mt-1">جميع الدرجات مع التقديرات والتواريخ</p>
                </div>
                <Button onClick={() => exportCSV("grades")} data-testid="button-export-grades">
                  <Download size={14} className="mr-2" />
                  تصدير CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
