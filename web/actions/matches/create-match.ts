'use server';

import { matchesService } from '@/services/matches-service';

export async function createMatchAction(data: {
    groupId: string;
    createdBy: string;
    dateTime: Date;
    location: string | null;
    maxPlayersPerTeam: number;
    plannedTeams: number;
}) {
    try {
        // Validate required fields
        if (!data.groupId || typeof data.groupId !== 'string') {
            throw new Error('Invalid group ID');
        }
        if (!data.createdBy || typeof data.createdBy !== 'string') {
            throw new Error('Invalid user ID');
        }
        if (!data.dateTime || !(data.dateTime instanceof Date)) {
            throw new Error('Invalid date/time');
        }

        console.log('[CREATE_MATCH] Creating match:', { groupId: data.groupId, createdBy: data.createdBy, dateTime: data.dateTime });
        const result = await matchesService.createMatch(data);
        console.log('[CREATE_MATCH] Success:', result.id);
        return result;
    } catch (error) {
        console.error('[CREATE_MATCH] Error:', error);
        throw error;
    }
}
