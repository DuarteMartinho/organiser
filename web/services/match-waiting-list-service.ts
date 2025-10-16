import { db } from '@/db/connection';
import { matchWaitingList } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const matchWaitingListService = {
    async deleteFromWaitingList(matchId: string, teamPlayerId: string) {
        await db.delete(matchWaitingList)
            .where(and(
                eq(matchWaitingList.matchId, matchId),
                eq(matchWaitingList.teamPlayerId, teamPlayerId)
            ));
    }
};

export async function addToWaitingList({ matchId, teamPlayerId }: { matchId: string; teamPlayerId: string; }): Promise<void> {
    await db.insert(matchWaitingList).values({
        matchId,
        teamPlayerId,
    });
}