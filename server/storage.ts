import { 
  swingAnalyses, 
  proSwingExamples,
  users,
  sessions,
  type SwingAnalysis, 
  type InsertSwingAnalysis,
  type ProSwingExample 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like } from "drizzle-orm";

export interface IStorage {
  saveSwingAnalysis(analysis: InsertSwingAnalysis): Promise<SwingAnalysis>;
  getSwingAnalysesByUser(userId: string): Promise<SwingAnalysis[]>;
  getSwingAnalysisById(id: string): Promise<SwingAnalysis | undefined>;
  getProSwingExamples(): Promise<ProSwingExample[]>;
  deleteUserData(userId: string): Promise<void>;
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

  async deleteUserData(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(swingAnalyses).where(eq(swingAnalyses.userId, userId));
      
      await tx.delete(sessions).where(
        like(sessions.sess, `%"sub":"${userId}"%`)
      );
      
      await tx.delete(users).where(eq(users.id, userId));
    });
  }
}

export const storage = new DatabaseStorage();
