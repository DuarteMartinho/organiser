'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function deleteMatchAction(matchId: string) {
    return await matchDetailsService.deleteMatch(matchId);
}
