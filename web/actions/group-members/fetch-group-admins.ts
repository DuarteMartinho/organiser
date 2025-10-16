'use server';

import { db } from '@/db/connection';
import { groupAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function fetchGroupAdminsAction(groupId: string) {
    const adminData = await db
        .select({ userId: groupAdmins.userId })
        .from(groupAdmins)
        .where(eq(groupAdmins.groupId, groupId));

    return adminData.map((admin: any) => admin.userId).filter((id: any): id is string => id !== null);
}
