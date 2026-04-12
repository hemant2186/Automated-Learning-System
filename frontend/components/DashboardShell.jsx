"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getStoredUser } from "../lib/auth";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/learning-paths", label: "Path Library" },
  { href: "/resources", label: "Resources" },
  { href: "/profile", label: "Profile" },
  { href: "/instructor", label: "Instructor" }
];

export default function DashboardShell({ title, subtitle, actions, children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const visibleNavItems = navItems.filter((item) => {
    if (item.href !== "/instructor") {
      return true;
    }

    return user?.role === "instructor" || user?.role === "admin";
  });

  return (
    <div className="container py-4 py-lg-5">
      <div className="row g-4">
        <div className="col-xl-3">
          <aside className="section-card p-4 position-sticky" style={{ top: "90px" }}>
            <div className="eyebrow text-primary mb-2">Workspace</div>
            <h3 className="fw-bold mb-3">PathPilot Control Center</h3>
            <div className="startup-tag mb-3">Startup OS</div>
            <div className="d-grid gap-2">
              {visibleNavItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`btn ${active ? "btn-dark" : "btn-outline-dark"} text-start`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="page-divider my-4" />
            {user ? (
              <div className="metric-tile p-3 mb-3">
                <div className="small muted-copy">Signed in as</div>
                <div className="fw-semibold">{user.name}</div>
                <div className="small text-capitalize">{user.role}</div>
              </div>
            ) : null}
            <div className="small muted-copy">
              A premium product shell for learners, instructors, and early adopter institutions piloting PathPilot AI.
            </div>
          </aside>
        </div>

        <div className="col-xl-9">
          <div className="section-card p-4 p-lg-5 mb-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">
              <div>
                <div className="eyebrow text-primary mb-2">Product Workspace</div>
                <h1 className="fw-bold mb-2">{title}</h1>
                <p className="muted-copy mb-0">{subtitle}</p>
              </div>
              {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
