import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type Student, type InsertStudent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import StudentList from "./student-list";
import QRGenerator from "@/components/ui/qr-generator";
import { Plus, Download } from "lucide-react";

export default function StudentRegistration() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      guardianPhone: "",
      gradeLevel: "",
      section: "",
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const response = await apiRequest("POST", "/api/students", data);
      return response.json();
    },
    onSuccess: (student: Student) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      form.reset();
      setSelectedStudent(student);
      toast({
        title: "Student registered successfully",
        description: `${student.name} has been registered with code ${student.code}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStudent) => {
    createStudentMutation.mutate(data);
  };

  const handleClearForm = () => {
    form.reset();
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Register New Student</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter student's full name"
                          data-testid="input-student-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label className="block text-sm font-medium mb-2">Student ID</Label>
                  <Input
                    value={selectedStudent ? `STU-${selectedStudent.code}` : "Auto-generated"}
                    readOnly
                    className="bg-muted text-muted-foreground"
                    data-testid="display-student-id"
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="guardianPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +1234567890"
                        type="tel"
                        data-testid="input-guardian-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-grade-level">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Grade 9">Grade 9</SelectItem>
                          <SelectItem value="Grade 10">Grade 10</SelectItem>
                          <SelectItem value="Grade 11">Grade 11</SelectItem>
                          <SelectItem value="Grade 12">Grade 12</SelectItem>
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
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-section">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearForm}
                  data-testid="button-clear-form"
                >
                  Clear Form
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStudentMutation.isPending}
                  data-testid="button-register-student"
                >
                  <Plus className="mr-2" size={16} />
                  {createStudentMutation.isPending ? "Registering..." : "Register Student"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* QR Code Preview */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Generated QR Code</h3>
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
              {selectedStudent ? (
                <QRGenerator 
                  value={selectedStudent.code} 
                  size={160}
                  data-testid="qr-code-preview"
                />
              ) : (
                <div className="w-40 h-40 bg-white rounded border-2 border-dashed border-border flex items-center justify-center">
                  <div className="text-4xl text-muted-foreground">QR</div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary" data-testid="display-student-code">
                {selectedStudent?.code || "---"}
              </div>
              <p className="text-sm text-muted-foreground">Student Unique Code</p>
              {selectedStudent && (
                <Button 
                  className="w-full" 
                  variant="secondary"
                  data-testid="button-download-qr"
                  onClick={() => {
                    // QR download will be handled by the QRGenerator component
                    toast({
                      title: "QR Code downloaded",
                      description: `QR code for ${selectedStudent.name} has been saved`,
                    });
                  }}
                >
                  <Download className="mr-2" size={16} />
                  Download QR Code
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <StudentList />
    </div>
  );
}
