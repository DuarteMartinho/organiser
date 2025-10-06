import { db } from "../db/connection";
import { matchPlayers } from "../db/schema";
import { eq } from "drizzle-orm";
import type { MatchPlayer } from "../types/entities";

export const matchPlayersService = {
    async getAll(): Promise<MatchPlayer[]> {
        const result = await db.select().from(matchPlayers);
        return result.map(player => ({
            ...player,
            teamId: player.teamId ?? undefined,
            teamPlayerId: player.teamPlayerId ?? undefined,
            guestName: player.guestName ?? undefined,
            joinedAt: player.joinedAt ?? new Date(),
            matchId: player.matchId ?? undefined,
        }));
    },

    async getById(id: string): Promise<MatchPlayer | undefined> {
        const result = await db.select().from(matchPlayers).where(eq(matchPlayers.id, id));
        if (result[0]) {
            return {
                ...result[0],
                teamId: result[0].teamId ?? undefined,
                teamPlayerId: result[0].teamPlayerId ?? undefined,
                guestName: result[0].guestName ?? undefined,
                joinedAt: result[0].joinedAt ?? new Date(),
                matchId: result[0].matchId ?? undefined,
            };
        }
        return undefined;
    },

    async create(player: Omit<MatchPlayer, "id" | "joinedAt">): Promise<MatchPlayer> {
        const [newPlayer] = await db.insert(matchPlayers).values(player).returning();
        return {
            ...newPlayer,
            teamId: newPlayer.teamId ?? undefined,
            teamPlayerId: newPlayer.teamPlayerId ?? undefined,
            guestName: newPlayer.guestName ?? undefined,
            joinedAt: newPlayer.joinedAt ?? new Date(),
            matchId: newPlayer.matchId ?? undefined,
        };
    },

    async update(id: string, updates: Partial<Omit<MatchPlayer, "id" | "joinedAt">>): Promise<MatchPlayer | undefined> {
        const [updatedPlayer] = await db.update(matchPlayers).set(updates).where(eq(matchPlayers.id, id)).returning();
        if (updatedPlayer) {
            return {
                ...updatedPlayer,
                teamId: updatedPlayer.teamId ?? undefined,
                teamPlayerId: updatedPlayer.teamPlayerId ?? undefined,
                guestName: updatedPlayer.guestName ?? undefined,
                joinedAt: updatedPlayer.joinedAt ?? new Date(),
                matchId: updatedPlayer.matchId ?? undefined,
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(matchPlayers).where(eq(matchPlayers.id, id));
    },
};