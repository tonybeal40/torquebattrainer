import { 
  swingAnalyses, 
  proSwingExamples,
  type SwingAnalysis, 
  type InsertSwingAnalysis,
  type ProSwingExample 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  saveSwingAnalysis(analysis: InsertSwingAnalysis): Promise<SwingAnalysis>;
  getSwingAnalysesByUser(userId: string): Promise<SwingAnalysis[]>;
  getSwingAnalysisById(id: string): Promise<SwingAnalysis | undefined>;
  getProSwingExamples(): Promise<ProSwingExample[]>;
}

export class DatabaseStorage implements IStorage {
  async saveSwingAnalysis(analysis: InsertSwingAnalysis): Promise<SwingAnalysis> {
    const [saved] = await db
      .insert(swingAnalyses)
      .values(analysis)
      .returning();
    return saved;
  }

  async getSwingAnalysesByUser(userId: string): Promise<SwingAnalysis[]> {
    return await db
      .select()
      .from(swingAnalyses)
      .where(eq(swingAnalyses.userId, userId))
      .orderBy(desc(swingAnalyses.createdAt));
  }

  async getSwingAnalysisById(id: string): Promise<SwingAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(swingAnalyses)
      .where(eq(swingAnalyses.id, id));
    return analysis;
  }

  async getProSwingExamples(): Promise<ProSwingExample[]> {
    return await db.select().from(proSwingExamples);
  }
}

export const storage = new DatabaseStorage();
