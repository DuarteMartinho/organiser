import { db } from '@/db/connection';
import { groups, groupMembers, groupAdmins } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const groupPageService = {
    async fetchGroupPageData(groupId: string, userId: string) {
        // Get group data
        const groupData = await db
            .select()
            .from(groups)
            .where(eq(groups.id, groupId))
            .limit(1);

        if (!groupData || groupData.length === 0) {
            return null;
        }

        const group = groupData[0];

        // Check if user is a member
        const membershipData = await db
            .select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId)
            ))
            .limit(1);

        const isMember = membershipData.length > 0;

        // Check if user is admin
        const adminData = await db
            .select()
            .from(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                eq(groupAdmins.userId, userId)
            ))
            .limit(1);

        const isAdmin = adminData.length > 0;

        // Get the group owner (first admin chronologically)
        const ownerData = await db
            .select({ userId: groupAdmins.userId, createdAt: groupAdmins.createdAt })
            .from(groupAdmins)
            .where(eq(groupAdmins.groupId, groupId))
            .orderBy(asc(groupAdmins.createdAt))
            .limit(1);

        const groupOwnerId = ownerData[0]?.userId;

        return {
            group: {
                id: group.id,
                name: group.name,
                description: group.description,
                privacy: group.privacy,
                created_at: group.createdAt?.toISOString() || new Date().toISOString(),
            },
            isMember,
            isAdmin,
            groupOwnerId,
        };
    },
};
