'use server';

import { groupsService } from '@/services/groups-service';

export async function fetchUserGroupsWithAdminStatusAction(userId: string) {
    return await groupsService.fetchUserGroupsWithAdminStatus(userId);
}
