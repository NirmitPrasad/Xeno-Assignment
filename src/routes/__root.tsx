import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { EnvHealthBanner } from "@/components/layout/EnvHealthBanner";
import { Menu, Loader2 } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return <div className="p-6 text-sm text-destructive">{error.message}</div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Coffee CRM" },
      {
        name: "description",
        content:
          "Coffee CRM lets you segment customers, draft campaigns, and launch personalised WhatsApp, SMS, and email blasts in minutes — all through chat.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Coffee CRM" },
      { property: "og:title", content: "Coffee CRM" },
      {
        property: "og:description",
        content: "Segment, draft, and launch personalised campaigns in minutes — powered by AI.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1a1a2e" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Coffee CRM",
          description: "Chat-first AI marketing CRM for smart campaigns.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                localStorage.setItem('theme', 'dark');
                document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChat = pathname === "/chat";
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("xeno_auth") === "true";
    if (!auth && pathname !== "/login") {
      navigate({ to: "/login" });
    } else if (auth && pathname === "/login") {
      navigate({ to: "/" });
    }
    setCheckingAuth(false);
  }, [pathname, navigate]);

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-muted-foreground font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  if (pathname === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top header bar */}
          <header className="flex md:hidden items-center justify-between px-4 py-3 border-b bg-sidebar text-sidebar-foreground shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
                aria-label="Open menu"
              >
                <Menu className="size-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm shrink-0 font-serif font-bold text-sm">
                  X
                </div>
                <span className="font-bold text-foreground text-sm tracking-tight leading-none">
                  Coffee CRM
                </span>
              </div>
            </div>
          </header>

          <EnvHealthBanner />
          <div
            className={`flex-1 min-h-0 ${isChat ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}
          >
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
