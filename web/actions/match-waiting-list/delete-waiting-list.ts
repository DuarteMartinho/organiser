"use server";

import { matchWaitingListService } from '@/services/match-waiting-list-service';

export async function deleteFromWaitingListAction(matchId: string, teamPlayerId: string) {
    return matchWaitingListService.deleteFromWaitingList(matchId, teamPlayerId);
}