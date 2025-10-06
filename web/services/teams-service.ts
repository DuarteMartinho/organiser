import { db } from "../db/connection";
import { teams } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Team } from "../types/entities";

export const teamsService = {
    async getAll(): Promise<Team[]> {
        const result = await db.select().from(teams);
        return result.map(team => ({
            ...team,
            matchId: team.matchId ?? undefined,
        }));
    },

    async getById(id: string): Promise<Team | undefined> {
        const result = await db.select().from(teams).where(eq(teams.id, id));
        if (result[0]) {
            return {
                ...result[0],
                matchId: result[0].matchId ?? undefined,
            };
        }
        return undefined;
    },

    async create(team: Omit<Team, "id">): Promise<Team> {
        const [newTeam] = await db.insert(teams).values(team).returning();
        return {
            ...newTeam,
            matchId: newTeam.matchId ?? undefined,
        };
    },

    async update(id: string, updates: Partial<Omit<Team, "id">>): Promise<Team | undefined> {
        const [updatedTeam] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
        if (updatedTeam) {
            return {
                ...updatedTeam,
                matchId: updatedTeam.matchId ?? undefined,
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(teams).where(eq(teams.id, id));
    },
};