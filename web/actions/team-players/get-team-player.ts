"use server";

import { teamPlayersService } from '@/services/team-players-service';

export async function getTeamPlayerAction(userId: string, groupId: string) {
    return teamPlayersService.getTeamPlayer(userId, groupId);
}