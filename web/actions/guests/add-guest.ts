'use server';

import { guestService } from '@/services/guest-service';

export async function addGuestAction(data: {
    groupId: string;
    guestName: string;
}) {
    return await guestService.addGuest(data);
}
