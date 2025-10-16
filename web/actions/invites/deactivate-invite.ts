'use server';

import { inviteService } from '@/services/invite-service';

export async function deactivateInviteAction(inviteId: string) {
    return await inviteService.deactivateInvite(inviteId);
}
