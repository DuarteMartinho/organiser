import { db } from '@/db/connection';
import { matchPlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const matchPlayersService = {
    async deleteMatchPlayer(teamPlayerId: string, matchId: string) {
        await db.delete(matchPlayers)
            .where(and(
                eq(matchPlayers.teamPlayerId, teamPlayerId),
                eq(matchPlayers.matchId, matchId)
            ));
    },
    async isUserInMatch(teamPlayerId: string, matchId: string) {
        const result = await db.select({ id: matchPlayers.id })
            .from(matchPlayers)
            .where(and(
                eq(matchPlayers.teamPlayerId, teamPlayerId),
                eq(matchPlayers.matchId, matchId)
            ))
            .limit(1);

        return result.length > 0;
    }
};

export async function addMatchPlayer({ matchId, teamPlayerId, teamId, guestName }: { matchId: string; teamPlayerId: string; teamId: string | null; guestName: string | null; }): Promise<void> {
    await db.insert(matchPlayers).values({
        matchId,
        teamPlayerId,
        teamId,
        guestName,
    });
}