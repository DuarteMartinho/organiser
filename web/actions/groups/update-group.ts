'use server';

import { groupAdminService } from '@/services/group-admin-service';

export async function updateGroupAction(groupId: string, data: {
    name: string;
    description: string | null;
    privacy: string;
}) {
    return await groupAdminService.updateGroup(groupId, data);
}
