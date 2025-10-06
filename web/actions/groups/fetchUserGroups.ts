"use server"

import { groupsService } from '@/services/groups-service';
import type { Group } from '@/types/entities';

export async function fetchUserGroups(currentUserId: string): Promise<Array<{ groups: Group; groupId: string; userId: string; joinedAt: Date }>> {
    const groups = await groupsService.listGroupsForUser(currentUserId);
    return groups.map((group: Group) => ({
        groups: group,
        groupId: group.id,
        userId: currentUserId,
        joinedAt: new Date(), // Placeholder for joinedAt, as `listGroupsForUser` does not return this field
    }));
}