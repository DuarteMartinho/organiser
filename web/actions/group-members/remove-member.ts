'use server';

import { groupMembersService } from '@/services/group-members-service';

export async function removeMemberAction(groupId: string, userId: string) {
    try {
        // Validate inputs
        if (!groupId || typeof groupId !== 'string') {
            throw new Error('Invalid group ID');
        }
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }

        console.log('[REMOVE_MEMBER_ACTION] Removing user:', userId, 'from group:', groupId);
        await groupMembersService.removeMember(groupId, userId);
        console.log('[REMOVE_MEMBER_ACTION] Success');
    } catch (error) {
        console.error('[REMOVE_MEMBER_ACTION] Error:', error);
        // Re-throw with a clear message
        throw new Error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
