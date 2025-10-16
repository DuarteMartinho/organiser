'use server';

import { userDetailsService } from '@/services/user-details-service';

export async function demoteAdminAction(groupId: string, userId: string) {
    return await userDetailsService.demoteAdmin(groupId, userId);
}
