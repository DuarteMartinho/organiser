'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function createTeamsAction(matchId: string, teamCount: number) {
    return await matchDetailsService.createTeams(matchId, teamCount);
}
