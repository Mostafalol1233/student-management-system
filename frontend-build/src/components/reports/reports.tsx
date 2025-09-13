import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, TrendingUp, Calendar, Download, FileText, Target, Award, AlertTriangle, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Session, Attendance, Grade } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("all");
  const [performanceTimeRange, setPerformanceTimeRange] = useState("month");

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  // Advanced analytics calculations
  const analytics = useMemo(() => {
    const totalStudents = students.length;
    const completedSessions = sessions.filter(s => s.status === "completed").length;
    const activeSessions = sessions.filter(s => s.status === "active").length;
    
    // Grade analytics
    const classAverage = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + (grade.score / grade.totalMarks) * 100, 0) / grades.length
      : 0;
    
    // Grade distribution
    const gradeDistribution = {
      A: grades.filter(g => g.grade === 'A').length,
      B: grades.filter(g => g.grade === 'B').length,
      C: grades.filter(g => g.grade === 'C').length,
      D: grades.filter(g => g.grade === 'D').length,
      F: grades.filter(g => g.grade === 'F').length,
    };
    
    // Performance trends (mock data for now)
    const performanceTrends = {
      improvement: Math.floor(Math.random() * 15 + 5), // 5-20% improvement
      decline: Math.floor(Math.random() * 10 + 2), // 2-12% decline
      stable: 100 - (Math.floor(Math.random() * 15 + 5) + Math.floor(Math.random() * 10 + 2)),
    };
    
    // Subject performance
    const subjectPerformance = Array.from(new Set(grades.map(g => g.subject))).map(subject => {
      const subjectGrades = grades.filter(g => g.subject === subject);
      const average = subjectGrades.length > 0 
        ? subjectGrades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / subjectGrades.length
        : 0;
      return { subject, average, count: subjectGrades.length };
    });
    
    // Risk assessment
    const atRiskStudents = students.filter(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const avgGrade = studentGrades.length > 0 
        ? studentGrades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / studentGrades.length
        : 0;
      return avgGrade < 60; // Below 60% considered at risk
    }).length;
    
    // Mock attendance data for demonstration
    const mockAttendanceRate = 89;
    
    return {
      totalStudents,
      completedSessions,
      activeSessions,
      classAverage,
      gradeDistribution,
      performanceTrends,
      subjectPerformance,
      atRiskStudents,
      mockAttendanceRate,
    };
  }, [students, sessions, grades]);

  const handleExport = (reportType: string) => {
    toast({
      title: "Export Started",
      description: `${reportType} report is being generated...`,
    });
  };

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

  const recentGrades = grades
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Total Students</div>
                <div className="text-2xl font-bold" data-testid="stat-total-students">
                  {analytics.totalStudents}
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Average Attendance</div>
                <div className="text-2xl font-bold" data-testid="stat-attendance-rate">
                  {analytics.mockAttendanceRate}%
                </div>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-secondary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Class Average</div>
                <div className="text-2xl font-bold" data-testid="stat-class-average">
                  {analytics.classAverage.toFixed(1)}%
                </div>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-accent text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Active Sessions</div>
                <div className="text-2xl font-bold" data-testid="stat-active-sessions">
                  {analytics.activeSessions}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">At Risk Students</div>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-at-risk">
                  {analytics.atRiskStudents}
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analytics Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart2 className="mr-2" size={20} />
                  Grade Distribution
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getGradeColor(grade) as any} className="w-8 h-8 rounded-full flex items-center justify-center">
                          {grade}
                        </Badge>
                        <span className="font-medium">Grade {grade}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${grades.length > 0 ? (count / grades.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center">
                  <Target className="mr-2" size={20} />
                  Performance Trends
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Improving</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={analytics.performanceTrends.improvement} className="w-20" />
                      <span className="text-sm font-medium text-green-600">
                        {analytics.performanceTrends.improvement}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stable</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={analytics.performanceTrends.stable} className="w-20" />
                      <span className="text-sm font-medium text-blue-600">
                        {analytics.performanceTrends.stable}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Declining</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={analytics.performanceTrends.decline} className="w-20" />
                      <span className="text-sm font-medium text-red-600">
                        {analytics.performanceTrends.decline}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance */}
          {analytics.subjectPerformance.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="mr-2" size={20} />
                  Subject Performance Analysis
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analytics.subjectPerformance.map((subject) => (
                    <div key={subject.subject} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">{subject.subject || 'Unknown Subject'}</div>
                        <div className="text-sm text-muted-foreground">{subject.count} assessments</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{subject.average.toFixed(1)}%</div>
                        <Badge 
                          variant={subject.average >= 85 ? "secondary" : subject.average >= 70 ? "outline" : "destructive"}
                        >
                          {subject.average >= 85 ? "Excellent" : subject.average >= 70 ? "Good" : "Needs Improvement"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Individual Performance Analytics</h3>
            <p>Detailed student performance metrics coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Performance Trends</h3>
            <p>Historical trend analysis coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Report */}
            <Card>
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Attendance Report</h3>
                <Button 
                  size="sm"
                  onClick={() => handleExport("Attendance")}
                  data-testid="button-export-attendance"
                >
                  <Download className="mr-2" size={16} />
                  Export
                </Button>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {sessions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No sessions available
                    </div>
                  ) : (
                    sessions.slice(0, 5).map((session) => (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                        data-testid={`attendance-report-${session.id}`}
                      >
                        <div>
                          <div className="font-medium">{session.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-secondary">
                            {Math.floor(Math.random() * analytics.totalStudents)}/{analytics.totalStudents}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 30 + 70)}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grade Report */}
            <Card>
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Grade Report</h3>
                <Button 
                  size="sm"
                  onClick={() => handleExport("Grades")}
                  data-testid="button-export-grades"
                >
                  <Download className="mr-2" size={16} />
                  Export
                </Button>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentGrades.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No grades available
                    </div>
                  ) : (
                    recentGrades.map((grade) => {
                      const student = students.find(s => s.id === grade.studentId);
                      return (
                        <div 
                          key={grade.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                          data-testid={`grade-report-${grade.id}`}
                        >
                          <div>
                            <div className="font-medium">{student?.name || 'Unknown Student'}</div>
                            <div className="text-sm text-muted-foreground">{grade.subject}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{grade.score}/{grade.totalMarks}</div>
                            <Badge 
                              variant={getGradeColor(grade.grade || 'F') as any}
                              className="text-sm"
                            >
                              {grade.grade}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Student Report */}
          <Card>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Student Performance Overview</h3>
              <div className="flex space-x-2">
                <Select>
                  <SelectTrigger className="w-40" data-testid="select-grade-filter">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="grade-9">Grade 9</SelectItem>
                    <SelectItem value="grade-10">Grade 10</SelectItem>
                    <SelectItem value="grade-11">Grade 11</SelectItem>
                    <SelectItem value="grade-12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="bg-accent hover:bg-accent/90"
                  onClick={() => handleExport("Student Performance")}
                  data-testid="button-generate-report"
                >
                  <FileText className="mr-2" size={16} />
                  Generate Report
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No students available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Attendance Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Average Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.slice(0, 10).map((student) => {
                        const studentGrades = grades.filter(g => g.studentId === student.id);
                        const averageGrade = studentGrades.length > 0 
                          ? studentGrades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / studentGrades.length
                          : 0;
                        
                        // Mock attendance rate for each student
                        const attendanceRate = Math.floor(Math.random() * 30 + 70);
                        const status = averageGrade >= 85 ? "Excellent" : averageGrade >= 70 ? "Good" : "Needs Improvement";
                        
                        return (
                          <tr 
                            key={student.id} 
                            className="hover:bg-muted/50"
                            data-testid={`performance-row-${student.id}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-primary text-sm font-medium">
                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium" data-testid={`performance-name-${student.id}`}>
                                    {student.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {student.gradeLevel}-{student.section}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-full bg-muted rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-secondary h-2 rounded-full" 
                                    style={{ width: `${attendanceRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium" data-testid={`performance-attendance-${student.id}`}>
                                  {attendanceRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium" data-testid={`performance-average-${student.id}`}>
                              {averageGrade.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {Math.floor(Math.random() * 24 + 1)} hours ago
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={
                                  status === "Excellent" ? "secondary" : 
                                  status === "Good" ? "outline" : 
                                  "destructive"
                                }
                                data-testid={`performance-status-${student.id}`}
                              >
                                {status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
