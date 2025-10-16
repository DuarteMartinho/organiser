"use server";

import { groupsService } from '@/services/groups-service';

export async function fetchUserGroupsAction(userId: string) {
    return groupsService.fetchUserGroups(userId);
}