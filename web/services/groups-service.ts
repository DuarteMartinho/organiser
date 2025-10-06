import { db } from "../db/connection";
import { groups, groupMembers, users, matchPlayers } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { Group, GroupMember } from "../types/entities";

export const groupsService = {
    async getAll(): Promise<Group[]> {
        const result = await db.select().from(groups);
        return result.map(group => ({
            ...group,
            description: group.description ?? undefined,
            createdAt: group.createdAt ?? new Date(),
            privacy: group.privacy as "private" | "public",
        }));
    },

    async getById(id: string): Promise<Group | undefined> {
        const result = await db.select().from(groups).where(eq(groups.id, id));
        if (result[0]) {
            return {
                ...result[0],
                description: result[0].description ?? undefined,
                createdAt: result[0].createdAt ?? new Date(),
                privacy: result[0].privacy as "private" | "public",
            };
        }
        return undefined;
    },

    async create(group: Omit<Group, "id" | "createdAt">): Promise<Group> {
        const [newGroup] = await db.insert(groups).values(group).returning();
        return {
            ...newGroup,
            description: newGroup.description ?? undefined,
            createdAt: newGroup.createdAt ?? new Date(),
            privacy: newGroup.privacy as "private" | "public",
        };
    },

    async update(id: string, updates: Partial<Omit<Group, "id" | "createdAt">>): Promise<Group | undefined> {
        const [updatedGroup] = await db.update(groups).set(updates).where(eq(groups.id, id)).returning();
        if (updatedGroup) {
            return {
                ...updatedGroup,
                description: updatedGroup.description ?? undefined,
                createdAt: updatedGroup.createdAt ?? new Date(),
                privacy: updatedGroup.privacy as "private" | "public",
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(groups).where(eq(groups.id, id));
    },

    async addMember(groupId: string, userId: string): Promise<GroupMember> {
        const [newMember] = await db.insert(groupMembers).values({ groupId, userId }).returning();
        return {
            groupId: newMember.groupId,
            userId: newMember.userId,
            joinedAt: newMember.joinedAt ?? new Date(),
        };
    },

    async removeMember(groupId: string, userId: string): Promise<void> {
        await db.delete(groupMembers).where(
            (eq(groupMembers.groupId, groupId) as any).and(eq(groupMembers.userId, userId))
        );
    },

    async listMembers(groupId: string): Promise<GroupMember[]> {
        const result = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
        return result.map(member => ({
            groupId: member.groupId,
            userId: member.userId,
            joinedAt: member.joinedAt ?? new Date(),
        }));
    },

    async listGroupsForUser(userId: string): Promise<Group[]> {
        const result = await db
            .select({
                id: groups.id,
                name: groups.name,
                description: groups.description,
                privacy: groups.privacy,
                createdAt: groups.createdAt,
            })
            .from(groups)
            .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
            .where(eq(groupMembers.userId, userId));

        return result.map(group => ({
            ...group,
            description: group.description ?? undefined,
            createdAt: group.createdAt ?? new Date(),
            privacy: group.privacy as "private" | "public",
        }));
    },

    async getMatchPlayer(matchId: string, teamPlayerId: string): Promise<any | undefined> {
        const result = await db
            .select()
            .from(matchPlayers)
            .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.teamPlayerId, teamPlayerId)));
        return result[0];
    },

    async addMatchPlayer(matchId: string, teamPlayerId: string): Promise<void> {
        await db.insert(matchPlayers).values({ matchId, teamPlayerId });
    },

    async removeMatchPlayer(matchId: string, teamPlayerId: string): Promise<void> {
        await db.delete(matchPlayers).where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.teamPlayerId, teamPlayerId)));
    },
};