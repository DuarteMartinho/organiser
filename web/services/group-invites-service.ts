import { db } from "../db/connection";
import { groupInvites } from "../db/schema";
import { eq } from "drizzle-orm";
import type { GroupInvite } from "../types/entities";

export const groupInvitesService = {
    async getAll(): Promise<GroupInvite[]> {
        const result = await db.select().from(groupInvites);
        return result.map(invite => ({
            ...invite,
            groupId: invite.groupId ?? undefined,
            createdBy: invite.createdBy ?? undefined,
            maxUses: invite.maxUses ?? undefined,
            usedCount: invite.usedCount ?? undefined,
            isActive: invite.isActive ?? undefined,
            createdAt: invite.createdAt ?? new Date(),
            expiresAt: invite.expiresAt ?? undefined,
        }));
    },

    async createInvite(invite: Omit<GroupInvite, "id" | "createdAt">): Promise<GroupInvite> {
        const [newInvite] = await db.insert(groupInvites).values(invite).returning();
        return {
            ...newInvite,
            groupId: newInvite.groupId ?? undefined,
            createdBy: newInvite.createdBy ?? undefined,
            maxUses: newInvite.maxUses ?? undefined,
            usedCount: newInvite.usedCount ?? undefined,
            isActive: newInvite.isActive ?? undefined,
            createdAt: newInvite.createdAt ?? new Date(),
            expiresAt: newInvite.expiresAt ?? undefined,
        };
    },

    async deleteInvite(id: string): Promise<void> {
        await db.delete(groupInvites).where(eq(groupInvites.id, id));
    },
};