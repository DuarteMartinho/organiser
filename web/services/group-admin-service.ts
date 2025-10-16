import { db } from '@/db/connection';
import { matches, groupMembers, groups } from '@/db/schema';
import { eq, sql, gt, and } from 'drizzle-orm';

export const groupAdminService = {
    async fetchGroupStats(groupId: string) {
        // Get total matches
        const totalMatchesResult = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(matches)
            .where(eq(matches.groupId, groupId));
        const totalMatches = totalMatchesResult[0]?.count || 0;

        // Get total members
        const totalMembersResult = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(groupMembers)
            .where(eq(groupMembers.groupId, groupId));
        const totalMembers = totalMembersResult[0]?.count || 0;

        // Get upcoming matches
        const now = new Date();
        const upcomingMatchesResult = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(matches)
            .where(
                and(
                    eq(matches.groupId, groupId),
                    gt(matches.dateTime, now)
                )
            );
        const upcomingMatches = upcomingMatchesResult[0]?.count || 0;

        return {
            totalMatches,
            totalMembers,
            upcomingMatches,
        };
    },

    async updateGroup(groupId: string, data: {
        name: string;
        description: string | null;
        privacy: string;
    }) {
        const [updated] = await db
            .update(groups)
            .set({
                name: data.name,
                description: data.description,
                privacy: data.privacy,
            })
            .where(eq(groups.id, groupId))
            .returning();

        return updated;
    },

    async deleteGroup(groupId: string) {
        // Delete the group - cascading deletes should handle related data
        await db
            .delete(groups)
            .where(eq(groups.id, groupId));
    }
};
