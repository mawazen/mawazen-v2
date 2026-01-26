import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ArrowUpLeft,
  Blend,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Menu,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import type { ElementType, PropsWithChildren } from "react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";

type NavItem = {
  href: string;
  label: string;
  icon: ElementType;
};

const navItems: NavItem[] = [
  { href: "/services", label: "الخدمات", icon: Briefcase },
  { href: "/pricing", label: "الأسعار", icon: BadgeCheck },
  { href: "/about", label: "عن موازين", icon: Sparkles },
  { href: "/blog", label: "المدونة", icon: BookOpen },
  { href: "/contact", label: "تواصل معنا", icon: MessageSquareText },
];

function NavLinks({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [location, setLocation] = useLocation();

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {navItems.map(item => {
        const isActive = location === item.href;
        const Icon = item.icon;

        return (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "h-10 gap-2 rounded-xl px-3 text-sm text-muted-foreground transition-colors",
              "hover:bg-foreground/5 hover:text-foreground",
              isActive && "bg-foreground/7 text-foreground"
            )}
            onClick={() => {
              setLocation(item.href);
              onNavigate?.();
            }}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}

export default function SiteLayout({ children }: PropsWithChildren) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, palette, setTheme, setPalette } = useTheme();

  const presets = useMemo(
    () => [
      {
        key: "gold_navy",
        label: "Gold + Navy",
        nextTheme: "dark" as const,
        nextPalette: "gold_navy" as const,
      },
      {
        key: "beige_brown",
        label: "Beige + Brown",
        nextTheme: "light" as const,
        nextPalette: "beige_brown" as const,
      },
      {
        key: "maroon_cream",
        label: "Maroon + Cream",
        nextTheme: "light" as const,
        nextPalette: "maroon_cream" as const,
      },
      {
        key: "olive_greige",
        label: "Olive + Greige",
        nextTheme: "light" as const,
        nextPalette: "olive_greige" as const,
      },
      {
        key: "grey_sky",
        label: "Grey + Sky",
        nextTheme: "light" as const,
        nextPalette: "grey_sky" as const,
      },
      {
        key: "navy_white",
        label: "Navy + White",
        nextTheme: "light" as const,
        nextPalette: "navy_white" as const,
      },
      {
        key: "example",
        label: "Cinematic Glass",
        nextTheme: "dark" as const,
        nextPalette: "example" as const,
      },
      {
        key: "gold_burgundy",
        label: "Gold + Burgundy",
        nextTheme: "dark" as const,
        nextPalette: "gold_burgundy" as const,
      },
      {
        key: "gold_minimal_light",
        label: "Gold + Minimal Light",
        nextTheme: "light" as const,
        nextPalette: "gold" as const,
      },
    ],
    []
  );

  const activePresetKey = useMemo(() => {
    if (palette === "beige_brown") return "beige_brown";
    if (palette === "maroon_cream") return "maroon_cream";
    if (palette === "olive_greige") return "olive_greige";
    if (palette === "grey_sky") return "grey_sky";
    if (palette === "navy_white") return "navy_white";
    if (theme === "light" && palette === "gold") return "gold_minimal_light";
    if (theme === "dark" && palette === "example") return "example";
    if (theme === "dark" && palette === "gold_navy") return "gold_navy";
    if (theme === "dark" && palette === "gold_burgundy") return "gold_burgundy";
    return "custom";
  }, [palette, theme]);

  const applyPreset = (presetKey: string) => {
    const preset = presets.find((p) => p.key === presetKey);
    if (!preset) return;
    setTheme?.(preset.nextTheme);
    setPalette?.(preset.nextPalette);
  };

  const cta = useMemo(() => {
    if (user) {
      return (
        <Button
          className="btn-gold h-10 rounded-xl px-4"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowUpLeft className="h-4 w-4" />
          <span>لوحة التحكم</span>
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-10 rounded-xl px-4 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          onClick={() => setLocation("/login")}
        >
          تسجيل الدخول
        </Button>
        <Button
          className="btn-gold h-10 rounded-xl px-4"
          onClick={() => setLocation("/signup")}
        >
          ابدأ الآن
        </Button>
      </div>
    );
  }, [setLocation, user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-3"
                onClick={() => setLocation("/")}
              >
                <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm">
                  <img
                    src="/logo.png"
                    alt="موازين"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </span>
                <div className="leading-tight">
                  <div className="text-base font-extrabold tracking-tight text-gold-gradient">
                    موازين
                  </div>
                  <div className="text-xs text-muted-foreground">منصة قانونية مدعومة بالذكاء</div>
                </div>
              </button>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <NavLinks />
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <Blend className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>المظهر</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {presets.map((p) => (
                    <DropdownMenuCheckboxItem
                      key={p.key}
                      checked={activePresetKey === p.key}
                      onCheckedChange={() => applyPreset(p.key)}
                    >
                      {p.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {cta}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-sm">
                  <SheetHeader>
                    <SheetTitle className="text-right">موازين</SheetTitle>
                  </SheetHeader>

                  <div className="mt-4 space-y-3">
                    <div className="glass rounded-2xl p-3">
                      <div className="text-sm font-semibold">التنقل</div>
                      <div className="mt-2">
                        <NavLinks
                          className="flex-col items-stretch"
                          onNavigate={() => setMobileMenuOpen(false)}
                        />
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-3">
                      <div className="text-sm font-semibold">الحساب</div>
                      <div className="mt-3 flex flex-col gap-2">
                        {user ? (
                          <Button
                            className="btn-gold h-11 rounded-xl"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setLocation("/dashboard");
                            }}
                          >
                            <ArrowUpLeft className="h-4 w-4" />
                            <span>لوحة التحكم</span>
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              className="h-11 rounded-xl"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setLocation("/login");
                              }}
                            >
                              تسجيل الدخول
                            </Button>
                            <Button
                              className="btn-gold h-11 rounded-xl"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setLocation("/signup");
                              }}
                            >
                              ابدأ الآن
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-3">
                      <div className="text-sm font-semibold">المظهر</div>
                      <div className="mt-3 flex flex-col gap-2">
                        {presets.map((p) => (
                          <Button
                            key={p.key}
                            variant={activePresetKey === p.key ? "default" : "outline"}
                            className={cn(
                              "h-11 rounded-xl justify-between",
                              activePresetKey === p.key && "btn-gold"
                            )}
                            onClick={() => {
                              applyPreset(p.key);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <span>{p.label}</span>
                            {activePresetKey === p.key ? (
                              <span className="text-xs opacity-90">✓</span>
                            ) : null}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                      Mawazen© {new Date().getFullYear()}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container py-10">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="h-32 w-32 overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm">
                  <img src="/logo.png" alt="موازين" className="h-full w-full object-cover" />
                </span>
                <div>
                  <div className="font-extrabold text-gold-gradient">موازين</div>
                  <div className="text-xs text-muted-foreground">
                    تصميم وتجربة استخدام بمستوى Premium
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                منصة لإدارة الأعمال القانونية مدعومة بالذكاء الاصطناعي، تساعدك على تنظيم القضايا،
                المستندات، المهام، والمتابعة المالية بأمان.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-sm font-semibold">المنصة</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <button type="button" className="block hover:text-foreground" onClick={() => setLocation("/services")}>
                    الخدمات
                  </button>
                  <button type="button" className="block hover:text-foreground" onClick={() => setLocation("/pricing")}>
                    الأسعار
                  </button>
                  <button type="button" className="block hover:text-foreground" onClick={() => setLocation("/blog")}>
                    المدونة
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold">الشركة</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <button type="button" className="block hover:text-foreground" onClick={() => setLocation("/about")}>
                    عن موازين
                  </button>
                  <button type="button" className="block hover:text-foreground" onClick={() => setLocation("/contact")}>
                    تواصل معنا
                  </button>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold">ابدأ في دقائق</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                سجّل الآن واكتشف تجربة تنظيم القضايا والمستندات مع مساعد ذكي متخصص.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button className="btn-gold h-11 rounded-xl" onClick={() => setLocation("/signup")}>
                  ابدأ الآن
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => setLocation("/login")}
                >
                  تسجيل الدخول
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Mawazen. All rights reserved.</div>
            <div className="opacity-80">mawazenco.com</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
