import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("pitch_type", pitchType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data: PoseResponse = await res.json();
      setResult(data);
      
      if (isAuthenticated) {
        fetchSwingHistory();
      }
    } catch (err) {
      setError("Something went wrong while analyzing the swing.");
      console.error(err);
    } finally {
      setIsUploading(false);
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <Card className="border border-slate-800 bg-slate-950 p-6 max-w-md w-full space-y-5">
          <h2 className="text-xl font-semibold text-sky-400" data-testid="text-onboarding-title">
            What This App Does
          </h2>
          
          <p className="text-sm text-slate-300 leading-relaxed">
            This app analyzes swing decision timing, not just positions.
          </p>
          
          <p className="text-sm text-slate-300 leading-relaxed">
            It looks at when the body commits relative to the hands and explains how that timing affects performance against real pitches.
          </p>
          
          <div className="text-sm text-slate-300 space-y-2">
            <p>You'll receive:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>One clear diagnosis</li>
              <li>One correction focus</li>
              <li>One drill to work on</li>
            </ul>
          </div>
          
          <p className="text-xs text-slate-500">
            This tool supports training and coaching. It does not replace in-person instruction.
          </p>
          
          <Button
            onClick={dismissOnboarding}
            className="w-full rounded-lg bg-sky-400 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300"
            data-testid="button-start-analysis"
          >
            Start Analysis
          </Button>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-sky-400" data-testid="text-results-title">
              Swing Analysis Results
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Coaching-focused feedback based on swing sequence
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-slate-800 bg-slate-950 p-5 space-y-5">
              {videoPreview && (
                <div data-testid="section-video-preview">
                  <p className="text-[13px] text-slate-400 mb-2">Your Swing</p>
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg border border-slate-700"
                  />
                </div>
              )}

              <div data-testid="section-classification">
                <p className="text-[13px] text-slate-400 mb-1">Swing Sequence</p>
                <p className="text-base text-slate-100">{formatClassification(result.classification)}</p>
              </div>

              <div data-testid="section-timing">
                <p className="text-[13px] text-slate-400 mb-1">Timing Gap</p>
                <p className="text-base text-slate-100">{result.timing_gap_frames} frames</p>
              </div>

              {result.diagnoses.length > 0 && (
                <div data-testid="section-findings">
                  <p className="text-[13px] text-slate-400 mb-2">Key Findings</p>
                  <div className="flex flex-wrap gap-2">
                    {result.diagnoses.map((d, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-800 px-3 py-1.5 text-[13px] text-slate-200"
                        data-testid={`pill-diagnosis-${i}`}
                      >
                        {formatDiagnosis(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div data-testid="section-game-readiness">
                <p className="text-[13px] text-slate-400 mb-1">Game-Readiness Index</p>
                <p className="text-xl font-semibold text-slate-100">{result.game_readiness}/100</p>
                <p className="text-xs text-slate-400 mt-1">{getReadinessLabel(result.game_readiness)}</p>
              </div>

              <div data-testid="section-contact-speed">
                <p className="text-[13px] text-slate-400 mb-1">Estimated Contact Speed</p>
                <p className="text-base text-slate-100">{result.contact_speed_estimate}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={shareAnalysis}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  data-testid="button-share"
                >
                  Share
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                      data-testid="button-compare"
                    >
                      Compare
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-sky-400">Compare Swings</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="history" className="w-full">
                      <TabsList className="bg-slate-900 w-full">
                        <TabsTrigger value="history" className="flex-1">Your History</TabsTrigger>
                        <TabsTrigger value="examples" className="flex-1">Pro Examples</TabsTrigger>
                      </TabsList>
                      <TabsContent value="history" className="space-y-2 max-h-60 overflow-y-auto">
                        {swingHistory.length === 0 ? (
                          <p className="text-sm text-slate-400 py-4 text-center">
                            {isAuthenticated ? "No previous swings yet." : "Login to save swing history."}
                          </p>
                        ) : (
                          swingHistory.map((swing) => (
                            <button
                              key={swing.id}
                              onClick={() => setCompareSwing(swing)}
                              className={`w-full text-left p-3 rounded-lg border ${
                                compareSwing?.id === swing.id 
                                  ? "border-sky-400 bg-sky-400/10" 
                                  : "border-slate-700 hover:bg-slate-800"
                              }`}
                            >
                              <p className="text-sm font-medium">{formatClassification(swing.classification)}</p>
                              <p className="text-xs text-slate-400">
                                Readiness: {swing.gameReadiness}/100 • {new Date(swing.createdAt).toLocaleDateString()}
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
                            className={`w-full text-left p-3 rounded-lg border ${
                              compareSwing?.id === example.id 
                                ? "border-sky-400 bg-sky-400/10" 
                                : "border-slate-700 hover:bg-slate-800"
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
            </Card>

            <div className="space-y-6">
              {compareSwing && (
                <Card className="border border-sky-400/30 bg-sky-400/5 p-5 space-y-4">
                  <p className="text-[13px] font-medium text-sky-400">Comparison</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Your Swing</p>
                      <p className="text-slate-100">{result.game_readiness}/100</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">
                        {"name" in compareSwing ? compareSwing.name : "Previous"}
                      </p>
                      <p className="text-slate-100">{compareSwing.gameReadiness}/100</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Gap</p>
                      <p className="text-slate-100">{result.timing_gap_frames} frames</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Gap</p>
                      <p className="text-slate-100">{compareSwing.timingGapFrames} frames</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {result.game_readiness > compareSwing.gameReadiness
                      ? "Your current swing shows improvement!"
                      : result.game_readiness < compareSwing.gameReadiness
                      ? "Focus on the coach feedback to close the gap."
                      : "Consistent performance."}
                  </p>
                </Card>
              )}

              {result.ai_explanation && (
                <Card className="border border-slate-800 bg-slate-950 p-5">
                  <p className="text-[13px] text-slate-400 mb-2">Coach Breakdown</p>
                  <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950 border-l-4 border-sky-400 pl-4 py-3 leading-relaxed">
                    {result.ai_explanation}
                  </pre>
                </Card>
              )}

              <Card className="border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-slate-400">Training Plan</p>
                  <Button
                    onClick={generateTrainingPlan}
                    disabled={loadingPlan || !isAuthenticated}
                    size="sm"
                    className="bg-sky-400 text-slate-950 hover:bg-sky-300"
                    data-testid="button-training-plan"
                  >
                    {loadingPlan ? "Generating..." : "Generate Plan"}
                  </Button>
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-slate-500">Login to generate personalized training plans.</p>
                )}
                {trainingPlan && (
                  <pre className="whitespace-pre-wrap text-sm text-slate-100 leading-relaxed">
                    {trainingPlan}
                  </pre>
                )}
              </Card>

              <p className="text-xs text-slate-500 text-center">
                Powered by Late-Decision Swing Analysis™
              </p>

              <Button
                onClick={() => { setResult(null); setFile(null); setCompareSwing(null); }}
                className="w-full rounded-lg bg-sky-400 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300"
                data-testid="button-analyze-another"
              >
                Analyze Another Swing
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-md px-6 py-8">
        <header className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.profileImageUrl && (
                  <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm text-slate-300">{user?.firstName || user?.email}</span>
                <a href="/api/logout" className="text-xs text-slate-500 hover:text-slate-300">Logout</a>
              </div>
            ) : (
              <a
                href="/api/login"
                className="text-sm text-sky-400 hover:text-sky-300"
                data-testid="link-login"
              >
                Login to save your swings
              </a>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-sky-400" data-testid="text-title">
            Baseball Swing Analysis
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Late-Decision Swing Analysis™
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Game-relevant swing feedback from video
          </p>
        </header>

        <Card className="border border-slate-800 bg-slate-950 p-5">
          <h2 className="text-lg font-semibold text-slate-100 mb-2" data-testid="text-form-title">
            Upload a Swing Video
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            Upload a short video from the side view. The system analyzes swing sequence and balance patterns.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-upload">
            <div>
              <label className="block text-[13px] text-slate-300 mb-2">
                Pitch Context
              </label>
              <Select value={pitchType} onValueChange={setPitchType}>
                <SelectTrigger 
                  className="w-full border-slate-800 bg-slate-950 text-slate-100"
                  data-testid="select-pitch-type"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="unknown">Unknown / Mixed</SelectItem>
                  <SelectItem value="fastball">Fastball</SelectItem>
                  <SelectItem value="breaking">Breaking Ball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[13px] text-slate-300 mb-2">
                Swing Video
              </label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="w-full border-slate-800 bg-slate-950 text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-sky-400 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-sky-300"
                data-testid="input-video"
              />
            </div>

            {videoPreview && (
              <div data-testid="video-preview">
                <p className="text-[13px] text-slate-400 mb-2">Preview</p>
                <video
                  src={videoPreview}
                  controls
                  className="w-full rounded-lg border border-slate-700 max-h-48"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={!file || isUploading}
              className="w-full rounded-lg bg-sky-400 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="button-analyze"
            >
              {isUploading ? "Analyzing..." : "Analyze Swing"}
            </Button>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400" data-testid="status-uploading">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent"
                />
                Processing video frames...
              </div>
            )}

            {error && (
              <p className="text-sm text-rose-400 text-center" data-testid="status-error">
                {error}
              </p>
            )}
          </form>

          <p className="mt-5 text-xs text-slate-500 text-center">
            Instructional feedback only. Designed to support training, not replace coaching.
          </p>
        </Card>

        {isAuthenticated && swingHistory.length > 0 && (
          <Card className="mt-6 border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Recent Swings</h3>
            <div className="space-y-2">
              {swingHistory.slice(0, 3).map((swing) => (
                <div key={swing.id} className="flex justify-between items-center p-2 rounded bg-slate-900">
                  <div>
                    <p className="text-sm text-slate-100">{formatClassification(swing.classification)}</p>
                    <p className="text-xs text-slate-400">{new Date(swing.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-sky-400">{swing.gameReadiness}/100</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
