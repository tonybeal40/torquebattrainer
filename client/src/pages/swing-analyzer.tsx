import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoPlayer } from "@/components/video-player";
import { exportSwingToPDF } from "@/lib/pdf-export";
import { FuturisticBackground, GlowCard, RadialGauge, ScanLine, HudCorners, PulsingDot } from "@/components/futuristic-bg";

interface PoseResponse {
  id: string | null;
  frames_processed: number;
  hip_start_frame: number | null;
  hand_start_frame: number | null;
  timing_gap_frames: number | null;
  classification: string;
  diagnoses: string[];
  ai_explanation: string;
  game_readiness: number;
  contact_speed_estimate: string;
  created_at: string;
}

interface SwingHistory {
  id: string;
  classification: string;
  gameReadiness: number;
  contactSpeedEstimate: string;
  timingGapFrames: number;
  createdAt: string;
  diagnoses: string[];
}

interface ProExample {
  id: string;
  name: string;
  description: string;
  classification: string;
  timingGapFrames: number;
  gameReadiness: number;
  contactSpeedEstimate: string;
  diagnoses: string[];
}

function getReadinessLabel(score: number): string {
  if (score <= 30) return "Needs game-speed adjustment";
  if (score <= 60) return "Limited game readiness";
  if (score <= 80) return "Competitive readiness";
  return "Advanced readiness";
}

function getReadinessColor(score: number): "emerald" | "amber" | "rose" | "cyan" {
  if (score >= 70) return "emerald";
  if (score >= 50) return "amber";
  return "rose";
}

