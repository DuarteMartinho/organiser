'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function fetchMatchDetailsAction(matchId: string) {
    return await matchDetailsService.fetchMatchDetails(matchId);
}
