'use server';

import { inviteService } from '@/services/invite-service';

export async function createInviteAction(data: {
    groupId: string;
    createdBy: string;
    code: string;
    maxUses: number;
    expiresAt: Date | null;
}) {
    return await inviteService.createInvite(data);
}
