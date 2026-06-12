"use client";

/**
 * Reusable progress bar aligned with PathPilot's dark premium UI.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = true,
  size = "md",
  className = "",
}) {
  const safeMax = max > 0 ? max : 100;
  const rawPercent = (Number(value) / safeMax) * 100;
  const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

  const trackHeight = size === "sm" ? 6 : size === "lg" ? 12 : 8;

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          {label ? <span className="small fw-semibold">{label}</span> : <span />}
          {showValue ? <span className="small muted-copy">{percent}%</span> : null}
        </div>
      )}
      <div
        className="progress"
        style={{ height: `${trackHeight}px`, background: "var(--line)" }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
      >
        <div
          className="progress-bar"
          style={{ width: `${percent}%`, background: "var(--accent)" }}
        />
      </div>
    </div>
  );
}
