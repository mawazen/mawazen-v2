import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import SiteLayout from "@/components/SiteLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetails from "./pages/CaseDetails";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
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
import Tasks from "./pages/Tasks";
import PublicServices from "./pages/PublicServices";
import ServiceCatalogAdmin from "./pages/ServiceCatalogAdmin";
import ServiceRequestsAdmin from "./pages/ServiceRequestsAdmin";
import ServiceProjects from "./pages/ServiceProjects";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import SiteTeam from "./pages/SiteTeam";
import SitePractices from "./pages/SitePractices";
import SiteTestimonials from "./pages/SiteTestimonials";
import ContactUs from "./pages/ContactUs";
import CmsPagesAdmin from "./pages/CmsPagesAdmin";
import CmsTeamAdmin from "./pages/CmsTeamAdmin";
import CmsPracticesAdmin from "./pages/CmsPracticesAdmin";
import CmsTestimonialsAdmin from "./pages/CmsTestimonialsAdmin";
import CmsContactMessagesAdmin from "./pages/CmsContactMessagesAdmin";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CmsBlogAdmin from "./pages/CmsBlogAdmin";
import LegalTools from "./pages/LegalTools";
import PublicClientPortal from "./pages/PublicClientPortal";
import OwnerDashboard from "./pages/OwnerDashboard";

const withSiteLayout = (Component: React.ComponentType) => {
  function Wrapped() {
    return (
      <SiteLayout>
        <Component />
      </SiteLayout>
    );
  }

  return Wrapped;
};

const HomeWithLayout = withSiteLayout(Home);
const LoginWithLayout = withSiteLayout(Login);
const SignUpWithLayout = withSiteLayout(SignUp);
const VerifyWithLayout = withSiteLayout(Verify);
const PublicServicesWithLayout = withSiteLayout(PublicServices);
const AboutWithLayout = withSiteLayout(About);
const PricingWithLayout = withSiteLayout(Pricing);
const SiteTeamWithLayout = withSiteLayout(SiteTeam);
const SitePracticesWithLayout = withSiteLayout(SitePractices);
const SiteTestimonialsWithLayout = withSiteLayout(SiteTestimonials);
const ContactUsWithLayout = withSiteLayout(ContactUs);
const BlogWithLayout = withSiteLayout(Blog);
const BlogPostWithLayout = withSiteLayout(BlogPost);

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={HomeWithLayout} />
      <Route path={"/login"} component={LoginWithLayout} />
      <Route path={"/signup"} component={SignUpWithLayout} />
      <Route path={"/verify"} component={VerifyWithLayout} />
      <Route path={"/services"} component={PublicServicesWithLayout} />
      <Route path={"/about"} component={AboutWithLayout} />
      <Route path={"/pricing"} component={PricingWithLayout} />
      <Route path={"/our-team"} component={SiteTeamWithLayout} />
      <Route path={"/practices"} component={SitePracticesWithLayout} />
      <Route path={"/testimonials"} component={SiteTestimonialsWithLayout} />
      <Route path={"/contact"} component={ContactUsWithLayout} />
      <Route path={"/blog/:slug"} component={BlogPostWithLayout} />
      <Route path={"/blog"} component={BlogWithLayout} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/cases/:id"} component={CaseDetails} />
      <Route path={"/cases"} component={Cases} />
      <Route path={"/clients/:id"} component={ClientDetails} />
      <Route path={"/clients"} component={Clients} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/documents"} component={Documents} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/tasks"} component={Tasks} />
      <Route path={"/legal-tools"} component={LegalTools} />
      <Route path={"/team"} component={Team} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/client-portal"} component={ClientPortal} />
      <Route path={"/portal/:token"} component={PublicClientPortal} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/payments"} component={Payments} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/service-catalog"} component={ServiceCatalogAdmin} />
      <Route path={"/service-requests"} component={ServiceRequestsAdmin} />
      <Route path={"/service-projects"} component={ServiceProjects} />
      <Route path={"/cms/pages"} component={CmsPagesAdmin} />
      <Route path={"/cms/team"} component={CmsTeamAdmin} />
      <Route path={"/cms/practices"} component={CmsPracticesAdmin} />
      <Route path={"/cms/testimonials"} component={CmsTestimonialsAdmin} />
      <Route path={"/cms/messages"} component={CmsContactMessagesAdmin} />
      <Route path={"/cms/blog"} component={CmsBlogAdmin} />
      <Route path={"/owner"} component={OwnerDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" defaultPalette="gold" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
