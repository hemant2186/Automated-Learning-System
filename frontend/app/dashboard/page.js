"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  Compass,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";

import DashboardShell from "../../components/DashboardShell";
import ProgressChart from "../../components/ProgressChart";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useToast } from "../../components/ToastProvider";
import {
  getAnalysis,
  getCurrentUser,
  getLeaderboard,
  getProgress,
  getRecommendations,
  getTimeline,
  logActivity,
} from "../../lib/api";
import { getStoredUser } from "../../lib/auth";

const TOPIC_OPTIONS = [
  "Computer Basics",
  "Variables and Data Types",
  "Operators",
  "Control Structures",
  "Loops",
  "Functions",
  "Arrays",
  "Objects",
  "Classes",
  "Web Development Basics",
];

export default function Dashboard() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [path, setPath] = useState(null);
  const [progress, setProgress] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState("Loading your learner workspace...");
  const [saving, setSaving] = useState(false);
  const [activityForm, setActivityForm] = useState({
    topic: "Computer Basics",
    quizScore: "70",
    codingScore: "68",
    timeSpent: "20",
    attempts: "1",
    completed: true,
    feedback: "",
  });

  const loadDashboard = async () => {
    try {
      const [
        userResponse,
        recommendationsResponse,
        analysisResponse,
        progressResponse,
        timelineResponse,
        leaderboardResponse,
      ] = await Promise.all([
        getCurrentUser(),
        getRecommendations(),
        getAnalysis(),
        getProgress(),
        getTimeline(),
        getLeaderboard(),
      ]);

      setUser(userResponse.data);
      setPath(recommendationsResponse.data);
      setAnalysis(analysisResponse.data);
      setProgress(progressResponse.data);
      setTimeline(timelineResponse.data);
      setLeaderboard(leaderboardResponse.data);
      setStatus("Your dashboard is up to date.");
    } catch (error) {
      setUser(getStoredUser());
      setStatus(error.response?.data?.error || "Could not load the dashboard.");
    }
  };

  useEffect(() => {
    loadDashboard().catch(() => {});
  }, []);

  const updateActivity = (event) => {
    const { name, value, type, checked } = event.target;
    setActivityForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitActivity = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await logActivity({
        topic: activityForm.topic,
        quizScore: Number(activityForm.quizScore) || 0,
        codingScore: Number(activityForm.codingScore) || 0,
        timeSpent: Number(activityForm.timeSpent) || 0,
        attempts: Number(activityForm.attempts) || 1,
        completed: activityForm.completed,
        feedback: activityForm.feedback,
      });

      showToast("Study activity saved.", "success");
      setActivityForm((current) => ({
        ...current,
        feedback: "",
      }));
      await loadDashboard();
    } catch (error) {
      showToast(error.response?.data?.error || "Could not save the study activity.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const rankedUsers = leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const progressEntries = Object.entries(progress);
  const topicBreakdown = analysis?.topicBreakdown || [];
  const timelineItems = timeline.slice(0, 6);
  const chartData = topicBreakdown
    .slice()
    .reverse()
    .map((topic) => ({
      label: topic.topic.length > 14 ? `${topic.topic.slice(0, 14)}...` : topic.topic,
      mastery: topic.mastery,
    }));

  return (
    <ProtectedRoute>
      <main className="page-shell">
        <DashboardShell
          title="Learner Momentum Dashboard"
          subtitle="Track practice, surface weak topics early, and get next-step recommendations built for novice programmers."
        >
          <div className="hero-panel p-4 p-lg-5 mb-4">
            <div className="row g-4 align-items-center">
              <div className="col-lg-8">
                <div className="eyebrow mb-2">Adaptive coaching</div>
                <h2 className="fw-bold mb-3">
                  {analysis?.nextRecommendedTopic || path?.next_recommended_topic || "Start your first focused session"}
                </h2>
                <p className="text-white-50 mb-4">
                  {analysis?.activityCount
                    ? `You have logged ${analysis.activityCount} study sessions. The best next step is to reinforce ${analysis.nextRecommendedTopic}.`
                    : "Log your first study session below and PathPilot will begin adapting your learning path."}
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="feature-chip">
                    <Sparkles size={16} /> {analysis?.readinessLabel || path?.readiness_label || "just-starting"}
                  </span>
                  <span className="feature-chip">
                    <Brain size={16} /> {path?.overall_mastery || analysis?.overallMastery || 0}% mastery
                  </span>
                  <span className="feature-chip">
                    <Compass size={16} /> {path?.weak_topics?.length || 0} focus topics
                  </span>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="glass-card rounded-4 p-4">
                  <div className="small text-white-50">Current learner</div>
                  <div className="h3 fw-bold mb-1">{user?.name || "Learner"}</div>
                  <div className="small text-white-50 mb-3 text-capitalize">
                    {user?.skillLevel || user?.role || "student"}
                  </div>
                  <div className="small text-white-50">{status}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6 col-xl-3">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Overall mastery</div>
                <div className="big-stat">{analysis?.overallMastery || 0}%</div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Completed sessions</div>
                <div className="big-stat">{analysis?.completedCount || 0}</div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Average attempts</div>
                <div className="big-stat">{analysis?.averageAttempts || 0}</div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="metric-tile p-4 h-100">
                <div className="small muted-copy">Leaderboard points</div>
                <div className="big-stat">{user?.points || 0}</div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-7">
              <div className="section-card p-4 h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Brain size={18} />
                  <div className="eyebrow text-primary mb-0">AI path guidance</div>
                </div>
                <h3 className="fw-bold mb-3">What to learn next</h3>
                <div className="d-grid gap-3">
                  {(path?.recommendations || []).length ? (
                    path.recommendations.map((item) => (
                      <div className="metric-tile p-3" key={item.topic}>
                        <div className="d-flex justify-content-between gap-3 align-items-start">
                          <div>
                            <div className="fw-bold">{item.topic}</div>
                            <div className="small muted-copy">{item.reason}</div>
                          </div>
                          <span className="soft-chip text-uppercase">{item.level}</span>
                        </div>
                        <div className="mt-3">
                          <div className="small muted-copy">Action</div>
                          <div>{item.action}</div>
                        </div>
                        <div className="mt-2">
                          <div className="small muted-copy">Resource idea</div>
                          <div>{item.resource}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="metric-tile p-4">
                      <div className="fw-semibold mb-2">No recommendations yet</div>
                      <div className="muted-copy mb-0">
                        Add your first study session and the recommendation engine will build a more personal path.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="section-card p-4 h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <BookOpen size={18} />
                  <div className="eyebrow text-primary mb-0">Topic mastery</div>
                </div>
                <h3 className="fw-bold mb-3">Where confidence is growing</h3>
                <div className="d-grid gap-3">
                  {topicBreakdown.length ? (
                    topicBreakdown.slice(0, 5).map((topic) => (
                      <div className="metric-tile p-3" key={topic.topic}>
                        <div className="d-flex justify-content-between gap-3 align-items-start">
                          <div>
                            <div className="fw-bold">{topic.topic}</div>
                            <div className="small muted-copy">
                              {topic.sessions} session{topic.sessions === 1 ? "" : "s"} logged
                            </div>
                          </div>
                          <span className="soft-chip text-capitalize">{topic.status}</span>
                        </div>
                        <div className="mt-2 fw-semibold">{topic.mastery}% mastery</div>
                        <div className="small muted-copy mt-1">
                          Quiz {topic.averageQuizScore}% • Coding {topic.averageCodingScore}% • Completion {topic.completionRate}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="metric-tile p-4">
                      <div className="fw-semibold mb-2">No mastery data yet</div>
                      <div className="muted-copy">
                        Once you log practice sessions, this panel will reveal your strongest and weakest topics.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">Log a study session</div>
                <h3 className="fw-bold mb-3">Make the system smarter with one practice update</h3>
                <form className="vstack gap-3" onSubmit={submitActivity}>
                  <select
                    className="form-select"
                    name="topic"
                    value={activityForm.topic}
                    onChange={updateActivity}
                  >
                    {TOPIC_OPTIONS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="quizScore"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Quiz score"
                        value={activityForm.quizScore}
                        onChange={updateActivity}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="codingScore"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Coding score"
                        value={activityForm.codingScore}
                        onChange={updateActivity}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="timeSpent"
                        type="number"
                        min="0"
                        placeholder="Time spent in minutes"
                        value={activityForm.timeSpent}
                        onChange={updateActivity}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="attempts"
                        type="number"
                        min="1"
                        placeholder="Attempts"
                        value={activityForm.attempts}
                        onChange={updateActivity}
                      />
                    </div>
                  </div>
                  <textarea
                    className="form-control"
                    name="feedback"
                    rows="4"
                    placeholder="What felt confusing, easy, or worth revisiting?"
                    value={activityForm.feedback}
                    onChange={updateActivity}
                  />
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="completed"
                      checked={activityForm.completed}
                      onChange={updateActivity}
                    />
                    <label className="form-check-label">Mark this learning activity as completed</label>
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save study session"}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">Recent activity</div>
                <h3 className="fw-bold mb-3">Your latest learning timeline</h3>
                <div className="d-grid gap-3">
                  {timelineItems.length ? (
                    timelineItems.map((item) => (
                      <div className="metric-tile p-3" key={item._id}>
                        <div className="d-flex justify-content-between gap-3 align-items-start">
                          <div>
                            <div className="fw-bold">{item.topic}</div>
                            <div className="small muted-copy">
                              Quiz {item.quizScore || 0}% • Coding {item.codingScore || 0}% • {item.timeSpent || 0} min
                            </div>
                          </div>
                          <span className="soft-chip">{item.completed ? "Completed" : "In Progress"}</span>
                        </div>
                        {item.feedback ? (
                          <div className="small muted-copy mt-2">{item.feedback}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="metric-tile p-4">
                      <div className="fw-semibold mb-2">No sessions logged yet</div>
                      <div className="muted-copy">
                        Your recent timeline will appear here after you log a study session.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="section-card p-4 h-100">
                <div className="eyebrow text-primary mb-2">Progress map</div>
                <h3 className="fw-bold mb-3">Topic-by-topic progress</h3>
                <div className="mb-4">
                  <ProgressChart data={chartData} />
                </div>
                <div className="row g-3">
                  {progressEntries.length ? (
                    progressEntries.map(([topic, details]) => (
                      <div className="col-md-6" key={topic}>
                        <div className="metric-tile p-3 h-100">
                          <div className="fw-bold">{topic}</div>
                          <div className="small muted-copy">Average score {Math.round(details.avgScore || 0)}%</div>
                          <div className="small muted-copy">
                            {details.completed || 0}/{details.total || 0} completed
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className="metric-tile p-4">
                        <div className="fw-semibold mb-2">No progress map yet</div>
                        <div className="muted-copy">
                          Log one or two sessions and this view will begin grouping your momentum by topic.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="section-card p-4 h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Trophy size={18} />
                  <div className="eyebrow text-primary mb-0">Leaderboard</div>
                </div>
                <h3 className="fw-bold mb-3">Healthy motivation for beginners</h3>
                <div className="d-grid gap-3">
                  {rankedUsers.length ? (
                    rankedUsers.map((entry) => (
                      <div className="metric-tile p-3" key={entry._id}>
                        <div className="d-flex justify-content-between align-items-center gap-3">
                          <div>
                            <div className="fw-bold">
                              #{entry.rank} {entry.name}
                            </div>
                            <div className="small muted-copy">{entry.points} points earned</div>
                          </div>
                          <Flame size={18} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="metric-tile p-4">
                      <div className="fw-semibold mb-2">No leaderboard data yet</div>
                      <div className="muted-copy">
                        Once learners start logging work, the leaderboard will reflect steady effort.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardShell>
      </main>
    </ProtectedRoute>
  );
}
