'use server';

import { userDetailsService } from '@/services/user-details-service';

export async function fetchUserDetailsAction(userId: string, groupId: string) {
    return await userDetailsService.fetchUserDetails(userId, groupId);
}
