import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/lib/notifications";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import StudentProfile from "@/pages/student-profile";
import StudentComprehensiveProfile from "@/pages/student-comprehensive-profile";
import Login from "@/pages/login";

const Page = (section: Parameters<typeof Dashboard>[0]["initialSection"]) => () => <Dashboard initialSection={section} />;

function ProtectedRoute({ component: Component, ...props }: { component: React.ComponentType<any>; [k: string]: any }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <Component {...props} />;
}

const Protected = (section: Parameters<typeof Dashboard>[0]["initialSection"]) => () =>
  <ProtectedRoute component={Page(section)()} />;

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Page("overview")} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Page("overview")} />} />
      <Route path="/students" component={() => <ProtectedRoute component={Page("student-registration")} />} />
      <Route path="/student-registration" component={() => <ProtectedRoute component={Page("student-registration")} />} />
      <Route path="/groups" component={() => <ProtectedRoute component={Page("group-management")} />} />
      <Route path="/sessions" component={() => <ProtectedRoute component={Page("session-management")} />} />
      <Route path="/session-management" component={() => <ProtectedRoute component={Page("session-management")} />} />
      <Route path="/timetable" component={() => <ProtectedRoute component={Page("timetable")} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={Page("attendance-scanning")} />} />
      <Route path="/attendance-scanning" component={() => <ProtectedRoute component={Page("attendance-scanning")} />} />
      <Route path="/grades" component={() => <ProtectedRoute component={Page("grade-entry")} />} />
      <Route path="/grade-entry" component={() => <ProtectedRoute component={Page("grade-entry")} />} />
      <Route path="/exams" component={() => <ProtectedRoute component={Page("exam-builder")} />} />
      <Route path="/homework" component={() => <ProtectedRoute component={Page("homework-management")} />} />
      <Route path="/finance" component={() => <ProtectedRoute component={Page("finance-management")} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Page("analytics")} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Page("reports")} />} />
      <Route path="/whatsapp" component={() => <ProtectedRoute component={Page("whatsapp-management")} />} />
      <Route path="/whatsapp-management" component={() => <ProtectedRoute component={Page("whatsapp-management")} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Page("settings")} />} />
      <Route path="/teachers" component={() => <ProtectedRoute component={Page("teachers")} />} />
      <Route path="/reception" component={() => <ProtectedRoute component={Page("reception")} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Page("user-management")} />} />
      <Route path="/student/:id" component={(props) => <ProtectedRoute component={StudentProfile} {...props} />} />
      <Route path="/student-comprehensive/:id" component={(props) => <ProtectedRoute component={StudentComprehensiveProfile} {...props} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
