'use server';

import { groupPageService } from '@/services/group-page-service';

export async function fetchGroupPageDataAction(groupId: string, userId: string) {
    return await groupPageService.fetchGroupPageData(groupId, userId);
}
