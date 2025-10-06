import { db } from "../db/connection";
import { teamPlayers } from "../db/schema";
import { eq } from "drizzle-orm";
import type { TeamPlayer } from "../types/entities";

export const teamPlayersService = {
    async getAll(): Promise<TeamPlayer[]> {
        const result = await db.select().from(teamPlayers);
        return result.map(player => ({
            ...player,
            userId: player.userId ?? undefined,
            groupId: player.groupId ?? undefined,
            rating: player.rating ?? undefined,
            isKeyPlayer: player.isKeyPlayer ?? undefined,
            preferredPosition: player.preferredPosition as "MID" | "GK" | "DEF" | "FWD" | undefined,
            role: player.role as "player" | "admin",
            createdAt: player.createdAt ?? new Date(),
        }));
    },

    async getById(id: string): Promise<TeamPlayer | undefined> {
        const result = await db.select().from(teamPlayers).where(eq(teamPlayers.id, id));
        if (result[0]) {
            return {
                ...result[0],
                userId: result[0].userId ?? undefined,
                groupId: result[0].groupId ?? undefined,
                rating: result[0].rating ?? undefined,
                isKeyPlayer: result[0].isKeyPlayer ?? undefined,
                preferredPosition: result[0].preferredPosition as "MID" | "GK" | "DEF" | "FWD" | undefined,
                role: result[0].role as "player" | "admin",
                createdAt: result[0].createdAt ?? new Date(),
            };
        }
        return undefined;
    },

    async create(player: Omit<TeamPlayer, "id" | "createdAt">): Promise<TeamPlayer> {
        const [newPlayer] = await db.insert(teamPlayers).values(player).returning();
        return {
            ...newPlayer,
            userId: newPlayer.userId ?? undefined,
            groupId: newPlayer.groupId ?? undefined,
            rating: newPlayer.rating ?? undefined,
            isKeyPlayer: newPlayer.isKeyPlayer ?? undefined,
            preferredPosition: newPlayer.preferredPosition as "MID" | "GK" | "DEF" | "FWD" | undefined,
            role: newPlayer.role as "player" | "admin",
            createdAt: newPlayer.createdAt ?? new Date(),
        };
    },

    async update(id: string, updates: Partial<Omit<TeamPlayer, "id" | "createdAt">>): Promise<TeamPlayer | undefined> {
        const [updatedPlayer] = await db.update(teamPlayers).set(updates).where(eq(teamPlayers.id, id)).returning();
        if (updatedPlayer) {
            return {
                ...updatedPlayer,
                userId: updatedPlayer.userId ?? undefined,
                groupId: updatedPlayer.groupId ?? undefined,
                rating: updatedPlayer.rating ?? undefined,
                isKeyPlayer: updatedPlayer.isKeyPlayer ?? undefined,
                preferredPosition: updatedPlayer.preferredPosition as "MID" | "GK" | "DEF" | "FWD" | undefined,
                role: updatedPlayer.role as "player" | "admin",
                createdAt: updatedPlayer.createdAt ?? new Date(),
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(teamPlayers).where(eq(teamPlayers.id, id));
    },
};