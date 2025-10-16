import { db } from '@/db/connection';
import { teamPlayers, groupAdmins, matchWaitingList, matchPlayers, groupMembers, users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const groupMembersService = {
    async removeMember(groupId: string, userId: string) {
        try {
            // First, get the teamPlayer ID for this user in this group
            const teamPlayerData = await db
                .select({ id: teamPlayers.id })
                .from(teamPlayers)
                .where(and(
                    eq(teamPlayers.groupId, groupId),
                    eq(teamPlayers.userId, userId)
                ))
                .limit(1);

            // Clean removal process - delete in proper order to handle foreign key constraints
            if (teamPlayerData.length > 0) {
                const teamPlayerId = teamPlayerData[0].id;

                // Delete from match waiting list
                await db.delete(matchWaitingList)
                    .where(eq(matchWaitingList.teamPlayerId, teamPlayerId));

                // Delete from match players
                await db.delete(matchPlayers)
                    .where(eq(matchPlayers.teamPlayerId, teamPlayerId));
            }

            // Delete team player profile
            await db.delete(teamPlayers)
                .where(and(
                    eq(teamPlayers.groupId, groupId),
                    eq(teamPlayers.userId, userId)
                ));

            // Delete admin role if exists
            await db.delete(groupAdmins)
                .where(and(
                    eq(groupAdmins.groupId, groupId),
                    eq(groupAdmins.userId, userId)
                ));

            // Finally, delete from group members
            await db.delete(groupMembers)
                .where(and(
                    eq(groupMembers.groupId, groupId),
                    eq(groupMembers.userId, userId)
                ));

            console.log('[REMOVE_MEMBER] Successfully removed user:', userId, 'from group:', groupId);
        } catch (error) {
            console.error('[REMOVE_MEMBER] Error removing member:', error);
            throw new Error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    async fetchGroupMembers(groupId: string) {
        // Get all member IDs
        const memberIds = await db
            .select({ userId: groupMembers.userId })
            .from(groupMembers)
            .where(eq(groupMembers.groupId, groupId));

        if (memberIds.length === 0) {
            return [];
        }

        const userIds = memberIds.map((m: any) => m.userId);

        // Get user details
        const usersData = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users)
            .where(inArray(users.id, userIds));

        // Get admin status for all members
        const adminData = await db
            .select({ userId: groupAdmins.userId })
            .from(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                inArray(groupAdmins.userId, userIds)
            ));

        const adminIds = new Set(adminData.map((a: any) => a.userId));

        // Combine the data
        return usersData.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: adminIds.has(user.id),
        }));
    },

    async fetchGroupMembersWithDetails(groupId: string) {
        // Get group members with join dates
        const members = await db
            .select({
                userId: groupMembers.userId,
                joinedAt: groupMembers.joinedAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, groupId));

        if (members.length === 0) {
            return [];
        }

        const userIds = members.map((m: any) => m.userId).filter((id: any): id is string => id !== null);

        // Get team players info
        const teamPlayersData = await db
            .select({
                userId: teamPlayers.userId,
                rating: teamPlayers.rating,
                preferredPosition: teamPlayers.preferredPosition,
                isKeyPlayer: teamPlayers.isKeyPlayer,
            })
            .from(teamPlayers)
            .where(and(
                eq(teamPlayers.groupId, groupId),
                inArray(teamPlayers.userId, userIds)
            ));

        // Create a map for quick lookup
        const teamPlayersMap = new Map(
            teamPlayersData.map((tp: any) => [tp.userId, tp])
        );

        // Get admin status
        const adminData = await db
            .select({ userId: groupAdmins.userId })
            .from(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                inArray(groupAdmins.userId, userIds)
            ));

        const adminIds = new Set(adminData.map((a: any) => a.userId));

        // Combine all data
        return members
            .filter((member: any) => member.userId && teamPlayersMap.has(member.userId))
            .map((member: any) => {
                const teamPlayer: any = teamPlayersMap.get(member.userId!);
                return {
                    id: member.userId, // Using userId as id since groupMembers table doesn't have an id field
                    joinedAt: member.joinedAt,
                    users: {
                        id: member.userId,
                        name: member.userName,
                        email: member.userEmail,
                    },
                    teamPlayers: {
                        rating: teamPlayer?.rating ?? null,
                        preferredPosition: teamPlayer?.preferredPosition ?? null,
                        isKeyPlayer: teamPlayer?.isKeyPlayer ?? false,
                    },
                    isAdmin: adminIds.has(member.userId!),
                };
            });
    },
};