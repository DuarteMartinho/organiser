"use server";

import { groupsService } from '@/services/groups-service';

export async function getGroupById(id: string) {
    return await groupsService.getById(id);
}