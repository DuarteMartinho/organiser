import { db } from "../db/connection";
import { playerMatchStats } from "../db/schema";
import { eq } from "drizzle-orm";
import type { PlayerMatchStats } from "../types/entities";

export const playerMatchStatsService = {
    async getAll(): Promise<PlayerMatchStats[]> {
        const result = await db.select().from(playerMatchStats);
        return result.map(stats => ({
            ...stats,
            matchId: stats.matchId ?? undefined,
            teamPlayerId: stats.teamPlayerId ?? undefined,
            rating: stats.rating ?? undefined,
            goals: stats.goals ?? undefined,
            assists: stats.assists ?? undefined,
            createdAt: stats.createdAt ?? new Date(),
        }));
    },

    async getById(id: string): Promise<PlayerMatchStats | undefined> {
        const result = await db.select().from(playerMatchStats).where(eq(playerMatchStats.id, id));
        if (result[0]) {
            return {
                ...result[0],
                matchId: result[0].matchId ?? undefined,
                teamPlayerId: result[0].teamPlayerId ?? undefined,
                rating: result[0].rating ?? undefined,
                goals: result[0].goals ?? undefined,
                assists: result[0].assists ?? undefined,
                createdAt: result[0].createdAt ?? new Date(),
            };
        }
        return undefined;
    },

    async create(stats: Omit<PlayerMatchStats, "id" | "createdAt">): Promise<PlayerMatchStats> {
        const [newStats] = await db.insert(playerMatchStats).values(stats).returning();
        return {
            ...newStats,
            matchId: newStats.matchId ?? undefined,
            teamPlayerId: newStats.teamPlayerId ?? undefined,
            rating: newStats.rating ?? undefined,
            goals: newStats.goals ?? undefined,
            assists: newStats.assists ?? undefined,
            createdAt: newStats.createdAt ?? new Date(),
        };
    },

    async update(id: string, updates: Partial<Omit<PlayerMatchStats, "id" | "createdAt">>): Promise<PlayerMatchStats | undefined> {
        const [updatedStats] = await db.update(playerMatchStats).set(updates).where(eq(playerMatchStats.id, id)).returning();
        if (updatedStats) {
            return {
                ...updatedStats,
                matchId: updatedStats.matchId ?? undefined,
                teamPlayerId: updatedStats.teamPlayerId ?? undefined,
                rating: updatedStats.rating ?? undefined,
                goals: updatedStats.goals ?? undefined,
                assists: updatedStats.assists ?? undefined,
                createdAt: updatedStats.createdAt ?? new Date(),
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(playerMatchStats).where(eq(playerMatchStats.id, id));
    },
};