import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarCheck, Menu, X, Moon, Sun, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-2 text-muted-foreground hover:text-foreground w-full justify-start"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-xs">{dark ? "Light Mode" : "Dark Mode"}</span>
    </Button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <NavLink key={item.to} to={item.to} onClick={onNavigate} className="block relative">
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-lg bg-primary/10 dark:bg-primary/15 border border-primary/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative z-10 ${
                active
                  ? "text-primary dark:text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </div>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex flex-col flex-1 glass border-r border-border/60">
          <div className="flex items-center gap-3 px-5 h-16 border-b border-border/60">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-base text-foreground tracking-tight">HRMS Lite</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Human Resources</p>
            </div>
          </div>
          <SidebarNav />
          <div className="px-3 py-3 border-t border-border/60">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-border/60 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-9 w-9">
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Building2 size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">HRMS Lite</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden glass border-r border-border/60"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Building2 size={14} className="text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">HRMS Lite</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8">
                  <X size={18} />
                </Button>
              </div>
              <SidebarNav onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="pt-14 md:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 lg:p-8 max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
