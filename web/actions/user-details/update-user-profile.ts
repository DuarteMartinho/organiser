'use server';

import { userDetailsService } from '@/services/user-details-service';

export async function updateUserProfileAction(data: {
    userId: string;
    name: string;
    groupId?: string;
    rating?: number;
    preferredPosition?: string;
    isKeyPlayer?: boolean;
}) {
    return await userDetailsService.updateUserProfile(data);
}
