import { db } from "../db/connection";
import { matches } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import type { Match } from "../types/entities";

export const matchesService = {
    async getAll(): Promise<Match[]> {
        const result = await db.select().from(matches);
        return result.map(match => ({
            ...match,
            groupId: match.groupId ?? undefined,
            createdBy: match.createdBy ?? undefined,
            location: match.location ?? undefined,
            maxPlayersPerTeam: match.maxPlayersPerTeam ?? undefined,
            teamsCreated: match.teamsCreated ?? undefined,
            teamsFinalized: match.teamsFinalized ?? undefined,
            plannedTeams: match.plannedTeams ?? undefined,
            createdAt: match.createdAt ?? new Date(),
            dateTime: match.dateTime ?? new Date(),
        }));
    },

    async getById(id: string): Promise<Match | undefined> {
        const result = await db.select().from(matches).where(eq(matches.id, id));
        if (result[0]) {
            return {
                ...result[0],
                groupId: result[0].groupId ?? undefined,
                createdBy: result[0].createdBy ?? undefined,
                location: result[0].location ?? undefined,
                maxPlayersPerTeam: result[0].maxPlayersPerTeam ?? undefined,
                teamsCreated: result[0].teamsCreated ?? undefined,
                teamsFinalized: result[0].teamsFinalized ?? undefined,
                plannedTeams: result[0].plannedTeams ?? undefined,
                createdAt: result[0].createdAt ?? new Date(),
                dateTime: result[0].dateTime ?? new Date(),
            };
        }
        return undefined;
    },

    async create(match: Omit<Match, "id" | "createdAt">): Promise<Match> {
        const [newMatch] = await db.insert(matches).values(match).returning();
        return {
            ...newMatch,
            groupId: newMatch.groupId ?? undefined,
            createdBy: newMatch.createdBy ?? undefined,
            location: newMatch.location ?? undefined,
            maxPlayersPerTeam: newMatch.maxPlayersPerTeam ?? undefined,
            teamsCreated: newMatch.teamsCreated ?? undefined,
            teamsFinalized: newMatch.teamsFinalized ?? undefined,
            plannedTeams: newMatch.plannedTeams ?? undefined,
            createdAt: newMatch.createdAt ?? new Date(),
            dateTime: newMatch.dateTime ?? new Date(),
        };
    },

    async update(id: string, updates: Partial<Omit<Match, "id" | "createdAt">>): Promise<Match | undefined> {
        const [updatedMatch] = await db.update(matches).set(updates).where(eq(matches.id, id)).returning();
        if (updatedMatch) {
            return {
                ...updatedMatch,
                groupId: updatedMatch.groupId ?? undefined,
                createdBy: updatedMatch.createdBy ?? undefined,
                location: updatedMatch.location ?? undefined,
                maxPlayersPerTeam: updatedMatch.maxPlayersPerTeam ?? undefined,
                teamsCreated: updatedMatch.teamsCreated ?? undefined,
                teamsFinalized: updatedMatch.teamsFinalized ?? undefined,
                plannedTeams: updatedMatch.plannedTeams ?? undefined,
                createdAt: updatedMatch.createdAt ?? new Date(),
                dateTime: updatedMatch.dateTime ?? new Date(),
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(matches).where(eq(matches.id, id));
    },

    async getMatchesByGroupIds(groupIds: string[]): Promise<{ upcoming: Match[]; past: Match[] }> {
        const result = await db
            .select()
            .from(matches)
            .where(inArray(matches.groupId, groupIds));

        const now = new Date();
        const upcoming = result.map(match => ({
            ...match,
            groupId: match.groupId ?? undefined,
            createdBy: match.createdBy ?? undefined,
            location: match.location ?? undefined,
            maxPlayersPerTeam: match.maxPlayersPerTeam ?? undefined,
            teamsCreated: match.teamsCreated ?? undefined,
            teamsFinalized: match.teamsFinalized ?? undefined,
            plannedTeams: match.plannedTeams ?? undefined,
            createdAt: match.createdAt ?? new Date(),
            dateTime: match.dateTime ?? new Date(),
        })).filter(match => new Date(match.dateTime) > now);

        const past = result.map(match => ({
            ...match,
            groupId: match.groupId ?? undefined,
            createdBy: match.createdBy ?? undefined,
            location: match.location ?? undefined,
            maxPlayersPerTeam: match.maxPlayersPerTeam ?? undefined,
            teamsCreated: match.teamsCreated ?? undefined,
            teamsFinalized: match.teamsFinalized ?? undefined,
            plannedTeams: match.plannedTeams ?? undefined,
            createdAt: match.createdAt ?? new Date(),
            dateTime: match.dateTime ?? new Date(),
        })).filter(match => new Date(match.dateTime) <= now);

        return { upcoming, past };
    },
};