import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Clients from "./pages/Clients";
import AIAssistant from "./pages/AIAssistant";
import Documents from "./pages/Documents";
import Invoices from "./pages/Invoices";
import Calendar from "./pages/Calendar";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ClientPortal from "./pages/ClientPortal";
import Notifications from "./pages/Notifications";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/cases"} component={Cases} />
      <Route path={"/clients"} component={Clients} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/documents"} component={Documents} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/team"} component={Team} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/client-portal"} component={ClientPortal} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/payments"} component={Payments} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
