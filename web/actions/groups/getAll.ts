"use server";

import { groupsService } from '@/services/groups-service';

export async function getAllGroups() {
    return await groupsService.getAll();
}