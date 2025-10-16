import { db } from '@/db/connection';
import { groupMembers, groups, groupAdmins, users, teamPlayers } from '@/db/schema';
import { eq, and, notInArray, sql } from 'drizzle-orm';

export const groupsService = {
    async fetchUserGroups(userId: string) {
        const groupMembersData = await db.select({ groupId: groupMembers.groupId })
            .from(groupMembers)
            .where(eq(groupMembers.userId, userId));

        return groupMembersData.map((item) => item.groupId);
    },

    async fetchUserGroupsWithDetails(userId: string) {
        const result = await db
            .select({
                groupId: groups.id,
                groupName: groups.name,
                groupDescription: groups.description,
                groupPrivacy: groups.privacy,
                groupCreatedAt: groups.createdAt,
                joinedAt: groupMembers.joinedAt,
            })
            .from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .where(eq(groupMembers.userId, userId))
            .orderBy(groupMembers.joinedAt);

        return result.map((item) => ({
            groups: {
                id: item.groupId,
                name: item.groupName,
                description: item.groupDescription,
                privacy: item.groupPrivacy,
                created_at: item.groupCreatedAt,
            },
            joined_at: item.joinedAt,
        }));
    },

    async fetchUserGroupsWithAdminStatus(userId: string) {
        // Get all groups user is member of
        const memberGroups = await db
            .select({
                id: groups.id,
                name: groups.name,
                description: groups.description,
                privacy: groups.privacy,
                created_at: groups.createdAt,
            })
            .from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .where(eq(groupMembers.userId, userId));

        // Get admin group IDs
        const adminGroupIds = await db
            .select({ groupId: groupAdmins.groupId })
            .from(groupAdmins)
            .where(eq(groupAdmins.userId, userId));

        const adminIds = adminGroupIds.map(item => item.groupId);

        return memberGroups.map(group => ({
            ...group,
            isAdmin: adminIds.includes(group.id),
            isOwner: false, // Simplified for now
        }));
    },

    async fetchPublicGroups(userId: string) {
        // Get user's group IDs
        const userGroupIds = await db
            .select({ groupId: groupMembers.groupId })
            .from(groupMembers)
            .where(eq(groupMembers.userId, userId));

        const excludeIds = userGroupIds.map(item => item.groupId);

        // Fetch public groups excluding user's groups
        if (excludeIds.length > 0) {
            return await db
                .select()
                .from(groups)
                .where(and(
                    eq(groups.privacy, 'public'),
                    notInArray(groups.id, excludeIds)
                ))
                .orderBy(groups.createdAt);
        } else {
            return await db
                .select()
                .from(groups)
                .where(eq(groups.privacy, 'public'))
                .orderBy(groups.createdAt);
        }
    },

    async createGroup(data: {
        name: string;
        description: string | null;
        privacy: 'public' | 'private';
        userId: string;
        userName: string;
        userEmail: string;
    }) {
        // Ensure user exists
        await db.insert(users).values({
            id: data.userId,
            name: data.userName,
            email: data.userEmail,
        }).onConflictDoNothing();

        // Create group
        const [group] = await db.insert(groups).values({
            name: data.name,
            description: data.description,
            privacy: data.privacy,
        }).returning();

        // Add creator as admin
        await db.insert(groupAdmins).values({
            groupId: group.id,
            userId: data.userId,
        });

        // Add creator as member
        await db.insert(groupMembers).values({
            groupId: group.id,
            userId: data.userId,
        });

        // Create team_player profile
        await db.insert(teamPlayers).values({
            userId: data.userId,
            groupId: group.id,
            role: 'admin',
        });

        return group;
    },

    async joinGroup(groupId: string, userId: string, userName: string, userEmail: string) {
        // Ensure user exists
        await db.insert(users).values({
            id: userId,
            name: userName,
            email: userEmail,
        }).onConflictDoNothing();

        // Check if already a member
        const existing = await db
            .select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId)
            ))
            .limit(1);

        if (existing.length > 0) {
            throw new Error('Already a member of this group');
        }

        // Clean up any leftover data from previous membership
        await db.delete(teamPlayers)
            .where(and(
                eq(teamPlayers.groupId, groupId),
                eq(teamPlayers.userId, userId)
            ));

        await db.delete(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                eq(groupAdmins.userId, userId)
            ));

        // Add as member
        await db.insert(groupMembers).values({
            groupId,
            userId,
        });

        // Create team_player profile with defaults
        await db.insert(teamPlayers).values({
            userId,
            groupId,
            role: 'player',
            rating: 5,
            isKeyPlayer: false,
            preferredPosition: 'MID',
        });
    }
};