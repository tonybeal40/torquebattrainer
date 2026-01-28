import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

import { users } from "./models/auth";

export const swingAnalyses = pgTable("swing_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  videoUrl: text("video_url"),
  pitchType: varchar("pitch_type").default("unknown"),
  framesProcessed: integer("frames_processed"),
  hipStartFrame: integer("hip_start_frame"),
  handStartFrame: integer("hand_start_frame"),
  timingGapFrames: integer("timing_gap_frames"),
  classification: varchar("classification"),
  diagnoses: jsonb("diagnoses").$type<string[]>().default([]),
  aiExplanation: text("ai_explanation"),
  gameReadiness: integer("game_readiness"),
  contactSpeedEstimate: varchar("contact_speed_estimate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const swingAnalysesRelations = relations(swingAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [swingAnalyses.userId],
    references: [users.id],
  }),
}));

export const insertSwingAnalysisSchema = createInsertSchema(swingAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertSwingAnalysis = z.infer<typeof insertSwingAnalysisSchema>;
export type SwingAnalysis = typeof swingAnalyses.$inferSelect;

export const proSwingExamples = pgTable("pro_swing_examples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  classification: varchar("classification"),
  timingGapFrames: integer("timing_gap_frames"),
  gameReadiness: integer("game_readiness"),
  contactSpeedEstimate: varchar("contact_speed_estimate"),
  diagnoses: jsonb("diagnoses").$type<string[]>().default([]),
});

export const insertProSwingExampleSchema = createInsertSchema(proSwingExamples).omit({
  id: true,
});

export type InsertProSwingExample = z.infer<typeof insertProSwingExampleSchema>;
export type ProSwingExample = typeof proSwingExamples.$inferSelect;
