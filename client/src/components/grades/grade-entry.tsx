import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGradeSchema, type Grade, type InsertGrade, type Student } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, TrendingUp, Award, BarChart3, MessageCircle, Send, SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function GradeEntry() {
  const { toast } = useToast();

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  const form = useForm({
    resolver: zodResolver(insertGradeSchema as any),
    defaultValues: {
      studentId: "",
      subject: "",
      assessmentType: "",
      score: 0,
      totalMarks: 100,
      notes: "",
    },
  });

  const createGradeMutation = useMutation({
    mutationFn: async (data: InsertGrade) => {
      const response = await apiRequest("POST", "/api/grades", data);
      return response.json();
    },
    onSuccess: (grade: Grade) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      form.reset();
      const student = students.find(s => s.id === grade.studentId);
      toast({
        title: "Grade saved successfully",
        description: `Grade recorded for ${student?.name || 'student'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "فشل في حفظ الدرجة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: async ({ studentName, phoneNumber, grade, subject, notes }: { 
      studentName: string; 
      phoneNumber: string; 
      grade: string; 
      subject: string;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/whatsapp/send-grade", {
        studentName,
        phoneNumber,
        grade,
        subject,
        notes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال رسالة واتساب",
        description: "تم إرسال الدرجة إلى ولي الأمر عبر واتساب",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل في إرسال الواتساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendBulkWhatsAppMutation = useMutation({
    mutationFn: async (gradeIds: string[]) => {
      const response = await apiRequest("POST", "/api/whatsapp/send-bulk-grades", {
        gradeIds
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "تم إرسال الدرجات",
        description: `تم إرسال ${result.sent} من ${result.total} رسالة`,
      });
    },
    onError: (error) => {
      toast({
        title: "فشل في الإرسال الجماعي",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendWhatsApp = (gradeData: Grade) => {
    const student = students.find(s => s.id === gradeData.studentId);
    if (!student) {
      toast({
        title: "الطالب غير موجود",
        description: "لا يمكن إرسال رسالة الواتساب",
        variant: "destructive",
      });
      return;
    }

    if (!student.guardianPhone) {
      toast({
        title: "لا يوجد رقم هاتف",
        description: "الطالب ليس لديه رقم هاتف ولي الأمر",
        variant: "destructive",
      });
      return;
    }

    sendWhatsAppMutation.mutate({
      studentName: student.name,
      phoneNumber: student.guardianPhone,
      grade: `${gradeData.score}/${gradeData.totalMarks} (${gradeData.grade})`,
      subject: gradeData.subject,
      notes: gradeData.notes || undefined
    });
  };

  const handleBulkSend = () => {
    if (recentGrades.length === 0) {
      toast({
        title: "لا توجد درجات",
        description: "لا يوجد درجات للإرسال",
        variant: "destructive",
      });
      return;
    }

    const unsent = recentGrades.filter(grade => !grade.sentToParent);
    if (unsent.length === 0) {
      toast({
        title: "تم الإرسال من قبل",
        description: "جميع الدرجات تم إرسالها من قبل",
        variant: "destructive",
      });
      return;
    }

    sendBulkWhatsAppMutation.mutate(unsent.map(g => g.id));
  };

  const onSubmit = (data: InsertGrade) => {
    createGradeMutation.mutate(data);
  };

  // Calculate statistics
  const totalGrades = grades.length;
  const averageScore = totalGrades > 0 
    ? grades.reduce((sum, grade) => sum + (grade.score / grade.totalMarks) * 100, 0) / totalGrades 
    : 0;

  const gradeDistribution = grades.reduce((acc, grade) => {
    acc[grade.grade || 'N/A'] = (acc[grade.grade || 'N/A'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highestScore = totalGrades > 0 
    ? Math.max(...grades.map(g => (g.score / g.totalMarks) * 100))
    : 0;

  const lowestScore = totalGrades > 0 
    ? Math.min(...grades.map(g => (g.score / g.totalMarks) * 100))
    : 0;

  const recentGrades = grades
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 10);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'secondary';
      case 'B': return 'outline';
      case 'C': return 'outline';
      case 'D': return 'outline';
      case 'F': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Entry Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Enter Grades</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-subject">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mathematics">Mathematics</SelectItem>
                              <SelectItem value="Physics">Physics</SelectItem>
                              <SelectItem value="Chemistry">Chemistry</SelectItem>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Biology">Biology</SelectItem>
                              <SelectItem value="History">History</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assessmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-assessment-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Midterm Exam">Midterm Exam</SelectItem>
                              <SelectItem value="Final Exam">Final Exam</SelectItem>
                              <SelectItem value="Quiz">Quiz</SelectItem>
                              <SelectItem value="Assignment">Assignment</SelectItem>
                              <SelectItem value="Project">Project</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Student</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-student">
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} ({student.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="85"
                              min="0"
                              data-testid="input-score"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Marks</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              min="1"
                              data-testid="input-total-marks"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات (اختيارية)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أدخل أي ملاحظات إضافية حول أداء الطالب..."
                            data-testid="textarea-notes"
                            {...field}
                            className="min-h-[80px]"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createGradeMutation.isPending}
                    data-testid="button-save-grade"
                  >
                    <Save className="mr-2" size={16} />
                    {createGradeMutation.isPending ? "حفظ..." : "حفظ الدرجة"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Grade Statistics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Grade Overview</h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary" data-testid="text-class-average">
                  {averageScore.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Class Average</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-secondary/10 rounded">
                  <div className="font-bold text-secondary" data-testid="text-highest-score">
                    {highestScore.toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded">
                  <div className="font-bold text-accent" data-testid="text-lowest-score">
                    {lowestScore.toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Grade Distribution</div>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D', 'F'].map(grade => {
                    const count = gradeDistribution[grade] || 0;
                    const percentage = totalGrades > 0 ? (count / totalGrades) * 100 : 0;
                    return (
                      <div key={grade} className="flex justify-between items-center">
                        <span className="text-sm">{grade} (90-100)</span>
                        <span className="text-sm font-medium" data-testid={`text-grade-${grade}-percentage`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades Table */}
      <Card>
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold">الدرجات الحديثة</h3>
          <Button
            onClick={handleBulkSend}
            disabled={sendBulkWhatsAppMutation.isPending || recentGrades.filter(g => !g.sentToParent).length === 0}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-bulk-send"
          >
            <SendHorizontal className="w-4 h-4 ml-2" />
            {sendBulkWhatsAppMutation.isPending ? "جاري الإرسال..." : "إرسال جماعي للواتساب"}
          </Button>
        </div>
        <CardContent className="p-0">
          {recentGrades.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No grades entered yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>الطالب</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>نوع التقييم</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>الدرجة</TableHead>
                    <TableHead>الملاحظات</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentGrades.map((grade) => {
                    const student = students.find(s => s.id === grade.studentId);
                    return (
                      <TableRow key={grade.id} className="hover:bg-muted/50" data-testid={`row-grade-${grade.id}`}>
                        <TableCell className="font-medium" data-testid={`text-grade-student-${grade.id}`}>
                          {student?.name || 'Unknown Student'}
                        </TableCell>
                        <TableCell data-testid={`text-grade-subject-${grade.id}`}>
                          {grade.subject}
                        </TableCell>
                        <TableCell data-testid={`text-grade-assessment-${grade.id}`}>
                          {grade.assessmentType}
                        </TableCell>
                        <TableCell className="font-mono" data-testid={`text-grade-score-${grade.id}`}>
                          {grade.score}/{grade.totalMarks}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getGradeColor(grade.grade || 'F') as any}
                            data-testid={`badge-grade-${grade.id}`}
                          >
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]" data-testid={`text-grade-notes-${grade.id}`}>
                          {grade.notes ? (
                            <div className="text-sm text-muted-foreground line-clamp-2" title={grade.notes}>
                              {grade.notes}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">لا توجد ملاحظات</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-grade-date-${grade.id}`}>
                          {new Date(grade.createdAt!).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendWhatsApp(grade)}
                            disabled={sendWhatsAppMutation.isPending || !student?.guardianPhone}
                            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                            data-testid={`button-whatsapp-${grade.id}`}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            WhatsApp
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
    </div>
  );
}
