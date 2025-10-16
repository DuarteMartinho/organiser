import { db } from '@/db/connection';
import { users, groupMembers, teamPlayers, groupAdmins, playerMatchStats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const userDetailsService = {
    async fetchUserDetails(userId: string, groupId: string) {
        // Get user basic info and membership
        const [memberData] = await db.select({
            groupId: groupMembers.groupId,
            userId: groupMembers.userId,
            joinedAt: groupMembers.joinedAt,
            userName: users.name,
            userEmail: users.email,
        })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId)
            ))
            .limit(1);

        if (!memberData) {
            throw new Error('User not found in group');
        }

        // Get team player info
        const [teamPlayerData] = await db.select()
            .from(teamPlayers)
            .where(and(
                eq(teamPlayers.groupId, groupId),
                eq(teamPlayers.userId, userId)
            ))
            .limit(1);

        // Check if user is admin
        const [adminData] = await db.select()
            .from(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                eq(groupAdmins.userId, userId)
            ))
            .limit(1);

        // Get match stats if team player exists
        let matchStats = { totalMatches: 0, goals: 0, assists: 0 };
        if (teamPlayerData) {
            const statsData = await db.select({
                goals: playerMatchStats.goals,
                assists: playerMatchStats.assists,
            })
                .from(playerMatchStats)
                .where(eq(playerMatchStats.teamPlayerId, teamPlayerData.id));

            matchStats = {
                totalMatches: statsData.length,
                goals: statsData.reduce((sum, stat) => sum + (stat.goals || 0), 0),
                assists: statsData.reduce((sum, stat) => sum + (stat.assists || 0), 0),
            };
        }

        return {
            id: memberData.userId,
            name: memberData.userName,
            email: memberData.userEmail,
            joinedAt: memberData.joinedAt,
            teamPlayer: teamPlayerData || null,
            isAdmin: !!adminData,
            matchStats,
        };
    },

    async promoteToAdmin(groupId: string, userId: string) {
        // Insert into group_admins
        await db.insert(groupAdmins).values({
            groupId,
            userId,
        });

        // Update team_players role
        await db.update(teamPlayers)
            .set({ role: 'admin' })
            .where(and(
                eq(teamPlayers.groupId, groupId),
                eq(teamPlayers.userId, userId)
            ));
    },

    async demoteAdmin(groupId: string, userId: string) {
        // Remove from group_admins
        await db.delete(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                eq(groupAdmins.userId, userId)
            ));

        // Update team_players role
        await db.update(teamPlayers)
            .set({ role: 'player' })
            .where(and(
                eq(teamPlayers.groupId, groupId),
                eq(teamPlayers.userId, userId)
            ));
    },

    async updateUserProfile(data: {
        userId: string;
        name: string;
        groupId?: string;
        rating?: number;
        preferredPosition?: string;
        isKeyPlayer?: boolean;
    }) {
        // Update user name
        await db.update(users)
            .set({ name: data.name })
            .where(eq(users.id, data.userId));

        // Update team player info if groupId is provided
        if (data.groupId) {
            const updateData: any = {};
            if (data.rating !== undefined) updateData.rating = data.rating;
            if (data.preferredPosition !== undefined) updateData.preferredPosition = data.preferredPosition;
            if (data.isKeyPlayer !== undefined) updateData.isKeyPlayer = data.isKeyPlayer;

            if (Object.keys(updateData).length > 0) {
                await db.update(teamPlayers)
                    .set(updateData)
                    .where(and(
                        eq(teamPlayers.groupId, data.groupId),
                        eq(teamPlayers.userId, data.userId)
                    ));
            }
        }
    },
};
