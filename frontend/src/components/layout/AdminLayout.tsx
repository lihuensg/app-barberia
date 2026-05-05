import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  ImageIcon,
  Users,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { inicialesDe } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/turnos", label: "Turnos", icon: CalendarDays },
  { href: "/admin/reservas", label: "Reservas", icon: ClipboardList },
  { href: "/admin/posts", label: "Posts", icon: ImageIcon },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/5 bg-card/40 backdrop-blur-xl flex-col">
        <div className="p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="font-serif text-xl tracking-wide">
              Naza<span className="text-primary">Barber</span>
            </div>
          </Link>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
            Panel administrador
          </div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-admin-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover-elevate",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5 flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover-elevate"
          >
            <Home className="h-4 w-4" />
            Ver sitio
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover-elevate text-left"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="font-serif text-lg">
            Naza<span className="text-primary">Barber</span>{" "}
            <span className="text-xs text-muted-foreground ml-1">admin</span>
          </Link>
          <button
            className="h-9 w-9 rounded-md hover-elevate flex items-center justify-center"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/5 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-3 flex flex-col gap-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover-elevate",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="h-px my-2 bg-white/5" />
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover-elevate"
                >
                  <Home className="h-4 w-4" /> Ver sitio
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                    navigate("/");
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover-elevate text-left"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 min-w-0">
        <div className="hidden md:flex h-16 px-6 sm:px-8 items-center justify-end border-b border-white/5 bg-background/40 backdrop-blur-xl">
          {user && (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.foto ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {inicialesDe(user.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <div className="text-sm">{user.nombre}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
          )}
        </div>
        <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
