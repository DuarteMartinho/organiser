'use server';

import { groupStatsService } from '@/services/group-stats-service';

export async function fetchUserGroupStatsAction(userId: string) {
    return await groupStatsService.fetchUserGroupStats(userId);
}
