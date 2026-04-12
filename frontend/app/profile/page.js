"use client";

import { useEffect, useState } from "react";

import DashboardShell from "../../components/DashboardShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useToast } from "../../components/ToastProvider";
import { getCurrentUser, updateCurrentUser } from "../../lib/api";
import { getStoredUser, setStoredUser } from "../../lib/auth";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Syncing profile...");
  const [preferences, setPreferences] = useState({
    weeklyGoal: "4 sessions",
    focusMode: "Balanced practice",
    notifications: true
  });
  const [goals, setGoals] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const savedUser = getStoredUser();
      if (savedUser) {
        setUser(savedUser);
        setGoals((savedUser.goals || []).join(", "));
        if (savedUser.preferences && Object.keys(savedUser.preferences).length > 0) {
          setPreferences((current) => ({
            ...current,
            ...savedUser.preferences,
          }));
        }
      }

      try {
        const response = await getCurrentUser();
        setUser(response.data);
        setGoals((response.data.goals || []).join(", "));
        if (response.data.preferences && Object.keys(response.data.preferences).length > 0) {
          setPreferences((current) => ({
            ...current,
            ...response.data.preferences,
          }));
        }
        setStoredUser(response.data);
        setStatus("Profile synced.");
      } catch {
        setStatus("Using your last saved session.");
      }
    };

    loadProfile().catch(() => {});
  }, []);

  const savePreferences = async () => {
    try {
      const response = await updateCurrentUser({
        name: user?.name,
        skillLevel: user?.skillLevel || "beginner",
        goals: goals
          .split(",")
          .map((goal) => goal.trim())
          .filter(Boolean),
        preferences,
      });

      setUser(response.data);
      setStoredUser(response.data);
      setStatus("Profile saved to MongoDB.");
      showToast("Profile settings saved.", "success");
    } catch {
      showToast("Could not save your profile.", "danger");
    }
  };

  return (
    <ProtectedRoute>
      <main className="page-shell">
        <DashboardShell
          title="Profile & Settings"
          subtitle="Manage learner preferences, study rhythm, and small quality-of-life settings."
          actions={
            <button className="btn btn-primary" type="button" onClick={savePreferences}>
              Save Settings
            </button>
          }
        >
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">Identity</div>
                <h3 className="fw-bold mb-3">Your account snapshot</h3>
                <div className="d-grid gap-3">
                  <div className="metric-tile p-3">
                    <div className="small muted-copy">Name</div>
                    <div className="fw-bold">{user?.name || "Learner"}</div>
                  </div>
                  <div className="metric-tile p-3">
                    <div className="small muted-copy">Email</div>
                    <div className="fw-bold">{user?.email || "Not available"}</div>
                  </div>
                  <div className="metric-tile p-3">
                    <div className="small muted-copy">Role</div>
                    <div className="fw-bold text-capitalize">{user?.role || "student"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">Preferences</div>
                <h3 className="fw-bold mb-3">Tune the product to your study style</h3>
                <div className="vstack gap-3">
                  <div>
                    <label className="form-label fw-semibold">Display name</label>
                    <input
                      className="form-control"
                      value={user?.name || ""}
                      onChange={(e) => setUser((current) => ({ ...(current || {}), name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-semibold">Skill level</label>
                    <select
                      className="form-select"
                      value={user?.skillLevel || "beginner"}
                      onChange={(e) => setUser((current) => ({ ...(current || {}), skillLevel: e.target.value }))}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label fw-semibold">Learning goals</label>
                    <input
                      className="form-control"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="python basics, debugging, web apps"
                    />
                  </div>
                  <div>
                    <label className="form-label fw-semibold">Weekly goal</label>
                    <input
                      className="form-control"
                      value={preferences.weeklyGoal}
                      onChange={(e) => setPreferences({ ...preferences, weeklyGoal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-semibold">Focus mode</label>
                    <select
                      className="form-select"
                      value={preferences.focusMode}
                      onChange={(e) => setPreferences({ ...preferences, focusMode: e.target.value })}
                    >
                      <option>Balanced practice</option>
                      <option>Quiz-first review</option>
                      <option>Hands-on coding</option>
                      <option>Slow and guided</option>
                    </select>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={preferences.notifications}
                      onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                    />
                    <label className="form-check-label">Enable in-app notifications</label>
                  </div>
                  <div className="small muted-copy">{status}</div>
                </div>
              </div>
            </div>
          </div>
        </DashboardShell>
      </main>
    </ProtectedRoute>
  );
}
