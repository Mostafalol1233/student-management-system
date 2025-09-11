import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  FileText,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Target
} from 'lucide-react';
import type { Student, Grade, Attendance, Session } from '@shared/schema';

interface StudentStats {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  averageGrade: number;
  totalGrades: number;
  bestSubject: string;
  worstSubject: string;
}

export default function StudentComprehensiveProfile() {
  const { id } = useParams<{ id: string }>();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');

  // Fetch student data
  const { data: student } = useQuery<Student>({
    queryKey: ['/api/students', id],
  });

  // Fetch grades
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['/api/grades', 'student', id],
  });

  // Fetch attendance
  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance', 'student', id],
  });

  // Fetch sessions
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
  });

  // Calculate stats
  const calculateStats = (): StudentStats => {
    if (!student || !grades.length || !attendance.length) {
      return {
        totalSessions: 0,
        attendedSessions: 0,
        attendanceRate: 0,
        averageGrade: 0,
        totalGrades: 0,
        bestSubject: 'لا يوجد',
        worstSubject: 'لا يوجد'
      };
    }

    const attendedSessions = attendance.filter(a => a.status === 'present').length;
    const totalSessions = attendance.length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

    const averageGrade = grades.reduce((sum, grade) => sum + (grade.score / grade.totalMarks * 100), 0) / grades.length;

    // Calculate subject averages
    const subjectGrades: { [key: string]: number[] } = {};
    grades.forEach(grade => {
      if (!subjectGrades[grade.subject]) {
        subjectGrades[grade.subject] = [];
      }
      subjectGrades[grade.subject].push((grade.score / grade.totalMarks) * 100);
    });

    const subjectAverages = Object.entries(subjectGrades).map(([subject, scores]) => ({
      subject,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));

    const bestSubject = subjectAverages.length > 0 
      ? subjectAverages.sort((a, b) => b.average - a.average)[0].subject
      : 'لا يوجد';

    const worstSubject = subjectAverages.length > 0 
      ? subjectAverages.sort((a, b) => a.average - b.average)[0].subject
      : 'لا يوجد';

    return {
      totalSessions,
      attendedSessions,
      attendanceRate,
      averageGrade,
      totalGrades: grades.length,
      bestSubject,
      worstSubject
    };
  };

  const stats = calculateStats();

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الطالب...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-back-dashboard">العودة للرئيسية</Button>
            </Link>
            <h1 className="text-3xl font-bold">الملف الشامل للطالب</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-report">
              <FileText className="w-4 h-4 mr-2" />
              طباعة التقرير
            </Button>
          </div>
        </div>

        {/* Student Basic Info */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarFallback className="bg-white text-blue-600 text-2xl font-bold">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2" data-testid="text-student-name-header">{student.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2" data-testid="text-student-code">
                    <User className="w-4 h-4" />
                    <span>كود الطالب: {student.code}</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="text-student-grade">
                    <GraduationCap className="w-4 h-4" />
                    <span>{student.gradeLevel} - {student.section}</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="text-guardian-phone">
                    <Phone className="w-4 h-4" />
                    <span>{student.guardianPhone}</span>
                  </div>
                  {student.address && (
                    <div className="flex items-center gap-2" data-testid="text-student-address">
                      <MapPin className="w-4 h-4" />
                      <span>{student.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge 
                variant={student.status === "active" ? "secondary" : "outline"}
                className="text-lg py-2 px-4 bg-white text-blue-600"
                data-testid="badge-student-status"
              >
                {student.status === "active" ? "نشط" : "غير نشط"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معدل الحضور</p>
                  <p className={`text-2xl font-bold ${getAttendanceColor(stats.attendanceRate)}`} data-testid="text-attendance-rate">
                    {stats.attendanceRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <Progress value={stats.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المعدل العام</p>
                  <p className={`text-2xl font-bold ${getGradeColor(stats.averageGrade)}`} data-testid="text-average-grade">
                    {stats.averageGrade.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">أفضل مادة</p>
                  <p className="text-lg font-bold text-purple-600" data-testid="text-best-subject">{stats.bestSubject}</p>
                </div>
                <Award className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الدرجات</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-total-grades">{stats.totalGrades}</p>
                </div>
                <BookOpen className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                أحدث الدرجات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد درجات مسجلة بعد
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {grades.slice(0, 5).map((grade) => {
                    const percentage = (grade.score / grade.totalMarks) * 100;
                    return (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`grade-item-${grade.id}`}
                      >
                        <div>
                          <h4 className="font-medium">{grade.subject}</h4>
                          <p className="text-sm text-gray-600">{grade.assessmentType}</p>
                          {grade.notes && (
                            <p className="text-sm text-blue-600 mt-1" data-testid={`grade-notes-${grade.id}`}>
                              <FileText className="w-3 h-3 inline mr-1" />
                              {grade.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold px-3 py-1 rounded-full ${getGradeColor(percentage)}`}>
                            {grade.score}/{grade.totalMarks}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{grade.grade}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                ملخص الحضور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-attended-sessions">{stats.attendedSessions}</div>
                    <div className="text-sm text-gray-600">حضر</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600" data-testid="text-absent-sessions">{stats.totalSessions - stats.attendedSessions}</div>
                    <div className="text-sm text-gray-600">غاب</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-total-sessions">{stats.totalSessions}</div>
                    <div className="text-sm text-gray-600">المجموع</div>
                  </div>
                </div>
                
                {attendance.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">آخر الحضور</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {attendance.slice(-5).reverse().map((record) => {
                        const session = sessions.find(s => s.id === record.sessionId);
                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-2 border rounded"
                            data-testid={`attendance-record-${record.id}`}
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {session?.name || 'حصة غير محددة'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(record.timeRecorded!).toLocaleDateString('ar-EG')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {record.status === 'present' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className={`text-sm ${record.status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                                {record.status === 'present' ? 'حضر' : 'غاب'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="space-y-6">
          {/* All Grades Table */}
          <Card>
            <CardHeader>
              <CardTitle>جميع الدرجات التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد درجات مسجلة
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المادة</TableHead>
                      <TableHead>نوع التقييم</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>النسبة المئوية</TableHead>
                      <TableHead>التقدير</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>حالة الإرسال</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => {
                      const percentage = (grade.score / grade.totalMarks) * 100;
                      return (
                        <TableRow key={grade.id} data-testid={`grade-row-${grade.id}`}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.assessmentType}</TableCell>
                          <TableCell>{grade.score}/{grade.totalMarks}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded ${getGradeColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{grade.grade}</Badge>
                          </TableCell>
                          <TableCell>
                            {grade.notes ? (
                              <span className="text-sm text-blue-600">{grade.notes}</span>
                            ) : (
                              <span className="text-gray-400">لا توجد ملاحظات</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(grade.createdAt!).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={grade.sentToParent ? "default" : "secondary"}>
                              {grade.sentToParent ? "تم الإرسال" : "لم يُرسل"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* All Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>سجل الحضور التفصيلي</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا يوجد سجل حضور
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الحصة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>طريقة التسجيل</TableHead>
                      <TableHead>وقت التسجيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => {
                      const session = sessions.find(s => s.id === record.sessionId);
                      return (
                        <TableRow key={record.id} data-testid={`attendance-row-${record.id}`}>
                          <TableCell className="font-medium">
                            {session?.name || 'حصة غير محددة'}
                          </TableCell>
                          <TableCell>{session?.date || '-'}</TableCell>
                          <TableCell>{session?.time || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record.status === 'present' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={record.status === 'present' ? 'text-green-600' : 'text-red-600'}>
                                {record.status === 'present' ? 'حضر' : 'غاب'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.scanMethod === 'qr' ? 'QR كود' : 'يدوياً'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(record.timeRecorded!).toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}