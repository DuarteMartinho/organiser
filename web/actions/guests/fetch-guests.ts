'use server';

import { guestService } from '@/services/guest-service';

export async function fetchGuestsAction(groupId: string) {
    return await guestService.fetchGuests(groupId);
}
