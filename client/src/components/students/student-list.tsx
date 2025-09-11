import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, FileText, QrCode, Edit, Trash2, Download, User, Eye } from "lucide-react";
import QRGenerator, { QRGeneratorRef } from "@/components/ui/qr-generator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrRef = useRef<QRGeneratorRef>(null);
  const { toast } = useToast();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student deleted",
        description: "Student has been successfully removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.code.includes(searchTerm) ||
    student.guardianPhone.includes(searchTerm) ||
    (student.guardianPhone2 && student.guardianPhone2.includes(searchTerm)) ||
    (student.address && student.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      deleteStudentMutation.mutate(student.id);
    }
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Students</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
                data-testid="input-search-students"
              />
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            </div>
            <Button 
              variant="secondary" 
              data-testid="button-export-students"
              onClick={() => {
                // Export students as CSV
                const csvContent = `Name,Code,Guardian Phone,Guardian Phone 2,Address,Grade Level,Section,Status
${filteredStudents.map(student => 
  `"${student.name}","${student.code}","${student.guardianPhone}","${student.guardianPhone2 || ''}","${student.address || ''}","${student.gradeLevel}","${student.section}","${student.status}"`
).join('\n')}`;
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                toast({
                  title: "Students exported",
                  description: `Exported ${filteredStudents.length} students to CSV file`,
                });
              }}
            >
              <FileText className="mr-2" size={16} />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {searchTerm ? "No students match your search" : "No students registered yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Student</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Guardian Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50" data-testid={`row-student-${student.id}`}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="w-10 h-10 mr-3">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium" data-testid={`text-student-name-${student.id}`}>
                            {student.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            STU-{student.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm font-mono" data-testid={`text-student-code-${student.id}`}>
                        {student.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-guardian-phone-${student.id}`}>
                      <div>
                        {student.guardianPhone}
                        {student.guardianPhone2 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {student.guardianPhone2}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-student-address-${student.id}`}>
                      {student.address || (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-student-grade-${student.id}`}>
                      {student.gradeLevel}-{student.section}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={student.status === "active" ? "secondary" : "outline"}
                        data-testid={`badge-student-status-${student.id}`}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog open={qrModalOpen && selectedStudentForQR?.id === student.id} onOpenChange={(open) => {
                          if (!open) {
                            setQrModalOpen(false);
                            setSelectedStudentForQR(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-qr-${student.id}`}
                              onClick={() => {
                                setSelectedStudentForQR(student);
                                setQrModalOpen(true);
                              }}
                            >
                              <QrCode size={16} className="text-primary" />
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
                                {selectedStudentForQR && (
                                  <QRGenerator 
                                    ref={qrRef}
                                    value={selectedStudentForQR.code} 
                                    size={200}
                                    studentName={selectedStudentForQR.name}
                                    onRegenerate={() => {
                                      toast({
                                        title: "تم إعادة إنتاج رمز QR",
                                        description: `تم إعادة إنتاج رمز QR للطالب ${selectedStudentForQR.name}`,
                                      });
                                    }}
                                  />
                                )}
                              </div>
                              <div className="text-center space-y-2">
                                <div className="text-xl font-bold text-primary">
                                  {selectedStudentForQR?.code}
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
                                      description: `تم حفظ رمز QR للطالب ${selectedStudentForQR?.name}`,
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
                        <Link href={`/student/${student.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-view-${student.id}`}
                            title="عرض ملف الطالب"
                          >
                            <Eye size={16} className="text-primary" />
                          </Button>
                        </Link>
                        <Link href={`/student-comprehensive/${student.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-comprehensive-${student.id}`}
                            title="الملف الشامل للطالب"
                          >
                            <User size={16} className="text-green-600" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`button-edit-${student.id}`}
                          onClick={() => {
                            toast({
                              title: "Edit Student",
                              description: "Edit functionality coming soon",
                            });
                          }}
                        >
                          <Edit size={16} className="text-muted-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`button-delete-${student.id}`}
                          onClick={() => handleDelete(student)}
                          disabled={deleteStudentMutation.isPending}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {filteredStudents.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                Showing {filteredStudents.length} of {students.length} students
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button size="sm">1</Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
