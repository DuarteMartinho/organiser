'use server';

import { userDetailsService } from '@/services/user-details-service';

export async function promoteToAdminAction(groupId: string, userId: string) {
    return await userDetailsService.promoteToAdmin(groupId, userId);
}
