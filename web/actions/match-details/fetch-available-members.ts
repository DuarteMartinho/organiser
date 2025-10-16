'use server';

import { matchDetailsService } from '@/services/match-details-service';

export async function fetchAvailableMembersAction(groupId: string, matchId: string) {
    return await matchDetailsService.fetchAvailableMembers(groupId, matchId);
}
