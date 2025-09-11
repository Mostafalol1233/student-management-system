import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard, { type ActiveSection } from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

// Route wrapper components
const StudentRegistrationPage = () => <Dashboard initialSection="student-registration" />;
const SessionManagementPage = () => <Dashboard initialSection="session-management" />;
const AttendanceScanningPage = () => <Dashboard initialSection="attendance-scanning" />;
const GradeEntryPage = () => <Dashboard initialSection="grade-entry" />;
const ReportsPage = () => <Dashboard initialSection="reports" />;
const WhatsAppManagementPage = () => <Dashboard initialSection="whatsapp-management" />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/student-registration" component={StudentRegistrationPage} />
      <Route path="/session-management" component={SessionManagementPage} />
      <Route path="/attendance-scanning" component={AttendanceScanningPage} />
      <Route path="/grade-entry" component={GradeEntryPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/whatsapp-management" component={WhatsAppManagementPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
