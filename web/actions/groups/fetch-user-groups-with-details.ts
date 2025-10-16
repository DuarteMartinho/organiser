'use server';

import { groupsService } from '@/services/groups-service';

export async function fetchUserGroupsWithDetailsAction(userId: string) {
    return await groupsService.fetchUserGroupsWithDetails(userId);
}
