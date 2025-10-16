'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function removePlayerFromMatchAction(matchPlayerId: string) {
    return await matchDetailsService.removePlayerFromMatch(matchPlayerId);
}