function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        localStorage.clear();
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-red-400 focus:text-red-300 cursor-pointer"
          data-testid="button-delete-account-trigger"
        >
          Delete Account
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Delete Account</DialogTitle>
          <DialogDescription className="text-slate-400">
            This will permanently delete your account and all associated data, including your swing history. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-300 mb-2">
            Type <strong className="text-red-400">DELETE</strong> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="bg-slate-900/80 border-slate-600"
            data-testid="input-delete-confirm"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-600"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || deleting}
            data-testid="button-confirm-delete"
          >
            {deleting ? "Deleting..." : "Delete My Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SwingAnalyzerPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [pitchType, setPitchType] = useState("unknown");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [swingHistory, setSwingHistory] = useState<SwingHistory[]>([]);
  const [proExamples, setProExamples] = useState<ProExample[]>([]);
  const [compareSwing, setCompareSwing] = useState<SwingHistory | ProExample | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("swing_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSwingHistory();
    }
    fetchProExamples();
  }, [isAuthenticated]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreview(null);
    }
  }, [file]);

  async function fetchSwingHistory() {
    try {
      const res = await fetch("/api/swing-history", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSwingHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch swing history:", err);
    }
  }

  async function fetchProExamples() {
    try {
      const res = await fetch("/api/pro-examples");
      if (res.ok) {
        const data = await res.json();
        setProExamples(data);
      }
    } catch (err) {
      console.error("Failed to fetch pro examples:", err);
    }
  }

  async function generateTrainingPlan() {
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please login to generate a training plan.", variant: "destructive" });
      return;
    }
    
    setLoadingPlan(true);
    try {
      const res = await fetch("/api/training-plan", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTrainingPlan(data.plan);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate training plan", variant: "destructive" });
    } finally {
      setLoadingPlan(false);
    }
  }

  function dismissOnboarding() {
    localStorage.setItem("swing_onboarding_seen", "true");
    setShowOnboarding(false);
  }

  const [uploadProgress, setUploadProgress] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError("Video file is too large (max 100MB). Try trimming your clip to 5-10 seconds.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);
    setUploadProgress("Uploading video...");

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("pitch_type", pitchType);

      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            if (pct < 100) {
              setUploadProgress(`Uploading video... ${pct}%`);
            } else {
              setUploadProgress("Analyzing your swing... this may take a moment");
            }
          }
        };
        
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.hint || data.error || "Upload failed"));
            }
          } catch {
            reject(new Error("Failed to process server response"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Network error — check your connection and try again"));
        xhr.ontimeout = () => reject(new Error("Upload timed out — try a shorter video clip"));
        
        xhr.open("POST", "/api/upload");
        xhr.withCredentials = true;
        xhr.timeout = 180000;
        xhr.send(formData);
      });

      const data = await uploadPromise;
      setResult(data as PoseResponse);
      
      if (isAuthenticated) {
        fetchSwingHistory();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while analyzing the swing.";
      setError(message);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  }

  function formatClassification(classification: string): string {
    return classification.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatDiagnosis(diagnosis: string): string {
    return diagnosis.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  async function shareAnalysis() {
    if (!result?.id) {
      toast({ title: "Cannot share", description: "Login to save and share your analysis.", variant: "destructive" });
      return;
    }
    
    const shareUrl = `${window.location.origin}/swing/${result.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Swing Analysis",
          text: `Check out my swing analysis: ${formatClassification(result.classification)} - Game Readiness: ${result.game_readiness}/100`,
          url: shareUrl,
        });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copied!", description: "Share link copied to clipboard." });
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center px-6 relative overflow-hidden">
        <FuturisticBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <GlowCard className="p-8 max-w-md w-full space-y-6" glowColor="cyan">
            <HudCorners />
            <div className="flex items-center gap-3 mb-2">
              <PulsingDot color="cyan" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono">System Online</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent" data-testid="text-onboarding-title">
              Late-Decision Swing Analysis
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              This system analyzes swing decision timing, not just positions.
            </p>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              It detects when the body commits relative to the hands and explains how that timing affects performance against real pitches.
            </p>
            
            <div className="text-sm text-slate-300 space-y-3 border-l-2 border-cyan-500/30 pl-4">
              <p className="text-cyan-400 text-xs uppercase tracking-wider font-mono">Analysis Output</p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> One clear diagnosis</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> One correction focus</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> One drill to work on</li>
              </ul>
            </div>
            
            <p className="text-[11px] text-slate-600 font-mono">
              Instructional feedback only. Designed to support training.
            </p>
            
            <Button
              onClick={dismissOnboarding}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-emerald-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
              data-testid="button-start-analysis"
            >
              Initialize Analysis
            </Button>
          </GlowCard>
        </motion.div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 relative overflow-hidden">
        <FuturisticBackground />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <PulsingDot color="emerald" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-mono">Analysis Complete</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent" data-testid="text-results-title">
              Swing Analysis Report
            </h1>
          </motion.header>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlowCard className="p-6 space-y-5" glowColor="cyan">
                <HudCorners />
                {videoPreview && (
                  <div data-testid="section-video-preview">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      <p className="text-[11px] uppercase tracking-wider text-cyan-400 font-mono">Video Feed</p>
                    </div>
                    <VideoPlayer src={videoPreview} />
                  </div>
                )}

                <div className="flex justify-center py-2" data-testid="section-game-readiness">
                  <RadialGauge
                    value={result.game_readiness}
                    label="Readiness"
                    sublabel={getReadinessLabel(result.game_readiness)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4" data-testid="section-stats">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Classification</p>
                    <p className="text-sm font-semibold text-white mt-1">{formatClassification(result.classification)}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Timing Gap</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {result.timing_gap_frames !== null ? `${result.timing_gap_frames} frames` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Contact Speed</p>
                    <p className="text-sm font-semibold text-white mt-1">{result.contact_speed_estimate}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Frames</p>
                    <p className="text-sm font-semibold text-white mt-1">{result.frames_processed}</p>
                  </div>
                </div>

                {result.diagnoses.length > 0 && (
                  <div data-testid="section-findings">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-2">Diagnostics</p>
                    <div className="flex flex-wrap gap-2">
                      {result.diagnoses.map((d, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[12px] text-cyan-300 font-mono"
                          data-testid={`pill-diagnosis-${i}`}
                        >
                          {formatDiagnosis(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={shareAnalysis}
                    variant="outline"
                    className="flex-1 border-slate-700/50 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
                    data-testid="button-share"
                  >
                    Share
                  </Button>
                  <Button
                    onClick={() => {
                      if (result) {
                        exportSwingToPDF({
                          id: result.id || "analysis",
                          classification: result.classification,
                          gameReadiness: result.game_readiness,
                          contactSpeedEstimate: result.contact_speed_estimate,
                          timingGapFrames: result.timing_gap_frames,
                          diagnoses: result.diagnoses,
                          aiExplanation: result.ai_explanation,
                          createdAt: result.created_at,
                        }, user?.firstName || undefined);
                      }
                    }}
                    variant="outline"
                    className="flex-1 border-slate-700/50 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 transition-all"
                    data-testid="button-export-pdf"
                  >
                    Export PDF
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-700/50 text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300 transition-all"
                        data-testid="button-compare"
                      >
                        Compare
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-700/50 text-slate-100 max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Compare Swings</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="history" className="w-full">
                        <TabsList className="bg-slate-900/80 w-full border border-slate-700/30">
                          <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-300">Your History</TabsTrigger>
                          <TabsTrigger value="examples" className="flex-1 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-300">Pro Examples</TabsTrigger>
                        </TabsList>
                        <TabsContent value="history" className="space-y-2 max-h-60 overflow-y-auto">
                          {swingHistory.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center font-mono">
                              {isAuthenticated ? "No previous swings yet." : "Login to save swing history."}
                            </p>
                          ) : (
                            swingHistory.map((swing) => (
                              <button
                                key={swing.id}
                                onClick={() => setCompareSwing(swing)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  compareSwing?.id === swing.id 
                                    ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                                    : "border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50"
                                }`}
                              >
                                <p className="text-sm font-medium">{formatClassification(swing.classification)}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  Readiness: {swing.gameReadiness}/100 | {new Date(swing.createdAt).toLocaleDateString()}
                                </p>
                              </button>
                            ))
                          )}
                        </TabsContent>
                        <TabsContent value="examples" className="space-y-2 max-h-60 overflow-y-auto">
                          {proExamples.map((example) => (
                            <button
                              key={example.id}
                              onClick={() => setCompareSwing(example)}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                compareSwing?.id === example.id 
                                  ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                                  : "border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50"
                              }`}
                            >
                              <p className="text-sm font-medium">{example.name}</p>
                              <p className="text-xs text-slate-400">{example.description}</p>
                            </button>
                          ))}
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </GlowCard>
            </motion.div>

            <div className="space-y-6">
              <AnimatePresence>
                {compareSwing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <GlowCard className="p-5 space-y-4" glowColor="cyan">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <p className="text-[10px] uppercase tracking-wider text-blue-400 font-mono">Comparison Matrix</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/30">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-mono mb-1">Your Swing</p>
                          <p className="text-2xl font-bold text-white">{result.game_readiness}<span className="text-sm text-slate-500">/100</span></p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/30">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-mono mb-1">
                            {"name" in compareSwing ? compareSwing.name : "Previous"}
                          </p>
                          <p className="text-2xl font-bold text-white">{compareSwing.gameReadiness}<span className="text-sm text-slate-500">/100</span></p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/30">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-mono mb-1">Your Gap</p>
                          <p className="text-lg font-semibold text-cyan-300">{result.timing_gap_frames ?? "N/A"} <span className="text-xs text-slate-500">frames</span></p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/30">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-mono mb-1">Ref Gap</p>
                          <p className="text-lg font-semibold text-cyan-300">{compareSwing.timingGapFrames} <span className="text-xs text-slate-500">frames</span></p>
                        </div>
                      </div>
                      <p className={`text-xs font-mono px-3 py-2 rounded-lg ${
                        result.game_readiness > compareSwing.gameReadiness
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : result.game_readiness < compareSwing.gameReadiness
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800/50 text-slate-400 border border-slate-700/30"
                      }`}>
                        {result.game_readiness > compareSwing.gameReadiness
                          ? "Performance exceeds reference benchmark."
                          : result.game_readiness < compareSwing.gameReadiness
                          ? "Focus on coach feedback to close the gap."
                          : "Consistent with reference benchmark."}
                      </p>
                    </GlowCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {result.ai_explanation && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <GlowCard className="p-6" glowColor="emerald">
                    <HudCorners />
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">Coach Intelligence</p>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed border-l-2 border-emerald-500/30 pl-4 font-sans">
                      {result.ai_explanation}
                    </div>
                  </GlowCard>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlowCard className="p-6 space-y-4" glowColor="amber">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      <p className="text-[10px] uppercase tracking-wider text-amber-400 font-mono">Training Protocol</p>
                    </div>
                    <Button
                      onClick={generateTrainingPlan}
                      disabled={loadingPlan || !isAuthenticated}
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      data-testid="button-training-plan"
                    >
                      {loadingPlan ? "Generating..." : "Generate Plan"}
                    </Button>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-xs text-slate-500 font-mono">Login to generate personalized training plans.</p>
                  )}
                  {trainingPlan && (
                    <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed border-l-2 border-amber-500/30 pl-4">
                      {trainingPlan}
                    </div>
                  )}
                </GlowCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center space-y-3"
              >
                <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                  Powered by Late-Decision Swing Analysis
                </p>
                <Button
                  onClick={() => { setResult(null); setFile(null); setCompareSwing(null); }}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-emerald-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                  data-testid="button-analyze-another"
                >
                  Analyze Another Swing
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 relative overflow-hidden">
      <FuturisticBackground />
      <div className="relative z-10 mx-auto max-w-md px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex justify-center mb-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer hover:opacity-80 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-full px-3 py-1.5 transition-all hover:border-cyan-500/30">
                  {user?.profileImageUrl && (
                    <img src={user.profileImageUrl} alt="" className="w-6 h-6 rounded-full ring-1 ring-cyan-500/30" />
                  )}
                  <span className="text-sm text-slate-300">{user?.firstName || user?.email}</span>
                  <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer text-slate-200">
                      Sign Out
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700/50" />
                  <DeleteAccountDialog />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a
                href="/api/login"
                className="text-sm text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 transition-all hover:bg-cyan-500/20 font-mono"
                data-testid="link-login"
              >
                Login to save swings
              </a>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <PulsingDot color="cyan" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-mono">System Ready</span>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent" data-testid="text-title">
            Swing Analysis
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-mono">
            Late-Decision Swing Analysis
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Game-relevant swing feedback from video
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard className="p-6" glowColor="cyan">
            <ScanLine />
            <HudCorners />
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              <h2 className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono">Upload Module</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Upload a short video from the side view. The system analyzes swing sequence and balance patterns.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-upload">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-2">
                  Pitch Context
                </label>
                <Select value={pitchType} onValueChange={setPitchType}>
                  <SelectTrigger 
                    className="w-full border-slate-700/50 bg-slate-900/80 text-slate-100 backdrop-blur-sm focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    data-testid="select-pitch-type"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
                    <SelectItem value="unknown">Unknown / Mixed</SelectItem>
                    <SelectItem value="fastball">Fastball</SelectItem>
                    <SelectItem value="breaking">Breaking Ball</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-2">
                  Video Input
                </label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  className="w-full border-slate-700/50 bg-slate-900/80 text-slate-100 backdrop-blur-sm file:mr-4 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-emerald-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:from-cyan-400 hover:file:to-emerald-400 focus:border-cyan-500/50"
                  data-testid="input-video"
                />
              </div>

              {videoPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  data-testid="video-preview"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">Preview</p>
                  </div>
                  <VideoPlayer src={videoPreview} className="max-h-64" />
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={!file || isUploading}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                data-testid="button-analyze"
              >
                {isUploading ? (uploadProgress || "Analyzing...") : "Analyze Swing"}
              </Button>

              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-2"
                    data-testid="status-uploading"
                  >
                    <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                        animate={{ width: uploadProgress.includes("%") ? uploadProgress.match(/\d+/)?.[0] + "%" : "100%" }}
                        transition={{ duration: 0.3 }}
                        style={{
                          boxShadow: "0 0 10px rgba(6,182,212,0.5)",
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-3 w-3 rounded-full border border-cyan-400 border-t-transparent"
                      />
                      {uploadProgress || "Processing video frames..."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 font-mono"
                    data-testid="status-error"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <p className="mt-5 text-[10px] text-slate-600 text-center font-mono">
              Instructional feedback only. Designed to support training.
            </p>
          </GlowCard>
        </motion.div>

        <AnimatePresence>
          {isAuthenticated && swingHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlowCard className="mt-6 p-5" glowColor="emerald">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <h3 className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">Recent Analyses</h3>
                  </div>
                  <a 
                    href="/progress" 
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                    data-testid="link-progress-dashboard"
                  >
                    Dashboard →
                  </a>
                </div>
                <div className="space-y-2">
                  {swingHistory.slice(0, 3).map((swing) => (
                    <div key={swing.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-slate-800/30 hover:border-slate-700/50 transition-all">
                      <div>
                        <p className="text-sm text-slate-100 font-medium">{formatClassification(swing.classification)}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{new Date(swing.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`text-lg font-bold font-mono ${
                        swing.gameReadiness >= 70 ? "text-emerald-400" :
                        swing.gameReadiness >= 50 ? "text-amber-400" : "text-rose-400"
                      }`} style={{
                        textShadow: swing.gameReadiness >= 70 ? "0 0 8px rgba(16,185,129,0.4)" :
                          swing.gameReadiness >= 50 ? "0 0 8px rgba(245,158,11,0.4)" : "0 0 8px rgba(244,63,94,0.4)"
                      }}>
                        {swing.gameReadiness}
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-8 pb-6 text-center">
          <div className="flex justify-center gap-4 text-[11px] text-slate-600 font-mono">
            <a href="/terms" className="hover:text-slate-400 transition-colors" data-testid="link-terms">
              Terms
            </a>
            <span className="text-slate-800">|</span>
            <a href="/privacy" className="hover:text-slate-400 transition-colors" data-testid="link-privacy">
              Privacy
            </a>
          </div>
          <p className="mt-2 text-[10px] text-slate-700 font-mono">
            {new Date().getFullYear()} Torque Bat Trainer
          </p>
        </footer>
      </div>
    </div>
  );
}
