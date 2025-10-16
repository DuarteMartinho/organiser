import { db } from '@/db/connection';
import { matches, matchPlayers } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';

export const matchesService = {
    async fetchMatches(groupIds: string[]) {
        if (groupIds.length === 0) return { upcoming: [], past: [] };

        // First get matches
        const matchesData = await db.select({
            id: matches.id,
            dateTime: matches.dateTime,
            location: matches.location,
            maxPlayersPerTeam: matches.maxPlayersPerTeam,
            plannedTeams: matches.plannedTeams,
            teamsCreated: matches.teamsCreated,
            teamsFinalized: matches.teamsFinalized,
            createdAt: matches.createdAt,
            createdBy: matches.createdBy,
            groupId: matches.groupId,
        })
            .from(matches)
            .where(inArray(matches.groupId, groupIds))
            .orderBy(matches.dateTime)
            .limit(50);

        // Then get match players for all matches
        const matchIds = matchesData.map(m => m.id);
        const allMatchPlayers = matchIds.length > 0
            ? await db.select({
                id: matchPlayers.id,
                matchId: matchPlayers.matchId,
                teamPlayerId: matchPlayers.teamPlayerId,
                guestName: matchPlayers.guestName,
            })
                .from(matchPlayers)
                .where(inArray(matchPlayers.matchId, matchIds))
            : [];

        // Combine the data
        const matchesWithPlayers = matchesData.map(match => ({
            ...match,
            matchPlayers: allMatchPlayers.filter(mp => mp.matchId === match.id)
        }));

        const now = new Date();
        const upcoming = matchesWithPlayers.filter((match) => {
            const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime);
            return matchDate > now;
        });
        const past = matchesWithPlayers.filter((match) => {
            const matchDate = match.dateTime instanceof Date ? match.dateTime : new Date(match.dateTime);
            return matchDate <= now;
        });

        return { upcoming, past };
    },

    async fetchMatchesByGroupId(groupId: string) {
        // First get matches
        const matchesData = await db.select({
            id: matches.id,
            dateTime: matches.dateTime,
            location: matches.location,
            maxPlayersPerTeam: matches.maxPlayersPerTeam,
            plannedTeams: matches.plannedTeams,
            teamsCreated: matches.teamsCreated,
            teamsFinalized: matches.teamsFinalized,
            createdAt: matches.createdAt,
            createdBy: matches.createdBy,
            groupId: matches.groupId,
        })
            .from(matches)
            .where(eq(matches.groupId, groupId))
            .orderBy(matches.dateTime)
            .limit(50);

        // Then get match players for all matches
        const matchIds = matchesData.map(m => m.id);
        const allMatchPlayers = matchIds.length > 0
            ? await db.select({
                id: matchPlayers.id,
                matchId: matchPlayers.matchId,
                teamPlayerId: matchPlayers.teamPlayerId,
                guestName: matchPlayers.guestName,
            })
                .from(matchPlayers)
                .where(inArray(matchPlayers.matchId, matchIds))
            : [];

        // Combine the data
        return matchesData.map(match => ({
            ...match,
            matchPlayers: allMatchPlayers.filter(mp => mp.matchId === match.id)
        }));
    },

    async createMatch(data: {
        groupId: string;
        createdBy: string;
        dateTime: Date;
        location: string | null;
        maxPlayersPerTeam: number;
        plannedTeams: number;
    }) {
        const [match] = await db.insert(matches).values({
            groupId: data.groupId,
            createdBy: data.createdBy,
            dateTime: data.dateTime,
            location: data.location,
            maxPlayersPerTeam: data.maxPlayersPerTeam,
            plannedTeams: data.plannedTeams,
            teamsCreated: false,
            teamsFinalized: false,
        }).returning();

        return match;
    }
};