"use server";

import { matchesService } from '@/services/matches-service';

export async function fetchMatchesAction(groupIds: string[]) {
    return matchesService.fetchMatches(groupIds);
}