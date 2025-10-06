"use server";

import { groupMembersService } from '@/services/group-members-service';

export async function listGroupsForUser(userId: string) {
    return await groupMembersService.listGroupsForUser(userId);
}