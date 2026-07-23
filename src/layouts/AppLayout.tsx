import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

const navItems: { to: string; label: string }[] = [
  { to: "/", label: "Dashboard" },
  { to: "/organizations", label: "Organizations" },
  { to: "/frameworks", label: "Frameworks" },
  { to: "/assessments", label: "Assessments" },
  { to: "/reviews", label: "Reviews" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card p-4">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-semibold">QMS</h1>
          <p className="text-xs text-muted-foreground">Quality Management System</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children ?? <Outlet />}</main>
    </div>
  );
}