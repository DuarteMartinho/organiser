'use server';

import { addMatchPlayer } from '@/services/match-players-service';

interface AddMatchPlayerParams {
    matchId: string;
    teamPlayerId: string;
    teamId: string | null;
    guestName: string | null;
}

export async function addMatchPlayerAction(params: AddMatchPlayerParams): Promise<void> {
    await addMatchPlayer(params);
}