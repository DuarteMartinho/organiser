'use server';

import { groupsService } from '@/services/groups-service';

export async function fetchPublicGroupsAction(userId: string) {
    return await groupsService.fetchPublicGroups(userId);
}
