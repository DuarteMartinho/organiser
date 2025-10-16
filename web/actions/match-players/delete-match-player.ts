"use server";

import { matchPlayersService } from '@/services/match-players-service';

export async function deleteMatchPlayerAction(teamPlayerId: string, matchId: string) {
    return matchPlayersService.deleteMatchPlayer(teamPlayerId, matchId);
}