"use server"

import { groupsService } from '@/services/groups-service';
import type { DashboardMatch } from '@/components/dashboard';

export async function joinLeaveMatch(match: DashboardMatch, currentUserId: string): Promise<void> {
    const existingPlayer = await groupsService.getMatchPlayer(match.id, currentUserId);

    if (existingPlayer) {
        // Leave match
        await groupsService.removeMatchPlayer(match.id, currentUserId);
    } else {
        // Join match
        await groupsService.addMatchPlayer(match.id, currentUserId);
    }
}