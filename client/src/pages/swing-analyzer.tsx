import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PoseResponse {
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

function getReadinessLabel(score: number): string {
  if (score <= 30) return "Needs game-speed adjustment";
  if (score <= 60) return "Limited game readiness";
  if (score <= 80) return "Competitive readiness";
  return "Advanced readiness";
}

export default function SwingAnalyzerPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pitchType, setPitchType] = useState("unknown");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PoseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("swing_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

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

  function formatClassification(classification: string): string {
    return classification.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatDiagnosis(diagnosis: string): string {
    return diagnosis.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
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
        <div className="mx-auto max-w-md px-6 py-8">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-sky-400" data-testid="text-results-title">
              Swing Analysis Results
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Coaching-focused feedback based on swing sequence
            </p>
          </header>

          <Card className="border border-slate-800 bg-slate-950 p-5 space-y-5">
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

            {result.ai_explanation && (
              <div data-testid="section-coach">
                <p className="text-[13px] text-slate-400 mb-2">Coach Breakdown</p>
                <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950 border-l-4 border-sky-400 pl-4 py-3 leading-relaxed">
                  {result.ai_explanation}
                </pre>
              </div>
            )}

            <div data-testid="section-game-readiness">
              <p className="text-[13px] text-slate-400 mb-1">Game-Readiness Index</p>
              <p className="text-xl font-semibold text-slate-100">{result.game_readiness}/100</p>
              <p className="text-xs text-slate-400 mt-1">{getReadinessLabel(result.game_readiness)}</p>
              <p className="text-xs text-slate-500 mt-2">
                Measures how this swing holds up under competitive pitch speed and sequencing.
              </p>
            </div>

            <div data-testid="section-contact-speed">
              <p className="text-[13px] text-slate-400 mb-1">Estimated Contact Speed</p>
              <p className="text-base text-slate-100">{result.contact_speed_estimate}</p>
              <p className="text-xs text-slate-500 mt-2">
                Based on swing efficiency and contact stability — not measured velocity.
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center pt-2">
              Powered by Late-Decision Swing Analysis™
            </p>

            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-slate-300">
                Why this analysis is different
              </summary>
              <p className="mt-2 pl-3 border-l border-slate-700">
                This feedback focuses on decision timing and balance under game speed,
                not just swing positions or angles.
              </p>
            </details>

            <p className="text-xs text-slate-500 text-center">
              Instructional feedback only. Designed to support training, not replace coaching.
            </p>

            <Button
              onClick={() => setResult(null)}
              className="w-full rounded-lg bg-sky-400 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300"
              data-testid="button-analyze-another"
            >
              Analyze Another Swing
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-md px-6 py-8">
        <header className="mb-6 text-center">
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
      </div>
    </div>
  );
}
