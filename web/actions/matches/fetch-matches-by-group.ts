'use server';

import { matchesService } from '@/services/matches-service';

export async function fetchMatchesByGroupAction(groupId: string) {
    return await matchesService.fetchMatchesByGroupId(groupId);
}
