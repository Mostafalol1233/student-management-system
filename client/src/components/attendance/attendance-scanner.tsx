import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Video, Check, X, Users, UserCheck, AlertCircle } from "lucide-react";
import type { Session, Student, Attendance, InsertAttendance } from "@shared/schema";

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

export default function AttendanceScanner() {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<Array<{
    student: Student;
    time: Date;
  }>>([]);
  const qrScannerRef = useRef<any>(null);
  const { toast } = useToast();

  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["/api/sessions/active"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: sessionAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/session", activeSession?.id],
    enabled: !!activeSession?.id,
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const response = await apiRequest("POST", "/api/attendance", data);
      return response.json();
    },
    onSuccess: (attendance: Attendance) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/session", activeSession?.id] });
      const student = students.find(s => s.id === attendance.studentId);
      if (student) {
        setRecentScans(prev => [{
          student,
          time: new Date()
        }, ...prev.slice(0, 4)]);
      }
      toast({
        title: "Attendance recorded",
        description: student ? `${student.name} marked as present` : "Student marked as present",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to record attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load QR scanner library
  useEffect(() => {
    if (!window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      document.head.appendChild(script);
    }
  }, []);

  const startScanner = async () => {
    if (!window.Html5Qrcode) {
      toast({
        title: "Scanner not available",
        description: "QR scanner library is loading...",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new window.Html5Qrcode("qr-reader");
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      await qrScannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          handleCodeScan(decodedText, "qr");
        },
        (error: any) => {
          // Ignore scanning errors - they're frequent and normal
        }
      );

      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Camera access failed",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && isScanning) {
      try {
        await qrScannerRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const handleCodeScan = async (code: string, method: "qr" | "manual") => {
    if (!activeSession) {
      toast({
        title: "No active session",
        description: "Please start a session first",
        variant: "destructive",
      });
      return;
    }

    const student = students.find(s => s.code === code);
    if (!student) {
      toast({
        title: "Student not found",
        description: `No student found with code: ${code}`,
        variant: "destructive",
      });
      return;
    }

    // Check if already marked present
    const alreadyPresent = sessionAttendance.some(att => att.studentId === student.id);
    if (alreadyPresent) {
      toast({
        title: "Already recorded",
        description: `${student.name} is already marked present`,
        variant: "destructive",
      });
      return;
    }

    recordAttendanceMutation.mutate({
      studentId: student.id,
      sessionId: activeSession.id,
      status: "present",
      scanMethod: method,
    });
  };

  const handleManualEntry = () => {
    if (manualCode.length === 3) {
      handleCodeScan(manualCode, "manual");
      setManualCode("");
    }
  };

  const presentStudents = sessionAttendance.length;
  const totalStudents = students.length;
  const absentStudents = totalStudents - presentStudents;

  if (!activeSession) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please create and start a session first to begin taking attendance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Scanner */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">QR Code Scanner</h3>
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {!isScanning ? (
                    <div className="text-center">
                      <Camera className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <p className="text-muted-foreground mb-4">Camera preview will appear here</p>
                      <Button 
                        onClick={startScanner}
                        data-testid="button-enable-camera"
                      >
                        <Video className="mr-2" size={16} />
                        Enable Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <div id="qr-reader" className="w-full h-full"></div>
                      <Button
                        className="absolute top-4 right-4"
                        variant="destructive"
                        onClick={stopScanner}
                        data-testid="button-stop-camera"
                      >
                        <X className="mr-2" size={16} />
                        Stop Camera
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-2">Manual Code Entry</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter 3-digit code"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.slice(0, 3))}
                      maxLength={3}
                      className="flex-1 font-mono text-center text-lg"
                      data-testid="input-manual-code"
                    />
                    <Button 
                      onClick={handleManualEntry}
                      disabled={manualCode.length !== 3 || recordAttendanceMutation.isPending}
                      className="bg-secondary hover:bg-secondary/90"
                      data-testid="button-mark-present"
                    >
                      <Check className="mr-2" size={16} />
                      Mark Present
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Session Status</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary" data-testid="text-present-count">
                  {presentStudents}
                </div>
                <p className="text-sm text-muted-foreground">Students Present</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent" data-testid="text-absent-count">
                  {absentStudents}
                </div>
                <p className="text-sm text-muted-foreground">Students Absent</p>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {Math.round((presentStudents / totalStudents) * 100)}% Attendance Rate
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">Recent Scans</div>
                <div className="space-y-2">
                  {recentScans.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      No scans yet
                    </div>
                  ) : (
                    recentScans.map((scan, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-secondary/10 rounded"
                        data-testid={`recent-scan-${index}`}
                      >
                        <span className="text-sm">{scan.student.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {scan.time.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
