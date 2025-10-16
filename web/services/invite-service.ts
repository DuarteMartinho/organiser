import { db } from '@/db/connection';
import { groupInvites, groupBans, groupMembers, teamPlayers, groupAdmins, users } from '@/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

export const inviteService = {
    async fetchInvites(groupId: string) {
        const invitesData = await db
            .select()
            .from(groupInvites)
            .where(eq(groupInvites.groupId, groupId))
            .orderBy(sql`${groupInvites.createdAt} DESC`);

        return invitesData.map(invite => ({
            ...invite,
            created_at: invite.createdAt?.toISOString() || new Date().toISOString(),
            expires_at: invite.expiresAt?.toISOString() || null,
        }));
    },

    async createInvite(data: {
        groupId: string;
        createdBy: string;
        code: string;
        maxUses: number;
        expiresAt: Date | null;
    }) {
        const [invite] = await db
            .insert(groupInvites)
            .values({
                groupId: data.groupId,
                createdBy: data.createdBy,
                code: data.code,
                maxUses: data.maxUses,
                expiresAt: data.expiresAt,
                isActive: true,
                usedCount: 0,
            })
            .returning();

        return invite;
    },

    async deactivateInvite(inviteId: string) {
        await db
            .update(groupInvites)
            .set({ isActive: false })
            .where(eq(groupInvites.id, inviteId));
    },

    async joinByInviteCode(data: {
        inviteCode: string;
        userId: string;
        userName: string;
        userEmail: string;
    }) {
        // Find the invite
        const [invite] = await db
            .select()
            .from(groupInvites)
            .where(and(
                eq(groupInvites.code, data.inviteCode.toUpperCase()),
                eq(groupInvites.isActive, true)
            ))
            .limit(1);

        if (!invite || !invite.groupId) {
            throw new Error('Invalid or expired invite code');
        }

        // Check if invite is expired
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new Error('This invite code has expired');
        }

        // Check if invite has reached max uses
        const maxUses = invite.maxUses ?? -1;
        const usedCount = invite.usedCount ?? 0;
        if (maxUses !== -1 && usedCount >= maxUses) {
            throw new Error('This invite code has reached its maximum uses');
        }

        const groupId = invite.groupId;

        // Check if user is banned
        const banCheck = await db
            .select()
            .from(groupBans)
            .where(and(
                eq(groupBans.groupId, groupId),
                eq(groupBans.userId, data.userId)
            ))
            .limit(1);

        if (banCheck.length > 0) {
            throw new Error('You are banned from this group');
        }

        // Check if already a member
        const memberCheck = await db
            .select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, data.userId)
            ))
            .limit(1);

        if (memberCheck.length > 0) {
            throw new Error('You are already a member of this group');
        }

        // Ensure user exists
        await db.insert(users).values({
            id: data.userId,
            name: data.userName,
            email: data.userEmail,
        }).onConflictDoNothing();

        // Clean up any leftover data
        await db.delete(teamPlayers)
            .where(and(
                eq(teamPlayers.groupId, groupId),
                eq(teamPlayers.userId, data.userId)
            ));

        await db.delete(groupAdmins)
            .where(and(
                eq(groupAdmins.groupId, groupId),
                eq(groupAdmins.userId, data.userId)
            ));

        // Add as member
        await db.insert(groupMembers).values({
            groupId: groupId,
            userId: data.userId,
        });

        // Create team player profile
        await db.insert(teamPlayers).values({
            userId: data.userId,
            groupId: groupId,
            role: 'player',
            rating: 5,
            isKeyPlayer: false,
            preferredPosition: 'MID',
        });

        // Update invite usage count
        await db
            .update(groupInvites)
            .set({ usedCount: sql`${groupInvites.usedCount} + 1` })
            .where(eq(groupInvites.id, invite.id));

        return { success: true, groupId };
    }
};
