import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelRight,
  Users,
  Briefcase,
  FileText,
  Bot,
  Calendar,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  FolderOpen,
  Scale,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "القضايا", labelEn: "Cases", path: "/cases" },
  { icon: Users, label: "العملاء", labelEn: "Clients", path: "/clients" },
  { icon: FileText, label: "المستندات", labelEn: "Documents", path: "/documents" },
  { icon: Bot, label: "المساعد الذكي", labelEn: "AI Assistant", path: "/ai-assistant" },
  { icon: Calendar, label: "التقويم", labelEn: "Calendar", path: "/calendar" },
  { icon: Receipt, label: "الفواتير", labelEn: "Invoices", path: "/invoices" },
  { icon: BarChart3, label: "التحليلات", labelEn: "Analytics", path: "/analytics" },
  { icon: BarChart3, label: "التقارير", labelEn: "Reports", path: "/reports" },
  { icon: Bell, label: "الإشعارات", labelEn: "Notifications", path: "/notifications" },
  { icon: Receipt, label: "المدفوعات", labelEn: "Payments", path: "/payments" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center shadow-lg border-gold-glow">
              <Scale className="w-10 h-10 text-background" />
            </div>
            <h1 className="text-3xl font-bold text-gold-gradient">قيد</h1>
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              مرحباً بك في نظام قيد
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              نظام إدارة المكاتب القانونية المتكامل مع الذكاء الاصطناعي المتخصص
              في القانون السعودي
            </p>
          </div>

          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full btn-gold text-lg py-6 rounded-xl"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // RTL: calculate from right side
      const sidebarRight =
        sidebarRef.current?.getBoundingClientRect().right ?? window.innerWidth;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-l-0 border-r border-border/50"
          side="right"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center border-b border-border/30">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              {!isCollapsed ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-background" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-lg text-gold-gradient">
                      قيد
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      المساعد القانوني الذكي
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center mx-auto">
                  <Scale className="w-5 h-5 text-background" />
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="تبديل القائمة"
              >
                <PanelRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-4">
            <SidebarMenu className="px-2 py-1 space-y-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 transition-all font-medium rounded-xl ${
                        isActive
                          ? "bg-gold/10 text-gold border border-gold/20"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-gold" : "text-muted-foreground"}`}
                      />
                      <span className={isActive ? "text-gold" : ""}>
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
                  <Avatar className="h-10 w-10 border-2 border-gold/30 shrink-0">
                    <AvatarFallback className="text-sm font-bold bg-gold/20 text-gold">
                      {user?.name?.charAt(0).toUpperCase() || "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none text-foreground">
                      {user?.name || "مستخدم"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.role === "admin" ? "مدير النظام" : "محامي"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="ml-2 h-4 w-4" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-gold/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-background">
        {/* Top Header Bar */}
        <div className="flex border-b border-border/50 h-16 items-center justify-between bg-card/50 px-4 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && (
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {activeMenuItem?.label ?? "لوحة التحكم"}
              </span>
              <span className="text-xs text-muted-foreground">
                {activeMenuItem?.labelEn ?? "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl hover:bg-gold/10"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
            </Button>
          </div>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
