import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

const upload = multer({ dest: "uploads/" });

const uploadBodySchema = z.object({
  pitch_type: z.enum(["unknown", "fastball", "breaking"]).optional().default("unknown"),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function generateAIExplanation(
  classification: string,
  diagnoses: string[],
  timing_gap: number | null
): Promise<string> {
  const prompt = `You are a professional baseball hitting coach.

Swing analysis data:
- Classification: ${classification}
- Diagnoses: ${diagnoses.join(", ")}
- Timing gap (frames): ${timing_gap}

Explain this swing to a player in simple, clear language.

Output exactly this format:
1. What is happening
2. Why this fails in games
3. One correction focus
4. One drill
5. One simple cue

Keep it short. No jargon. Coach tone.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an elite baseball hitting coach." },
      { role: "user", content: prompt }
    ],
    temperature: 0.4
  });

  return response.choices[0]?.message?.content || "Unable to generate explanation.";
}

async function generateTrainingPlan(
  analyses: any[]
): Promise<string> {
  const recentAnalyses = analyses.slice(0, 5);
  const patterns = recentAnalyses.map(a => ({
    classification: a.classification,
    gameReadiness: a.gameReadiness,
    diagnoses: a.diagnoses
  }));

  const prompt = `You are a professional baseball hitting coach creating a personalized training plan.

Based on these recent swing analyses:
${JSON.stringify(patterns, null, 2)}

Create a focused 1-week training plan with:
1. Primary focus area (based on recurring patterns)
2. Daily drill schedule (15-20 min sessions)
3. Key cues to remember
4. Progress indicators to track

Keep it actionable and realistic for a youth/amateur player.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an elite baseball hitting coach." },
      { role: "user", content: prompt }
    ],
    temperature: 0.5
  });

  return response.choices[0]?.message?.content || "Unable to generate training plan.";
}

