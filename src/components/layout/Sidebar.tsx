import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  Users,
  BarChart3,
  FileText,
  Database,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

const nav = [
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.CHAT, label: "AI Barista Copilot", icon: Sparkles },
  { to: ROUTES.CAMPAIGNS, label: "Marketing Drops", icon: Megaphone },
  { to: ROUTES.CUSTOMERS, label: "Guest Directory", icon: Users },
  { to: ROUTES.TEMPLATES, label: "Offer Drafts", icon: FileText },
  { to: ROUTES.ANALYTICS, label: "ROI Insights", icon: BarChart3 },
  { to: ROUTES.SYSTEM, label: "Integration Hub", icon: Database },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { pathname } = useLocation();
  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "w-60 shrink-0 border-r border-stone-800 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
          "md:translate-x-0 md:static md:h-auto md:flex",
          "fixed inset-y-0 left-0 z-50 h-full",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-5 py-5 border-b border-stone-800 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center">
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-stone-50 text-base tracking-tight leading-snug">AI-native Mini CRM</span>
              <span className="text-xs uppercase tracking-wider text-amber-500/90 font-bold mt-0.5">
                For a Coffee Chain
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-sans">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-amber-700 text-white font-medium"
                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-100",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-2 border-t">
          <button
            onClick={() => {
              localStorage.removeItem("xeno_auth");
              window.location.href = ROUTES.LOGIN;
            }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium font-sans cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
        <div className="p-4 text-xs text-stone-400 border-t border-stone-800 bg-stone-900/50">
          <div className="font-semibold text-stone-50 mb-0.5">AI-Native CRM</div>
          <div>Powered by Coffee CRM for smart audience filters & brew drops.</div>
        </div>
      </aside>
    </>
  );
}
