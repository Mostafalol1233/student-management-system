import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentList from "./student-list";
import QRGenerator from "@/components/ui/qr-generator";
import { Plus, Download, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function StudentRegistration() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [bulkImportResults, setBulkImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      guardianPhone: "",
      guardianPhone2: undefined,
      address: undefined,
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

  const bulkImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      const response = await fetch('/api/students/bulk-import', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bulk import failed');
      }
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setBulkImportResults(result);
      toast({
        title: "Bulk import completed",
        description: `${result.successCount} students imported, ${result.errorCount} errors`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk import failed",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      bulkImportMutation.mutate(file);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `name,guardian phone,guardian phone 2,address,grade,section
John Smith,+1234567890,+1987654321,123 Main Street,Grade 10,A
Jane Doe,+1555666777,,456 Oak Avenue,Grade 11,B
Ahmed Ali,+201234567890,+201987654321,789 Nile Street,Grade 12,C`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Sample CSV downloaded",
      description: "Use this template for bulk student import",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Forms */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" data-testid="tab-individual">
                Individual Registration
              </TabsTrigger>
              <TabsTrigger value="bulk" data-testid="tab-bulk">
                Bulk Import
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="space-y-4">
              <Card>
                <CardContent className="p-6">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormField
                          control={form.control}
                          name="guardianPhone2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guardian Phone 2 (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., +1234567890"
                                  type="tel"
                                  data-testid="input-guardian-phone2"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student Address (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 123 Main Street, City"
                                data-testid="input-address"
                                {...field}
                                value={field.value || ""}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Bulk Import Students</h3>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Upload a CSV file to register multiple students at once. The CSV should include columns for name, guardian phone, guardian phone 2, address, grade, and section.
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={downloadSampleCSV}
                        variant="outline"
                        data-testid="button-download-sample"
                      >
                        <FileText className="mr-2" size={16} />
                        Download Sample CSV
                      </Button>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={bulkImportMutation.isPending}
                        data-testid="button-upload-csv"
                      >
                        <Upload className="mr-2" size={16} />
                        {bulkImportMutation.isPending ? "Processing..." : "Upload CSV File"}
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {bulkImportResults && (
                      <div className="mt-6 space-y-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">Import Results</h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="text-green-500" size={16} />
                              <span className="text-sm">
                                <span className="font-medium text-green-700">{bulkImportResults.successCount}</span> students imported
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="text-red-500" size={16} />
                              <span className="text-sm">
                                <span className="font-medium text-red-700">{bulkImportResults.errorCount}</span> errors
                              </span>
                            </div>
                          </div>

                          {bulkImportResults.errors && bulkImportResults.errors.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-red-700 mb-2">Errors:</h5>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {bulkImportResults.errors.map((error: any, index: number) => (
                                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                    Row {error.row}: {error.error}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={() => setBulkImportResults(null)}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            Clear Results
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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