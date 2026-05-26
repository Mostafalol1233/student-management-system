import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/lib/notifications";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import StudentProfile from "@/pages/student-profile";
import StudentComprehensiveProfile from "@/pages/student-comprehensive-profile";

const Page = (section: Parameters<typeof Dashboard>[0]["initialSection"]) => () => <Dashboard initialSection={section} />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Page("overview")} />
      <Route path="/dashboard" component={Page("overview")} />
      <Route path="/students" component={Page("student-registration")} />
      <Route path="/student-registration" component={Page("student-registration")} />
      <Route path="/groups" component={Page("group-management")} />
      <Route path="/sessions" component={Page("session-management")} />
      <Route path="/session-management" component={Page("session-management")} />
      <Route path="/timetable" component={Page("timetable")} />
      <Route path="/attendance" component={Page("attendance-scanning")} />
      <Route path="/attendance-scanning" component={Page("attendance-scanning")} />
      <Route path="/grades" component={Page("grade-entry")} />
      <Route path="/grade-entry" component={Page("grade-entry")} />
      <Route path="/exams" component={Page("exam-builder")} />
      <Route path="/homework" component={Page("homework-management")} />
      <Route path="/finance" component={Page("finance-management")} />
      <Route path="/analytics" component={Page("analytics")} />
      <Route path="/reports" component={Page("reports")} />
      <Route path="/whatsapp" component={Page("whatsapp-management")} />
      <Route path="/whatsapp-management" component={Page("whatsapp-management")} />
      <Route path="/settings" component={Page("settings")} />
      <Route path="/student/:id" component={StudentProfile} />
      <Route path="/student-comprehensive/:id" component={StudentComprehensiveProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
