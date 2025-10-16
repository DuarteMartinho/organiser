import { db } from '@/db/connection';
import { groupMembers, groupAdmins, matches, users } from '@/db/schema';
import { eq, sql, inArray, gt, and } from 'drizzle-orm';

export const groupStatsService = {
    async fetchUserGroupStats(userId: string) {
        // Count total groups
        const totalGroupsResult = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(groupMembers)
            .where(eq(groupMembers.userId, userId));
        const totalGroups = totalGroupsResult[0]?.count || 0;

        // Count admin roles
        const adminRolesResult = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(groupAdmins)
            .where(eq(groupAdmins.userId, userId));
        const adminRoles = adminRolesResult[0]?.count || 0;

        // Get user's group IDs
        const userGroupIds = await db
            .select({ groupId: groupMembers.groupId })
            .from(groupMembers)
            .where(eq(groupMembers.userId, userId));

        const groupIds = userGroupIds.map((item: any) => item.groupId);

        // Count upcoming matches
        let upcomingMatches = 0;
        if (groupIds.length > 0) {
            const now = new Date();
            const upcomingMatchesResult = await db
                .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
                .from(matches)
                .where(
                    and(
                        inArray(matches.groupId, groupIds),
                        gt(matches.dateTime, now)
                    )
                );
            upcomingMatches = upcomingMatchesResult[0]?.count || 0;
        }

        return {
            totalGroups,
            adminRoles,
            upcomingMatches,
        };
    },

    async fetchGroupHeaderStats(groupId: string) {
        // Get total members excluding guests (users with @temp.local emails)
        const allMembers = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, groupId));
        const allMembersCount = allMembers[0]?.count || 0;

        // Get total matches count
        const totalMatchesResult = await db
            .select({ count: sql<number>`count(*)::int`.mapWith(Number) })
            .from(matches)
            .where(eq(matches.groupId, groupId));
        const totalMatches = totalMatchesResult[0]?.count || 0;

        // Get upcoming matches count
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
            memberCount: allMembersCount,
            totalMatches,
            upcomingMatches,
            thisMonthMatches: 0, // TODO: implement if needed
        };
    },
};