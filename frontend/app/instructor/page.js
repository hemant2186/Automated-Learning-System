"use client";

import { useEffect, useState } from "react";

import DashboardShell from "../../components/DashboardShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useToast } from "../../components/ToastProvider";
import { getInstructorAnalytics } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";

export default function InstructorPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState("Loading instructor analytics...");

  const loadAnalytics = async () => {
    try {
      const response = await getInstructorAnalytics();
      setAnalytics(response.data);
      setStatus("Instructor analytics synced.");
    } catch (error) {
      setStatus(error.response?.data?.error || "Could not load instructor analytics.");
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    loadAnalytics().catch(() => {});
  }, []);

  const exportCsv = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/instructor/analytics/export.csv`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`
          }
        }
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "instructor_analytics_report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("CSV report downloaded.", "success");
    } catch {
      showToast("Could not export analytics.", "danger");
    }
  };

  return (
    <ProtectedRoute>
      <main className="page-shell">
        <DashboardShell
          title="Instructor Intelligence Hub"
          subtitle="Monitor cohort risk, platform mastery, and intervention needs with premium reporting tools."
          actions={
            <>
              <button className="btn btn-outline-dark" type="button" onClick={() => loadAnalytics().catch(() => {})}>
                Refresh
              </button>
              <button className="btn btn-primary" type="button" onClick={exportCsv}>
                Download CSV
              </button>
            </>
          }
        >
          <div className="hero-panel-alt p-4 p-lg-5 mb-4">
            <div className="row g-4 align-items-center">
              <div className="col-lg-8">
                <div className="eyebrow mb-2">Cohort Overview</div>
                <h2 className="fw-bold mb-3">Guide learners with better timing and sharper insight.</h2>
                <p className="text-white-50 mb-0">
                  This page turns your instructor data into a more executive-style reporting experience.
                </p>
              </div>
              <div className="col-lg-4">
                <div className="glass-card rounded-4 p-4">
                  <div className="small text-white-50">Session</div>
                  <div className="h4 fw-bold mb-1">{user?.name || "Instructor"}</div>
                  <div className="small text-white-50">{status}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Students</div>
                <div className="big-stat">{analytics?.summary?.student_count || 0}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Activities</div>
                <div className="big-stat">{analytics?.summary?.activity_count || 0}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Platform Mastery</div>
                <div className="big-stat">{analytics?.summary?.overall_mastery || 0}%</div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">Top Weak Topics</div>
                <h3 className="fw-bold mb-3">Where support is most needed</h3>
                <div className="d-grid gap-3">
                  {(analytics?.top_weak_topics || []).map((topic) => (
                    <div className="metric-tile p-3" key={topic.topic}>
                      <div className="fw-bold">{topic.topic}</div>
                      <div className="small muted-copy">{topic.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">At-Risk Learners</div>
                <h3 className="fw-bold mb-3">Who may need intervention</h3>
                <div className="d-grid gap-3">
                  {(analytics?.at_risk_learners || []).map((learner) => (
                    <div className="metric-tile p-3" key={learner.user_id}>
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <div className="fw-bold">{learner.name || learner.user_id}</div>
                          <div className="small muted-copy">Mastery: {learner.overall_mastery}%</div>
                        </div>
                        <span className="soft-chip">{learner.risk_level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="section-card p-4">
                <div className="eyebrow text-primary mb-2">Learner roster</div>
                <h3 className="fw-bold mb-3">Cohort-level learner rows</h3>
                <div className="table-responsive">
                  <table className="table premium-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Learner</th>
                        <th>Skill level</th>
                        <th>Mastery</th>
                        <th>Weak topic</th>
                        <th>Next topic</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.learner_rows || []).map((learner) => (
                        <tr key={learner.user_id}>
                          <td>
                            <div className="fw-semibold">{learner.name}</div>
                            <div className="small text-muted">{learner.email}</div>
                          </td>
                          <td className="text-capitalize">{learner.skill_level}</td>
                          <td>{learner.overall_mastery}%</td>
                          <td>{learner.weak_topic}</td>
                          <td>{learner.next_recommended_topic}</td>
                          <td>
                            <span className="soft-chip text-capitalize">{learner.risk_level}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </DashboardShell>
      </main>
    </ProtectedRoute>
  );
}
