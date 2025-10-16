"use server";

import { matchPlayersService } from '@/services/match-players-service';

export async function checkUserInMatchAction(teamPlayerId: string, matchId: string) {
    return matchPlayersService.isUserInMatch(teamPlayerId, matchId);
}