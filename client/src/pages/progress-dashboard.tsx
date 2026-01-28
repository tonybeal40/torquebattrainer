import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface SwingAnalysis {
  id: string;
  classification: string;
  gameReadiness: number;
  contactSpeedEstimate: string;
  timingGapFrames: number;
  createdAt: string;
  diagnoses: string[];
}

interface ProgressStats {
  totalSwings: number;
  averageReadiness: number;
  bestReadiness: number;
  improvement: number;
  mostCommonIssue: string;
  recentTrend: "improving" | "stable" | "declining";
}

function calculateStats(swings: SwingAnalysis[]): ProgressStats {
  if (swings.length === 0) {
    return {
      totalSwings: 0,
      averageReadiness: 0,
      bestReadiness: 0,
      improvement: 0,
      mostCommonIssue: "N/A",
      recentTrend: "stable",
    };
  }

  const readinessScores = swings.map((s) => s.gameReadiness);
  const avgReadiness = Math.round(
    readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length
  );
  const bestReadiness = Math.max(...readinessScores);

  const sortedByDate = [...swings].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let improvement = 0;
  let trend: "improving" | "stable" | "declining" = "stable";

  if (sortedByDate.length >= 2) {
    const firstHalf = sortedByDate.slice(0, Math.floor(sortedByDate.length / 2));
    const secondHalf = sortedByDate.slice(Math.floor(sortedByDate.length / 2));

    const firstAvg =
      firstHalf.reduce((a, b) => a + b.gameReadiness, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((a, b) => a + b.gameReadiness, 0) / secondHalf.length;

    improvement = Math.round(secondAvg - firstAvg);
    if (improvement > 5) trend = "improving";
    else if (improvement < -5) trend = "declining";
  }

  const allDiagnoses = swings.flatMap((s) => s.diagnoses || []);
  const diagnosisCounts: Record<string, number> = {};
  allDiagnoses.forEach((d) => {
    diagnosisCounts[d] = (diagnosisCounts[d] || 0) + 1;
  });

  const sortedDiagnoses = Object.entries(diagnosisCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const mostCommonIssue = sortedDiagnoses[0]?.[0] || "N/A";

  return {
    totalSwings: swings.length,
    averageReadiness: avgReadiness,
    bestReadiness,
    improvement,
    mostCommonIssue: formatDiagnosis(mostCommonIssue),
    recentTrend: trend,
  };
}

function formatDiagnosis(diagnosis: string): string {
  return diagnosis
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatClassification(classification: string): string {
  const map: Record<string, string> = {
    connected_sequence: "Connected Sequence",
    early_commit: "Early Commit",
    arm_dominant_swing: "Arm Dominant",
    simultaneous_start: "Simultaneous Start",
    insufficient_data: "Insufficient Data",
  };
  return map[classification] || classification;
}

function TrendIndicator({ trend }: { trend: "improving" | "stable" | "declining" }) {
  const config = {
    improving: { color: "text-emerald-400", icon: "↑", label: "Improving" },
    stable: { color: "text-amber-400", icon: "→", label: "Stable" },
    declining: { color: "text-red-400", icon: "↓", label: "Needs Work" },
  };

  const { color, icon, label } = config[trend];

  return (
    <span className={`${color} font-medium`}>
      {icon} {label}
    </span>
  );
}

function MiniChart({ swings }: { swings: SwingAnalysis[] }) {
  if (swings.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
        Upload more swings to see your progress chart
      </div>
    );
  }

  const sortedSwings = [...swings]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-10);

  const maxScore = 100;
  const minScore = 0;

  return (
    <div className="h-32 flex items-end justify-between gap-1 px-2">
      {sortedSwings.map((swing, i) => {
        const height = ((swing.gameReadiness - minScore) / (maxScore - minScore)) * 100;
        const isLast = i === sortedSwings.length - 1;

        return (
          <motion.div
            key={swing.id}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 5)}%` }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={`flex-1 rounded-t ${
              isLast ? "bg-emerald-500" : "bg-sky-500/70"
            } relative group cursor-pointer min-w-[20px] max-w-[40px]`}
          >
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {swing.gameReadiness}/100
              <br />
              {new Date(swing.createdAt).toLocaleDateString()}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ProgressDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [swings, setSwings] = useState<SwingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
      return;
    }

    if (isAuthenticated) {
      fetchSwings();
    }
  }, [isAuthenticated, authLoading]);

  const fetchSwings = async () => {
    try {
      const res = await fetch("/api/swing-history", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSwings(data);
      } else if (res.status === 401) {
        setLocation("/");
      }
    } catch (error) {
      console.error("Failed to fetch swings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const stats = calculateStats(swings);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-sky-400" data-testid="text-dashboard-title">
                Progress Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Track your swing improvement over time
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="border-slate-700 text-slate-300"
              data-testid="button-back-analyzer"
            >
              ← Back
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900/80 border-slate-700 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Swings</p>
              <p className="text-3xl font-bold text-white mt-1" data-testid="text-total-swings">
                {stats.totalSwings}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-slate-900/80 border-slate-700 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Avg Readiness</p>
              <p className="text-3xl font-bold text-sky-400 mt-1" data-testid="text-avg-readiness">
                {stats.averageReadiness}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900/80 border-slate-700 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Best Score</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1" data-testid="text-best-score">
                {stats.bestReadiness}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-slate-900/80 border-slate-700 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Trend</p>
              <p className="text-xl mt-1">
                <TrendIndicator trend={stats.recentTrend} />
              </p>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/80 border-slate-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">
              Game Readiness Over Time
            </h3>
            <MiniChart swings={swings} />
            <p className="text-xs text-slate-500 text-center mt-3">
              Last 10 swings • Hover for details
            </p>
          </Card>
        </motion.div>

        {stats.improvement !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-slate-900/80 border-slate-700 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-100 mb-2">
                Improvement Summary
              </h3>
              <p className="text-slate-300 text-sm">
                Your recent swings show a{" "}
                <span
                  className={
                    stats.improvement > 0 ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {stats.improvement > 0 ? "+" : ""}
                  {stats.improvement} point
                </span>{" "}
                change compared to your earlier swings.
              </p>
              {stats.mostCommonIssue !== "N/A" && (
                <p className="text-slate-400 text-sm mt-2">
                  Most common area to work on:{" "}
                  <span className="text-amber-400">{stats.mostCommonIssue}</span>
                </p>
              )}
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/80 border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              Recent Swings
            </h3>
            {swings.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No swings recorded yet. Upload your first swing to start tracking!
              </p>
            ) : (
              <div className="space-y-2">
                {swings.slice(0, 5).map((swing) => (
                  <div
                    key={swing.id}
                    className="flex justify-between items-center p-3 rounded bg-slate-800/50"
                  >
                    <div>
                      <p className="text-sm text-slate-100">
                        {formatClassification(swing.classification)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(swing.createdAt).toLocaleDateString()} •{" "}
                        {swing.contactSpeedEstimate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          swing.gameReadiness >= 70
                            ? "text-emerald-400"
                            : swing.gameReadiness >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {swing.gameReadiness}
                      </p>
                      <p className="text-xs text-slate-500">Readiness</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <footer className="mt-8 text-center">
          <a href="/" className="text-sky-400 hover:text-sky-300 text-sm">
            ← Back to Swing Analyzer
          </a>
        </footer>
      </div>
    </div>
  );
}
