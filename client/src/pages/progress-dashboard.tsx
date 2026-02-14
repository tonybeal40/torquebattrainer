import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { FuturisticBackground, GlowCard, RadialGauge, HudCorners, PulsingDot } from "@/components/futuristic-bg";

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
    improving: { color: "text-emerald-400", glow: "rgba(16,185,129,0.4)", icon: "↑", label: "IMPROVING" },
    stable: { color: "text-amber-400", glow: "rgba(245,158,11,0.4)", icon: "→", label: "STABLE" },
    declining: { color: "text-rose-400", glow: "rgba(244,63,94,0.4)", icon: "↓", label: "DECLINING" },
  };

  const { color, glow, icon, label } = config[trend];

  return (
    <span className={`${color} font-bold font-mono text-lg`} style={{ textShadow: `0 0 8px ${glow}` }}>
      {icon} {label}
    </span>
  );
}

function MiniChart({ swings }: { swings: SwingAnalysis[] }) {
  if (swings.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-600 text-sm font-mono">
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
    <div className="h-40 flex items-end justify-between gap-1.5 px-2">
      {sortedSwings.map((swing, i) => {
        const height = ((swing.gameReadiness - minScore) / (maxScore - minScore)) * 100;
        const isLast = i === sortedSwings.length - 1;
        const barColor = swing.gameReadiness >= 70 ? "from-emerald-500 to-emerald-400" :
          swing.gameReadiness >= 50 ? "from-amber-500 to-amber-400" : "from-rose-500 to-rose-400";
        const glowColor = swing.gameReadiness >= 70 ? "rgba(16,185,129,0.3)" :
          swing.gameReadiness >= 50 ? "rgba(245,158,11,0.3)" : "rgba(244,63,94,0.3)";

        return (
          <motion.div
            key={swing.id}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 5)}%` }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            className={`flex-1 rounded-t-md bg-gradient-to-t ${barColor} relative group cursor-pointer min-w-[24px] max-w-[48px] ${isLast ? "ring-1 ring-white/20" : ""}`}
            style={{
              boxShadow: isLast ? `0 0 12px ${glowColor}` : `0 0 6px ${glowColor}`,
            }}
          >
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-[11px] text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700/50 font-mono shadow-lg">
              <span className="font-bold">{swing.gameReadiness}</span>/100
              <br />
              <span className="text-slate-400">{new Date(swing.createdAt).toLocaleDateString()}</span>
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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden">
        <FuturisticBackground />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-5 w-5 rounded-full border-2 border-cyan-400 border-t-transparent"
          />
          <span className="text-slate-400 font-mono text-sm">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const stats = calculateStats(swings);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 relative overflow-hidden">
      <FuturisticBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PulsingDot color="cyan" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono">Analytics</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent" data-testid="text-dashboard-title">
                Progress Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-mono">
                Track your swing improvement over time
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="border-slate-700/50 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
              data-testid="button-back-analyzer"
            >
              ← Back
            </Button>
          </div>
        </motion.header>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <GlowCard className="p-5" glowColor="cyan">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Total Swings</p>
              <p className="text-4xl font-bold text-white mt-2 font-mono" data-testid="text-total-swings" style={{ textShadow: "0 0 10px rgba(6,182,212,0.3)" }}>
                {stats.totalSwings}
              </p>
            </GlowCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlowCard className="p-5 flex items-center justify-center" glowColor="emerald">
              <RadialGauge value={stats.averageReadiness} size={110} label="Avg" />
            </GlowCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <GlowCard className="p-5" glowColor="emerald">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Peak Score</p>
              <p className="text-4xl font-bold text-emerald-400 mt-2 font-mono" data-testid="text-best-score" style={{ textShadow: "0 0 10px rgba(16,185,129,0.4)" }}>
                {stats.bestReadiness}
              </p>
            </GlowCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlowCard className="p-5" glowColor={stats.recentTrend === "improving" ? "emerald" : stats.recentTrend === "declining" ? "rose" : "amber"}>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Trend</p>
              <div className="mt-2">
                <TrendIndicator trend={stats.recentTrend} />
              </div>
            </GlowCard>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlowCard className="p-6 mb-6" glowColor="cyan">
            <HudCorners />
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              <h3 className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono">Readiness Timeline</h3>
            </div>
            <MiniChart swings={swings} />
            <p className="text-[10px] text-slate-600 text-center mt-3 font-mono">
              Last 10 analyses | Hover for details
            </p>
          </GlowCard>
        </motion.div>

        {stats.improvement !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlowCard className="p-6 mb-6" glowColor={stats.improvement > 0 ? "emerald" : "rose"}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${stats.improvement > 0 ? "bg-emerald-400" : "bg-rose-400"}`} />
                <h3 className="text-[10px] uppercase tracking-wider font-mono" style={{ color: stats.improvement > 0 ? "#34d399" : "#fb7185" }}>
                  Improvement Analysis
                </h3>
              </div>
              <p className="text-slate-300 text-sm">
                Your recent swings show a{" "}
                <span
                  className={`font-bold font-mono ${
                    stats.improvement > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                  style={{
                    textShadow: stats.improvement > 0 ? "0 0 6px rgba(16,185,129,0.4)" : "0 0 6px rgba(244,63,94,0.4)"
                  }}
                >
                  {stats.improvement > 0 ? "+" : ""}
                  {stats.improvement} point
                </span>{" "}
                change compared to your earlier swings.
              </p>
              {stats.mostCommonIssue !== "N/A" && (
                <p className="text-slate-400 text-sm mt-2 font-mono">
                  Focus area:{" "}
                  <span className="text-amber-400 font-semibold">{stats.mostCommonIssue}</span>
                </p>
              )}
            </GlowCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <GlowCard className="p-6" glowColor="cyan">
            <HudCorners />
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              <h3 className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono">Analysis Log</h3>
            </div>
            {swings.length === 0 ? (
              <p className="text-slate-600 text-sm font-mono text-center py-8">
                No swings recorded. Upload your first swing to begin tracking.
              </p>
            ) : (
              <div className="space-y-2">
                {swings.slice(0, 5).map((swing, i) => (
                  <motion.div
                    key={swing.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex justify-between items-center p-4 rounded-lg bg-slate-900/50 border border-slate-800/30 hover:border-slate-700/50 transition-all group"
                  >
                    <div>
                      <p className="text-sm text-slate-100 font-medium">
                        {formatClassification(swing.classification)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {new Date(swing.createdAt).toLocaleDateString()} | {swing.contactSpeedEstimate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold font-mono ${
                          swing.gameReadiness >= 70
                            ? "text-emerald-400"
                            : swing.gameReadiness >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                        style={{
                          textShadow: swing.gameReadiness >= 70 ? "0 0 8px rgba(16,185,129,0.4)" :
                            swing.gameReadiness >= 50 ? "0 0 8px rgba(245,158,11,0.4)" : "0 0 8px rgba(244,63,94,0.4)"
                        }}
                      >
                        {swing.gameReadiness}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Readiness</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlowCard>
        </motion.div>

        <footer className="mt-8 text-center">
          <a href="/" className="text-cyan-400 hover:text-cyan-300 text-sm font-mono transition-colors" data-testid="link-back-analyzer">
            ← Back to Analyzer
          </a>
        </footer>
      </div>
    </div>
  );
}
