import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CheckCircle, TrendingUp, Calendar, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Session, Attendance, Grade } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  // Calculate statistics
  const totalStudents = students.length;
  const completedSessions = sessions.filter(s => s.status === "completed").length;
  const classAverage = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + (grade.score / grade.totalMarks) * 100, 0) / grades.length
    : 0;

  // Mock attendance data for demonstration
  const mockAttendanceRate = 89; // This would be calculated from actual attendance data

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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Total Students</div>
                <div className="text-2xl font-bold" data-testid="stat-total-students">
                  {totalStudents}
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
                  {mockAttendanceRate}%
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
                  {classAverage.toFixed(1)}
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
                <div className="text-sm text-muted-foreground">Sessions This Month</div>
                <div className="text-2xl font-bold" data-testid="stat-sessions-count">
                  {completedSessions}
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                        {Math.floor(Math.random() * totalStudents)}/{totalStudents}
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
    </div>
  );
}