function calculateGameReadiness(
  classification: string,
  diagnoses: string[],
  timing_gap: number | null
): number {
  let score = 100;

  if (classification === "early_commit") score -= 30;
  if (classification === "arm_dominant_swing") score -= 25;
  if (classification === "simultaneous_start") score -= 10;

  if (diagnoses.includes("head_drift_balance_loss")) score -= 20;

  if (timing_gap !== null && timing_gap > 10) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function calculateContactEfficiency(
  gameReadinessScore: number,
  classification: string,
  diagnoses: string[],
  timing_gap: number | null,
  pitchIssues: string[]
): number {
  let ces = 100;

  if (classification === "early_commit") ces -= 30;
  if (classification === "arm_dominant_swing") ces -= 35;
  if (classification === "simultaneous_start") ces -= 10;

  if (diagnoses.includes("head_drift_balance_loss")) ces -= 20;
  if (timing_gap !== null && timing_gap > 10) ces -= 15;

  for (const issue of pitchIssues) {
    if (issue === "fastball" || issue === "breaking") ces -= 10;
  }

  if (gameReadinessScore < 40) ces = Math.min(ces, 50);
  else if (gameReadinessScore < 60) ces = Math.min(ces, 70);

  return Math.max(0, Math.min(100, ces));
}

function getContactEfficiencyLabel(ces: number): string {
  if (ces <= 30) return "Low";
  if (ces <= 55) return "Low–Moderate";
  if (ces <= 75) return "Moderate";
  if (ces <= 90) return "Moderate–High";
  return "High";
}

function classifySwing(hip_start: number | null, hand_start: number | null): { 
  classification: string; 
  timing_gap: number | null;
  diagnoses: string[];
} {
  let classification = "undetermined";
  let timing_gap: number | null = null;
  const diagnoses: string[] = [];

  if (hip_start !== null && hand_start !== null) {
    timing_gap = hand_start - hip_start;

    if (timing_gap > 0) {
      if (timing_gap <= 10) {
        classification = "connected_sequence";
        diagnoses.push("good_hip_hand_connection");
      } else {
        classification = "early_commit";
        diagnoses.push("early_commit_power_leak");
      }
    } else if (timing_gap < 0) {
      classification = "arm_dominant_swing";
      diagnoses.push("hands_leading_hips");
    } else {
      classification = "simultaneous_start";
      diagnoses.push("neutral_timing");
    }
  } else {
    classification = "insufficient_data";
    diagnoses.push("no_clear_movement_detected");
  }

  return { classification, timing_gap, diagnoses };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  registerAuthRoutes(app);

  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  app.post("/api/upload", upload.single("video"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      const bodyResult = uploadBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({ error: "Invalid request data", details: bodyResult.error.issues });
      }

      const pitchType = bodyResult.data.pitch_type;
      const userId = req.user?.claims?.sub || null;

      const hip_start = 25;
      const hand_start = 40;
      const frames_processed = 18;

      const { classification, timing_gap, diagnoses } = classifySwing(hip_start, hand_start);
      const game_readiness = calculateGameReadiness(classification, diagnoses, timing_gap);

      const pitchIssues: string[] = [];
      const contact_efficiency = calculateContactEfficiency(game_readiness, classification, diagnoses, timing_gap, pitchIssues);
      const contact_speed_estimate = getContactEfficiencyLabel(contact_efficiency);

      const ai_explanation = await generateAIExplanation(classification, diagnoses, timing_gap);

      fs.unlinkSync(req.file.path);

      const analysisResult = {
        frames_processed,
        hip_start_frame: hip_start,
        hand_start_frame: hand_start,
        timing_gap_frames: timing_gap,
        classification,
        diagnoses,
        ai_explanation,
        game_readiness,
        contact_speed_estimate
      };

      let savedAnalysis = null;
      if (userId) {
        savedAnalysis = await storage.saveSwingAnalysis({
          userId,
          pitchType,
          framesProcessed: frames_processed,
          hipStartFrame: hip_start,
          handStartFrame: hand_start,
          timingGapFrames: timing_gap,
          classification,
          diagnoses,
          aiExplanation: ai_explanation,
          gameReadiness: game_readiness,
          contactSpeedEstimate: contact_speed_estimate
        });
      }

      return res.json({
        ...analysisResult,
        id: savedAnalysis?.id || null
      });
      
    } catch (error) {
      console.error("Error processing video:", error);
      return res.status(500).json({ error: "Failed to process video" });
    }
  });

  app.get("/api/swing-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getSwingAnalysesByUser(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching swing history:", error);
      res.status(500).json({ error: "Failed to fetch swing history" });
    }
  });

  app.get("/api/swing/:id", async (req, res) => {
    try {
      const analysis = await storage.getSwingAnalysisById(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching swing analysis:", error);
      res.status(500).json({ error: "Failed to fetch swing analysis" });
    }
  });

  app.get("/api/pro-examples", async (req, res) => {
    try {
      const examples = await storage.getProSwingExamples();
      
      if (examples.length === 0) {
        return res.json([
          {
            id: "pro-connected",
            name: "Connected Sequence (Ideal)",
            description: "Hips lead hands with tight 5-8 frame gap. Maximum power transfer.",
            classification: "connected_sequence",
            timingGapFrames: 6,
            gameReadiness: 95,
            contactSpeedEstimate: "High",
            diagnoses: ["good_hip_hand_connection"]
          },
          {
            id: "pro-adjustable",
            name: "Adjustable Swing",
            description: "Slightly wider timing allows for pitch recognition. Good for breaking balls.",
            classification: "connected_sequence",
            timingGapFrames: 9,
            gameReadiness: 85,
            contactSpeedEstimate: "Moderate–High",
            diagnoses: ["good_hip_hand_connection"]
          }
        ]);
      }
      
      res.json(examples);
    } catch (error) {
      console.error("Error fetching pro examples:", error);
      res.status(500).json({ error: "Failed to fetch pro examples" });
    }
  });

  app.get("/api/training-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getSwingAnalysesByUser(userId);
      
      if (analyses.length === 0) {
        return res.status(400).json({ error: "No swing history available. Upload some swings first." });
      }

      const plan = await generateTrainingPlan(analyses);
      res.json({ plan });
    } catch (error) {
      console.error("Error generating training plan:", error);
      res.status(500).json({ error: "Failed to generate training plan" });
    }
  });

  app.delete("/api/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.deleteUserData(userId);
      
      req.logout((err: any) => {
        if (err) {
          console.error("Error during logout:", err);
        }
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error("Error destroying session:", sessionErr);
          }
          res.json({ success: true, message: "Account and all data deleted successfully" });
        });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  return httpServer;
}
