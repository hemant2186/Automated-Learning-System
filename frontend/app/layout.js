import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import SiteHeader from "../components/SiteHeader";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../components/ThemeProvider";
import { ToastProvider } from "../components/ToastProvider";

export const metadata = {
  title: "PathPilot AI",
  description: "Adaptive learning paths and instructor intelligence for novice programmers."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <SiteHeader />
            <div className="theme-toggle-slot">
              <ThemeToggle />
            </div>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
