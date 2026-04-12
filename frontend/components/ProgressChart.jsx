"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ProgressChart({ data }) {
  if (!data?.length) {
    return (
      <div className="metric-tile p-4">
        <div className="fw-semibold mb-2">No chart data yet</div>
        <div className="muted-copy">Log a few study sessions to unlock your progress trend.</div>
      </div>
    );
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1264ff" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#1264ff" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(100, 116, 139, 0.18)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="mastery"
            stroke="#1264ff"
            strokeWidth={3}
            fill="url(#progressFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
