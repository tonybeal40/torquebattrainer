import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import OpenAI from "openai";

const upload = multer({ dest: "uploads/" });

// Use user's own API key if provided, otherwise fall back to Replit AI Integrations
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
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  app.post("/api/upload", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      // Note: Actual video processing with OpenCV + MediaPipe requires Python
      // This is a stub endpoint that returns the expected format
      // 
      // In production, you would:
      // 1. Run your Python Flask server with the hip/hand detection code
      // 2. Either proxy to it from here, or point frontend directly to Python backend
      // 3. Or use child_process to call a Python script from Node.js
      
      // Sample pose data (would come from Python/MediaPipe in production)
      const hip_start = 25;
      const hand_start = 40;
      const frames_processed = 18;

      // Classify the swing
      const { classification, timing_gap, diagnoses } = classifySwing(hip_start, hand_start);

      // Calculate game readiness score
      const game_readiness = calculateGameReadiness(classification, diagnoses, timing_gap);

      // Calculate contact efficiency
      const pitchIssues: string[] = [];
      const contact_efficiency = calculateContactEfficiency(game_readiness, classification, diagnoses, timing_gap, pitchIssues);
      const contact_speed_estimate = getContactEfficiencyLabel(contact_efficiency);

      // Generate AI coaching explanation
      const ai_explanation = await generateAIExplanation(classification, diagnoses, timing_gap);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.json({
        frames_processed,
        hip_start_frame: hip_start,
        hand_start_frame: hand_start,
        timing_gap_frames: timing_gap,
        classification,
        diagnoses,
        ai_explanation,
        game_readiness,
        contact_speed_estimate
      });
      
    } catch (error) {
      console.error("Error processing video:", error);
      return res.status(500).json({ error: "Failed to process video" });
    }
  });

  return httpServer;
}
