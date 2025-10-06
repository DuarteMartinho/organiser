import { db } from "../db/connection";
import { matchWaitingList } from "../db/schema";
import { eq } from "drizzle-orm";
import type { MatchWaitingList } from "../types/entities";

export const matchWaitingListService = {
    async getAll(): Promise<MatchWaitingList[]> {
        const result = await db.select().from(matchWaitingList);
        return result.map(entry => ({
            ...entry,
            matchId: entry.matchId ?? undefined,
            teamPlayerId: entry.teamPlayerId ?? undefined,
            joinedAt: entry.joinedAt ?? new Date(),
        }));
    },

    async getById(id: string): Promise<MatchWaitingList | undefined> {
        const result = await db.select().from(matchWaitingList).where(eq(matchWaitingList.id, id));
        if (result[0]) {
            return {
                ...result[0],
                matchId: result[0].matchId ?? undefined,
                teamPlayerId: result[0].teamPlayerId ?? undefined,
                joinedAt: result[0].joinedAt ?? new Date(),
            };
        }
        return undefined;
    },

    async create(entry: Omit<MatchWaitingList, "id" | "joinedAt">): Promise<MatchWaitingList> {
        const [newEntry] = await db.insert(matchWaitingList).values(entry).returning();
        return {
            ...newEntry,
            matchId: newEntry.matchId ?? undefined,
            teamPlayerId: newEntry.teamPlayerId ?? undefined,
            joinedAt: newEntry.joinedAt ?? new Date(),
        };
    },

    async update(id: string, updates: Partial<Omit<MatchWaitingList, "id" | "joinedAt">>): Promise<MatchWaitingList | undefined> {
        const [updatedEntry] = await db.update(matchWaitingList).set(updates).where(eq(matchWaitingList.id, id)).returning();
        if (updatedEntry) {
            return {
                ...updatedEntry,
                matchId: updatedEntry.matchId ?? undefined,
                teamPlayerId: updatedEntry.teamPlayerId ?? undefined,
                joinedAt: updatedEntry.joinedAt ?? new Date(),
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(matchWaitingList).where(eq(matchWaitingList.id, id));
    },
};