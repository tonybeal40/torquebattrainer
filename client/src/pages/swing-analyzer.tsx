import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import swingHero from "../assets/images/baseball-swing-hero.png";

interface PoseResponse {
  frames_processed: number;
  hip_start_frame: number | null;
  hand_start_frame: number | null;
  timing_gap_frames: number | null;
  classification: string;
  diagnoses: string[];
  ai_explanation: string;
}

export default function SwingAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data: PoseResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError("Something went wrong while analyzing the swing.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Stadium-style background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.16),_transparent_55%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-slate-900 via-slate-950/60 to-transparent" />

      <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-slate-900 shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_0_40px_rgba(16,185,129,0.35)]"
              data-testid="logo-mark"
            >
              <span className="text-[18px] font-semibold text-emerald-400">BA</span>
            </div>
            <div className="leading-tight">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80"
                data-testid="text-brand-kicker"
              >
                Baseball Swing Analyzer
              </p>
              <p
                className="text-xs text-slate-300/90"
                data-testid="text-brand-subtitle"
              >
                Game-speed swing biomechanics, powered by pose estimation.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex text-[11px] font-medium text-slate-300/90">
            <span
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 uppercase tracking-[0.18em] text-emerald-300"
              data-testid="badge-beta"
            >
              Live Pipeline
            </span>
            <span
              className="text-[11px] text-slate-400"
              data-testid="text-header-proof"
            >
              Upload a swing & get raw pose JSON as proof it works.
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 lg:flex-row lg:items-start lg:py-12">
        {/* Left: marketing-style hero copy */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full space-y-6 lg:max-w-md"
        >
          <p
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300/90 shadow-[0_0_24px_rgba(16,185,129,0.45)]"
            data-testid="badge-mode"
          >
            Swing Capture • Beta
          </p>

          <div className="space-y-3">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50"
              data-testid="text-title"
            >
              Upload a swing.
              <br />
              See the hidden mechanics.
            </h1>
            <p
              className="text-sm sm:text-base text-slate-300 max-w-xl"
              data-testid="text-subtitle"
            >
              Drop in any batting video from your phone. We sample frames, run MediaPipe Pose, and return raw body landmarks so you know the analyzer is truly reading your swing's movement.
            </p>
          </div>

          <ul className="space-y-2 text-xs text-slate-300" data-testid="list-benefits">
            <li className="flex items-start gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span data-testid="text-benefit-1">Every 5th frame sampled for fast, game-ready feedback.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span data-testid="text-benefit-2">Full JSON of pose landmarks for verification and coaching tools.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span data-testid="text-benefit-3">Designed to embed directly into your public-facing website.</span>
            </li>
          </ul>

          <div className="overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900/80 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
            <img
              src={swingHero}
              alt="Baseball hitter mid-swing in a batting cage"
              className="h-44 w-full object-cover object-center sm:h-52"
              data-testid="img-hero-swing"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1"
              data-testid="badge-proof"
            >
              You get <span className="font-semibold text-slate-100">pose data</span>, not marketing fluff.
            </span>
            <span data-testid="text-footer-note">Perfect for hitters, coaches, and product demos.</span>
          </div>
        </motion.section>

        {/* Right: functional app card */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="flex w-full flex-1 flex-col gap-4"
        >
          <Card className="relative overflow-hidden border border-slate-800/80 bg-slate-950/80 shadow-[0_28px_80px_rgba(15,23,42,0.95)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.16),_transparent_55%)]" />
            <div className="relative p-6 sm:p-7 space-y-6">
              <div className="space-y-1">
                <h2
                  className="text-lg sm:text-xl font-semibold text-slate-50"
                  data-testid="text-form-title"
                >
                  Upload swing video
                </h2>
                <p
                  className="text-xs sm:text-sm text-slate-300"
                  data-testid="text-form-caption"
                >
                  MP4 / MOV from your phone is perfect. We'll automatically sample frames and run MediaPipe Pose on each key moment.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                data-testid="form-upload"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="video"
                    className="block text-xs font-semibold tracking-[0.18em] text-slate-200 uppercase"
                    data-testid="label-video"
                  >
                    Swing video file
                  </label>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                    className="cursor-pointer border-slate-700 bg-slate-950/70 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-400/95 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-slate-950 hover:file:bg-emerald-300/90"
                    data-testid="input-video"
                  />
                  <p
                    className="text-[11px] text-slate-400"
                    data-testid="text-video-hint"
                  >
                    Keep clips short for faster processing. We only sample every few frames to keep the pipeline snappy.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!file || isUploading}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold tracking-[0.18em] text-slate-950 shadow-[0_18px_50px_rgba(16,185,129,0.55)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid="button-analyze"
                >
                  {isUploading ? "Analyzing swing..." : "Analyze swing"}
                </Button>

                {isUploading && (
                  <div className="space-y-2" data-testid="status-uploading">
                    <Progress
                      value={45}
                      className="h-1.5 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:via-cyan-400 [&>div]:to-sky-400"
                    />
                    <p className="text-[11px] text-slate-400">
                      We're reading frames and extracting pose landmarks. This is the hard part—and the important proof.
                    </p>
                  </div>
                )}

                {error && (
                  <p
                    className="text-xs text-rose-400"
                    data-testid="status-error"
                  >
                    {error}
                  </p>
                )}

                {result && (
                  <div className="space-y-3 pt-2">
                    <p
                      className="text-xs font-medium text-emerald-400"
                      data-testid="status-success"
                    >
                      Analysis complete ✓ {result.frames_processed} frames processed.
                    </p>
                    
                    {result.hip_start_frame !== null && result.hand_start_frame !== null && (
                      <div className="space-y-3 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                            Movement Sequence Detected
                          </p>
                          <span 
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              result.classification === "connected_sequence" 
                                ? "bg-emerald-400/20 text-emerald-300" 
                                : result.classification === "early_commit"
                                ? "bg-amber-400/20 text-amber-300"
                                : result.classification === "arm_dominant_swing"
                                ? "bg-rose-400/20 text-rose-300"
                                : "bg-slate-400/20 text-slate-300"
                            }`}
                            data-testid="badge-classification"
                          >
                            {result.classification.replace(/_/g, " ")}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div data-testid="result-hip">
                            <span className="text-slate-400">Hip start:</span>
                            <span className="ml-2 font-semibold text-slate-50">Frame {result.hip_start_frame}</span>
                          </div>
                          <div data-testid="result-hand">
                            <span className="text-slate-400">Hand start:</span>
                            <span className="ml-2 font-semibold text-slate-50">Frame {result.hand_start_frame}</span>
                          </div>
                          <div data-testid="result-gap">
                            <span className="text-slate-400">Timing gap:</span>
                            <span className="ml-2 font-semibold text-slate-50">{result.timing_gap_frames} frames</span>
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-slate-400">
                          {result.classification === "connected_sequence" 
                            ? "✓ Excellent: Hips leading hands with tight connection (ideal mechanics)" 
                            : result.classification === "early_commit"
                            ? "⚠ Early commit: Hips fired too early, hands lagging behind"
                            : result.classification === "arm_dominant_swing"
                            ? "⚠ Arm swing: Hands leading hips (losing power from lower body)"
                            : result.classification === "simultaneous_start"
                            ? "→ Simultaneous start: Hips and hands moved together"
                            : "→ Analysis could not determine clear sequence"}
                        </p>
                      </div>
                    )}

                    {result.ai_explanation && (
                      <div className="space-y-2 rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                          AI Coach Feedback
                        </p>
                        <div 
                          className="text-xs text-slate-200 leading-relaxed whitespace-pre-line"
                          data-testid="text-ai-explanation"
                        >
                          {result.ai_explanation}
                        </div>
                      </div>
                    )}

                    <p
                      className="text-[11px] text-slate-400"
                      data-testid="text-proof-explainer"
                    >
                      Raw response JSON is shown below in the pipeline console.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </Card>

          <Card className="border border-slate-800/80 bg-slate-950/80 backdrop-blur-sm">
            <div className="border-b border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs text-slate-300">
              <span data-testid="text-console-label">Pipeline proof console</span>
              <span
                className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                data-testid="status-ready"
              >
                Ready
              </span>
            </div>
            <ScrollArea className="h-[320px]">
              <pre
                className="whitespace-pre-wrap break-words bg-slate-950/80 px-4 py-3 text-[11px] leading-relaxed text-slate-300/95 font-mono"
                data-testid="text-json-output"
              >
                {result
                  ? JSON.stringify(result, null, 2)
                  : `{
  "frames_processed": 18,
  "hip_start_frame": 25,
  "hand_start_frame": 40,
  "timing_gap_frames": 15,
  "classification": "early_commit",
  "diagnoses": ["early_commit_power_leak"],
  "ai_explanation": "1. What is happening..."
}`}
              </pre>
            </ScrollArea>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}
