'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function fetchWaitingListAction(matchId: string) {
    return await matchDetailsService.fetchWaitingList(matchId);
}
