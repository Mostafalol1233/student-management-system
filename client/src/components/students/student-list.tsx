import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, FileText, QrCode, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

export default function StudentList() {
  const [searchTerm, setSearchTerm] = useState("");
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
    student.guardianPhone.includes(searchTerm)
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
            <Button variant="secondary" data-testid="button-export-students">
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
                      {student.guardianPhone}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`button-qr-${student.id}`}
                          onClick={() => {
                            toast({
                              title: "QR Code",
                              description: `Viewing QR code for ${student.name}`,
                            });
                          }}
                        >
                          <QrCode size={16} className="text-primary" />
                        </Button>
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
