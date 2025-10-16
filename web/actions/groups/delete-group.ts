'use server';

import { groupAdminService } from '@/services/group-admin-service';
import { revalidatePath } from 'next/cache';

export async function deleteGroupAction(groupId: string) {
    await groupAdminService.deleteGroup(groupId);
    revalidatePath('/dashboard');
    revalidatePath('/groups');
}
