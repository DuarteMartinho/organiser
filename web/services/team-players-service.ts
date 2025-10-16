import { db } from '@/db/connection';
import { teamPlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const teamPlayersService = {
    async getTeamPlayer(userId: string, groupId: string) {
        const result = await db.select({ id: teamPlayers.id })
            .from(teamPlayers)
            .where(and(
                eq(teamPlayers.userId, userId),
                eq(teamPlayers.groupId, groupId)
            ))
            .limit(1);

        return result[0] || null;
    }
};