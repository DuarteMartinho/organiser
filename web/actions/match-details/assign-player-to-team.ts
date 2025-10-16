'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function assignPlayerToTeamAction(matchPlayerId: string, teamId: string) {
    return await matchDetailsService.assignPlayerToTeam(matchPlayerId, teamId);
}
