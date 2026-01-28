import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SwingAnalysis {
  id: string;
  classification: string;
  gameReadiness: number;
  contactSpeedEstimate: string;
  timingGapFrames: number;
  aiExplanation: string;
  diagnoses: string[];
  createdAt: string;
}

function getReadinessLabel(score: number): string {
  if (score <= 30) return "Needs game-speed adjustment";
  if (score <= 60) return "Limited game readiness";
  if (score <= 80) return "Competitive readiness";
  return "Advanced readiness";
}

function formatClassification(classification: string): string {
  return classification.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function formatDiagnosis(diagnosis: string): string {
  return diagnosis.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function SwingViewPage() {
  const params = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<SwingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/swing/${params.id}`);
        if (!res.ok) {
          throw new Error("Analysis not found");
        }
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        setError("Could not load this swing analysis.");
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading analysis...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <Card className="border border-slate-800 bg-slate-950 p-6 max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-semibold text-rose-400">Analysis Not Found</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <a href="/">
            <Button className="bg-sky-400 text-slate-950 hover:bg-sky-300">
              Go to Analyzer
            </Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-md px-6 py-8">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-sky-400">
            Shared Swing Analysis
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {new Date(analysis.createdAt).toLocaleDateString()}
          </p>
        </header>

        <Card className="border border-slate-800 bg-slate-950 p-5 space-y-5">
          <div>
            <p className="text-[13px] text-slate-400 mb-1">Swing Sequence</p>
            <p className="text-base text-slate-100">{formatClassification(analysis.classification)}</p>
          </div>

          <div>
            <p className="text-[13px] text-slate-400 mb-1">Timing Gap</p>
            <p className="text-base text-slate-100">{analysis.timingGapFrames} frames</p>
          </div>

          {analysis.diagnoses && analysis.diagnoses.length > 0 && (
            <div>
              <p className="text-[13px] text-slate-400 mb-2">Key Findings</p>
              <div className="flex flex-wrap gap-2">
                {analysis.diagnoses.map((d, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-slate-800 px-3 py-1.5 text-[13px] text-slate-200"
                  >
                    {formatDiagnosis(d)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[13px] text-slate-400 mb-1">Game-Readiness Index</p>
            <p className="text-xl font-semibold text-slate-100">{analysis.gameReadiness}/100</p>
            <p className="text-xs text-slate-400 mt-1">{getReadinessLabel(analysis.gameReadiness)}</p>
          </div>

          <div>
            <p className="text-[13px] text-slate-400 mb-1">Estimated Contact Speed</p>
            <p className="text-base text-slate-100">{analysis.contactSpeedEstimate}</p>
          </div>

          {analysis.aiExplanation && (
            <div>
              <p className="text-[13px] text-slate-400 mb-2">Coach Breakdown</p>
              <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950 border-l-4 border-sky-400 pl-4 py-3 leading-relaxed">
                {analysis.aiExplanation}
              </pre>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center pt-2">
            Powered by Late-Decision Swing Analysis™
          </p>

          <a href="/" className="block">
            <Button className="w-full rounded-lg bg-sky-400 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300">
              Analyze Your Own Swing
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
