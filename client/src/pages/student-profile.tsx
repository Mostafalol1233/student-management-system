import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, QrCode, Download, Phone, MapPin, User, Calendar, GraduationCap, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRGenerator, { QRGeneratorRef } from "@/components/ui/qr-generator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type Student, type InsertStudent, type Grade } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StudentProfile() {
  const [, params] = useRoute("/student/:id");
  const studentId = params?.id;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrRef = useRef<QRGeneratorRef>(null);
  const { toast } = useToast();

  // Get student data
  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: ["/api/students", studentId],
    queryFn: () => fetch(`/api/students/${studentId}`).then(res => {
      if (!res.ok) throw new Error('Student not found');
      return res.json();
    }),
    enabled: !!studentId,
  });

  // Get student grades
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades", studentId],
    queryFn: () => fetch(`/api/grades?studentId=${studentId}`).then(res => res.json()),
    enabled: !!studentId,
  });

  // Form for editing student
  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema as any),
    defaultValues: {
      name: student?.name || "",
      guardianPhone: student?.guardianPhone || "",
      guardianPhone2: student?.guardianPhone2 || "",
      address: student?.address || "",
      gradeLevel: student?.gradeLevel || "",
      section: student?.section || "",
    },
  });

  // Update form values when student data loads
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        guardianPhone: student.guardianPhone,
        guardianPhone2: student.guardianPhone2 || "",
        address: student.address || "",
        gradeLevel: student.gradeLevel,
        section: student.section,
      });
    }
  }, [student, form]);

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const response = await apiRequest("PUT", `/api/students/${studentId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      setEditDialogOpen(false);
      toast({
        title: "تم تحديث الطالب",
        description: "تم حفظ التعديلات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStudent) => {
    updateStudentMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateGradeAverage = () => {
    if (grades.length === 0) return 0;
    return grades.reduce((sum, grade) => sum + (grade.score / grade.totalMarks) * 100, 0) / grades.length;
  };

  if (studentLoading) {
    return <div className="p-6 text-center">جاري تحميل بيانات الطالب...</div>;
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">الطالب غير موجود</h2>
        <Link href="/students">
          <Button>العودة لقائمة الطلاب</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2" size={16} />
              العودة
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">بيانات الطالب</h1>
            <p className="text-muted-foreground">عرض وتحرير معلومات الطالب</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <QrCode className="mr-2" size={16} />
                عرض QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">
                  QR Code - {student.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <QRGenerator 
                    ref={qrRef}
                    value={student.code} 
                    size={200}
                    studentName={student.name}
                    onRegenerate={() => {
                      toast({
                        title: "تم إعادة إنتاج رمز QR",
                        description: `تم إعادة إنتاج رمز QR للطالب ${student.name}`,
                      });
                    }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-xl font-bold text-primary">
                    {student.code}
                  </div>
                  <p className="text-sm text-muted-foreground">كود الطالب الفريد</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    if (qrRef.current) {
                      qrRef.current.downloadQR();
                      toast({
                        title: "تم تحميل رمز QR",
                        description: `تم حفظ رمز QR للطالب ${student.name}`,
                      });
                    }
                  }}
                >
                  <Download className="mr-2" size={16} />
                  تحميل رمز QR
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="mr-2" size={16} />
                تحرير البيانات
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تحرير بيانات الطالب</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الطالب</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم الطالب" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الصف</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الصف" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">الأول</SelectItem>
                              <SelectItem value="2">الثاني</SelectItem>
                              <SelectItem value="3">الثالث</SelectItem>
                              <SelectItem value="4">الرابع</SelectItem>
                              <SelectItem value="5">الخامس</SelectItem>
                              <SelectItem value="6">السادس</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الشعبة</FormLabel>
                          <FormControl>
                            <Input placeholder="أ، ب، ج..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم هاتف ولي الأمر</FormLabel>
                        <FormControl>
                          <Input placeholder="01XXXXXXXXX" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guardianPhone2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم هاتف إضافي (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="01XXXXXXXXX" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العنوان (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل العنوان" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={updateStudentMutation.isPending}>
                      {updateStudentMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Student Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2" size={20} />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{student.name}</h3>
                <p className="text-muted-foreground">كود الطالب: {student.code}</p>
                <Badge variant={student.status === "active" ? "secondary" : "outline"}>
                  {student.status === "active" ? "نشط" : "غير نشط"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center">
                <GraduationCap className="mr-3 text-muted-foreground" size={18} />
                <div>
                  <p className="font-medium">الصف والشعبة</p>
                  <p className="text-sm text-muted-foreground">{student.gradeLevel}-{student.section}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="mr-3 text-muted-foreground" size={18} />
                <div>
                  <p className="font-medium">رقم ولي الأمر</p>
                  <p className="text-sm text-muted-foreground">{student.guardianPhone}</p>
                  {student.guardianPhone2 && (
                    <p className="text-sm text-muted-foreground">{student.guardianPhone2}</p>
                  )}
                </div>
              </div>
              {student.address && (
                <div className="flex items-center">
                  <MapPin className="mr-3 text-muted-foreground" size={18} />
                  <div>
                    <p className="font-medium">العنوان</p>
                    <p className="text-sm text-muted-foreground">{student.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Academic Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2" size={20} />
              الأداء الأكاديمي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {calculateGradeAverage().toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">المعدل العام</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-2">إجمالي الامتحانات</p>
                <p className="text-2xl font-semibold">{grades.length}</p>
              </div>
              <div>
                <p className="font-medium mb-2">حالة الأداء</p>
                <Badge variant={
                  calculateGradeAverage() >= 85 ? "secondary" : 
                  calculateGradeAverage() >= 70 ? "outline" : 
                  "destructive"
                }>
                  {calculateGradeAverage() >= 85 ? "ممتاز" : 
                   calculateGradeAverage() >= 70 ? "جيد" : 
                   "يحتاج تحسين"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2" size={20} />
              رمز QR الخاص بالطالب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <QRGenerator 
                  value={student.code} 
                  size={120}
                  studentName={student.name}
                />
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{student.code}</p>
                <p className="text-sm text-muted-foreground">كود الحضور</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" size={20} />
            سجل الدرجات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد درجات مسجلة لهذا الطالب
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map((grade, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{grade.subject || 'مادة غير محددة'}</p>
                    <p className="text-sm text-muted-foreground">
                      نوع التقييم: {grade.assessmentType || 'غير محدد'}
                    </p>
                    {grade.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(grade.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{grade.score}/{grade.totalMarks}</p>
                    <Badge variant={
                      grade.grade === 'A' ? "secondary" : 
                      grade.grade === 'B' ? "outline" : 
                      grade.grade === 'C' ? "outline" : 
                      grade.grade === 'D' ? "outline" : 
                      "destructive"
                    }>
                      {grade.grade || 'غير محدد'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}