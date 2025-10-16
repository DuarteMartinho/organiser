'use server';

import { groupMembersService } from '@/services/group-members-service';

export async function fetchGroupMembersAction(groupId: string) {
    return await groupMembersService.fetchGroupMembers(groupId);
}
