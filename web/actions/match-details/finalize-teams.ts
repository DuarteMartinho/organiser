'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function finalizeTeamsAction(matchId: string) {
    return await matchDetailsService.finalizeTeams(matchId);
}
