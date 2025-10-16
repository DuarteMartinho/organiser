'use server';

import { groupAdminService } from '@/services/group-admin-service';

export async function fetchGroupStatsAction(groupId: string) {
    return await groupAdminService.fetchGroupStats(groupId);
}
