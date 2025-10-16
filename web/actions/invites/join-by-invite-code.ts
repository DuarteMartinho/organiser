'use server';

import { inviteService } from '@/services/invite-service';

export async function joinByInviteCodeAction(data: {
    inviteCode: string;
    userId: string;
    userName: string;
    userEmail: string;
}) {
    try {
        // Validate inputs
        if (!data.inviteCode || typeof data.inviteCode !== 'string') {
            throw new Error('Invalid invite code');
        }
        if (!data.userId || typeof data.userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        if (!data.userName || !data.userEmail) {
            throw new Error('User profile data missing');
        }

        console.log('[JOIN_BY_INVITE] Attempting to join with code:', data.inviteCode);
        const result = await inviteService.joinByInviteCode(data);
        console.log('[JOIN_BY_INVITE] Success, joined group:', result.groupId);
        return result;
    } catch (error) {
        console.error('[JOIN_BY_INVITE] Error:', error);
        // Preserve the original error message for the UI
        const errorMessage = error instanceof Error ? error.message : 'Failed to join group with invite code';
        throw new Error(errorMessage);
    }
}
