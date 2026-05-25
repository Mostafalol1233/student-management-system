import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSessionSchema, type Session, type InsertSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarPlus, QrCode, StopCircle, Circle, Eye } from "lucide-react";

export default function SessionManagement() {
  const { toast } = useToast();

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["/api/sessions/active"],
  });

  const form = useForm({
    resolver: zodResolver(insertSessionSchema as any),
    defaultValues: {
      name: "",
      date: "",
      time: "",
      duration: 60,
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: InsertSession) => {
      const response = await apiRequest("POST", "/api/sessions", data);
      return response.json();
    },
    onSuccess: (session: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      form.reset();
      toast({
        title: "Session created successfully",
        description: `${session.name} has been scheduled`,
      });
    },
    onError: (error) => {
      toast({
        title: "Session creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Session> }) => {
      const response = await apiRequest("PUT", `/api/sessions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      toast({
        title: "Session updated",
        description: "Session status has been updated",
      });
    },
  });

  const onSubmit = (data: InsertSession) => {
    createSessionMutation.mutate(data);
  };

  const handleStartSession = (session: Session) => {
    updateSessionMutation.mutate({
      id: session.id,
      updates: { status: "active" }
    });
  };

  const handleEndSession = (session: Session) => {
    updateSessionMutation.mutate({
      id: session.id,
      updates: { status: "completed" }
    });
  };

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Session Form */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Session</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mathematics - Chapter 5"
                          data-testid="input-session-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-session-date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            data-testid="input-session-time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          min="15"
                          max="300"
                          data-testid="input-session-duration"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createSessionMutation.isPending}
                  data-testid="button-create-session"
                >
                  <CalendarPlus className="mr-2" size={16} />
                  {createSessionMutation.isPending ? "Creating..." : "Create Session"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Active Session */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current Session</h3>
              {activeSession && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    <Circle className="mr-2 animate-pulse fill-green-500" size={8} />
                    Live Session
                  </Badge>
                </div>
              )}
            </div>
            {activeSession ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Session Name</div>
                  <div className="font-medium" data-testid="text-active-session-name">
                    {activeSession.name}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Start Time</div>
                    <div className="font-medium" data-testid="text-active-session-time">
                      {formatTime(activeSession.time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium" data-testid="text-active-session-duration">
                      {activeSession.duration} minutes
                    </div>
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white" 
                      data-testid="button-qr-attendance"
                      onClick={() => {
                        window.location.href = "/attendance-scanning";
                      }}
                    >
                      <QrCode className="mr-1" size={14} />
                      QR Scanner
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      data-testid="button-manual-attendance"
                      onClick={() => {
                        window.location.href = "/attendance-scanning";
                      }}
                    >
                      ⌨️ Manual Entry
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium" 
                    data-testid="button-start-attendance"
                    onClick={() => {
                      window.location.href = "/attendance-scanning";
                    }}
                  >
                    🚀 Start Advanced Attendance
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                    data-testid="button-end-session"
                    onClick={() => handleEndSession(activeSession)}
                    disabled={updateSessionMutation.isPending}
                  >
                    <StopCircle className="mr-2" size={16} />
                    End Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarPlus size={48} className="mx-auto mb-4 opacity-50" />
                <p>No active session</p>
                <p className="text-sm">Create a session to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Session History</h3>
        </div>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No sessions created yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Session</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} className="hover:bg-muted/50" data-testid={`row-session-${session.id}`}>
                      <TableCell className="font-medium" data-testid={`text-session-name-${session.id}`}>
                        {session.name}
                      </TableCell>
                      <TableCell data-testid={`text-session-datetime-${session.id}`}>
                        {session.date} - {formatTime(session.time)}
                      </TableCell>
                      <TableCell data-testid={`text-session-duration-${session.id}`}>
                        {session.duration} min
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "active" 
                              ? "secondary" 
                              : session.status === "completed" 
                              ? "outline" 
                              : "secondary"
                          }
                          data-testid={`badge-session-status-${session.id}`}
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {session.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartSession(session)}
                              disabled={updateSessionMutation.isPending}
                              data-testid={`button-start-${session.id}`}
                            >
                              <QrCode size={16} className="text-primary" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-view-${session.id}`}
                            onClick={() => {
                              toast({
                                title: "Session Details",
                                description: "Session details view coming soon",
                              });
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
