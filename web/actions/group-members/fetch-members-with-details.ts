'use server';

import { groupMembersService } from '@/services/group-members-service';

export async function fetchGroupMembersWithDetailsAction(groupId: string) {
    return groupMembersService.fetchGroupMembersWithDetails(groupId);
}
