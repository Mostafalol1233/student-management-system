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
  const [manualCodeError, setManualCodeError] = useState("");
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
      if (method === "manual") {
        setManualCodeError("Student not found with this code");
      }
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
      if (method === "manual") {
        setManualCodeError(`${student.name} is already marked present`);
      }
      return;
    }

    recordAttendanceMutation.mutate({
      studentId: student.id,
      sessionId: activeSession.id,
      status: "present",
      scanMethod: method,
    });

    // Clear manual entry on successful submission
    if (method === "manual") {
      setManualCode("");
      setManualCodeError("");
    }
  };

  const handleManualEntry = () => {
    setManualCodeError("");
    if (manualCode.length === 3) {
      handleCodeScan(manualCode, "manual");
    }
  };

  const validateCodeRealTime = (code: string) => {
    setManualCodeError("");
    if (code.length === 3) {
      const student = students.find(s => s.code === code);
      if (!student) {
        setManualCodeError("Student not found with this code");
      } else {
        const alreadyPresent = sessionAttendance.some(att => att.studentId === student.id);
        if (alreadyPresent) {
          setManualCodeError(`${student.name} is already marked present`);
        }
      }
    }
  };

  const presentStudents = sessionAttendance.length;
  const totalStudents = students.length;
  const absentStudents = totalStudents - presentStudents;

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

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
      {/* Session Info Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{activeSession.name}</h2>
              <p className="text-gray-600">📅 {activeSession.date} • ⏰ {formatTime(activeSession.time)} • ⏱️ {activeSession.duration} min</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{presentStudents}/{totalStudents}</div>
              <div className="text-sm text-gray-600">Present Students</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advanced Attendance Methods */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  🎯 Advanced Attendance System
                </h3>
                <Badge variant="outline" className="border-green-500 text-green-700">
                  Dual Mode Ready
                </Badge>
              </div>
              <div className="space-y-6">
                {/* Mode Selection */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      !isScanning
                        ? 'bg-white shadow-sm text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={stopScanner}
                  >
                    📱 QR Camera Mode
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      isScanning
                        ? 'bg-white shadow-sm text-green-600 border border-green-200'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => {}}
                  >
                    ⌨️ Manual Entry Mode
                  </button>
                </div>

                {/* QR Scanner Section */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                    {!isScanning ? (
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <Camera className="text-blue-600" size={32} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">QR Code Scanner</h4>
                        <p className="text-gray-600 mb-6">Scan student QR codes for instant attendance</p>
                        <Button 
                          onClick={startScanner}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                          data-testid="button-enable-camera"
                        >
                          <Video className="mr-2" size={16} />
                          🚀 Start QR Scanner
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        <div id="qr-reader" className="w-full h-full rounded-lg"></div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-green-500 text-white">
                            🔴 LIVE - Scanning QR Codes
                          </Badge>
                        </div>
                        <Button
                          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600"
                          onClick={stopScanner}
                          data-testid="button-stop-camera"
                        >
                          <X className="mr-2" size={16} />
                          Stop Scanner
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Manual Entry Section */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      ⌨️
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">Manual Entry Mode</h4>
                  </div>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter student 3-digit code..."
                        value={manualCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                          setManualCode(value);
                          validateCodeRealTime(value);
                        }}
                        maxLength={3}
                        className={`font-mono text-center text-xl h-12 border-2 focus:border-orange-500 ${
                          manualCodeError 
                            ? 'border-red-400 bg-red-50' 
                            : manualCode.length === 3 && !manualCodeError 
                              ? 'border-green-400 bg-green-50' 
                              : 'border-orange-300'
                        }`}
                        data-testid="input-manual-code"
                      />
                    </div>
                    <Button 
                      onClick={handleManualEntry}
                      disabled={manualCode.length !== 3 || manualCodeError !== "" || recordAttendanceMutation.isPending}
                      className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:bg-gray-400"
                      data-testid="button-mark-present"
                    >
                      <Check className="mr-2" size={16} />
                      {recordAttendanceMutation.isPending ? "Processing..." : "✅ Mark Present"}
                    </Button>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-3 flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`w-8 h-2 rounded-full ${
                          i < manualCode.length
                            ? manualCodeError
                              ? 'bg-red-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Status messages */}
                  {manualCode.length > 0 && manualCode.length < 3 && !manualCodeError && (
                    <p className="mt-2 text-sm text-orange-600">
                      Enter {3 - manualCode.length} more digit{3 - manualCode.length > 1 ? 's' : ''}
                    </p>
                  )}
                  
                  {manualCodeError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="mr-1" size={14} />
                      {manualCodeError}
                    </p>
                  )}
                  
                  {manualCode.length === 3 && !manualCodeError && (
                    <p className="mt-2 text-sm text-green-600 flex items-center">
                      <Check className="mr-1" size={14} />
                      Ready to mark attendance for {students.find(s => s.code === manualCode)?.name}
                    </p>
                  )}
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
