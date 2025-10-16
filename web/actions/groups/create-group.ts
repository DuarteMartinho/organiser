'use server';

import { groupsService } from '@/services/groups-service';

export async function createGroupAction(data: {
    name: string;
    description: string | null;
    privacy: 'public' | 'private';
    userId: string;
    userName: string;
    userEmail: string;
}) {
    try {
        // Validate required fields
        if (!data.userId || typeof data.userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        if (!data.userName || !data.userEmail) {
            throw new Error('User profile data missing');
        }
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Group name is required');
        }

        console.log('[CREATE_GROUP] Creating group:', { name: data.name, userId: data.userId });
        const result = await groupsService.createGroup(data);
        console.log('[CREATE_GROUP] Success:', result.id);
        return result;
    } catch (error) {
        console.error('[CREATE_GROUP] Error:', error);
        throw error;
    }
}
