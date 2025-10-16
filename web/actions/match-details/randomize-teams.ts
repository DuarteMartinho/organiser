'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function randomizeTeamsAction(matchId: string) {
    return await matchDetailsService.randomizeTeams(matchId);
}
