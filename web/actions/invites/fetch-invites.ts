'use server';

import { inviteService } from '@/services/invite-service';

export async function fetchInvitesAction(groupId: string) {
    return await inviteService.fetchInvites(groupId);
}
