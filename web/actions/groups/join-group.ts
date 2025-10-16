'use server';

import { groupsService } from '@/services/groups-service';

export async function joinGroupAction(data: {
    groupId: string;
    userId: string;
    userName: string;
    userEmail: string;
}) {
    try {
        // Validate required fields
        if (!data.userId || typeof data.userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        if (!data.groupId || typeof data.groupId !== 'string') {
            throw new Error('Invalid group ID');
        }
        if (!data.userName || !data.userEmail) {
            throw new Error('User profile data missing');
        }

        console.log('[JOIN_GROUP] Joining group:', { groupId: data.groupId, userId: data.userId });
        await groupsService.joinGroup(data.groupId, data.userId, data.userName, data.userEmail);
        console.log('[JOIN_GROUP] Success');
    } catch (error) {
        console.error('[JOIN_GROUP] Error:', error);
        throw error;
    }
}
