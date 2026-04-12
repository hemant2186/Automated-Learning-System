"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { clearAuth, getStoredUser } from "../lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/learning-paths", label: "Learning Paths" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" }
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const navLinks = user?.role === "instructor" || user?.role === "admin"
    ? [...links.slice(0, 2), { href: "/instructor", label: "Instructor" }, ...links.slice(2)]
    : links;

  return (
    <header className="premium-nav">
      <div className="container py-3">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <Link href="/" className="fw-bold fs-4">
              PathPilot AI
            </Link>
            <div className="small muted-copy">An early-stage edtech startup building adaptive programming journeys</div>
          </div>

          <nav className="d-flex flex-wrap gap-2 align-items-center">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-pill${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <button
                type="button"
                className="nav-pill"
                onClick={() => {
                  clearAuth();
                  window.location.href = "/";
                }}
              >
                Log Out
              </button>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
