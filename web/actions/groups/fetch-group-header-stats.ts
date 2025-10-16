'use server';

import { groupStatsService } from '@/services/group-stats-service';

export async function fetchGroupHeaderStatsAction(groupId: string) {
    return groupStatsService.fetchGroupHeaderStats(groupId);
}
