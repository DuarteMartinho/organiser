'use server';

import { addToWaitingList } from '@/services/match-waiting-list-service';

interface AddToWaitingListParams {
    matchId: string;
    teamPlayerId: string;
}

export async function addToWaitingListAction(params: AddToWaitingListParams): Promise<void> {
    await addToWaitingList(params);
}