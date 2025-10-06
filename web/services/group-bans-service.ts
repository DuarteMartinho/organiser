import { db } from "../db/connection";
import { groupBans } from "../db/schema";
import { eq } from "drizzle-orm";
import type { GroupBan } from "../types/entities";

export const groupBansService = {
    async getAll(): Promise<GroupBan[]> {
        const result = await db.select().from(groupBans);
        return result.map(ban => ({
            ...ban,
            groupId: ban.groupId ?? undefined,
            userId: ban.userId ?? undefined,
            bannedBy: ban.bannedBy ?? undefined,
            reason: ban.reason ?? undefined,
            createdAt: ban.createdAt ?? new Date(),
        }));
    },

    async addBan(ban: Omit<GroupBan, "id" | "createdAt">): Promise<GroupBan> {
        const [newBan] = await db.insert(groupBans).values(ban).returning();
        return {
            ...newBan,
            groupId: newBan.groupId ?? undefined,
            userId: newBan.userId ?? undefined,
            bannedBy: newBan.bannedBy ?? undefined,
            reason: newBan.reason ?? undefined,
            createdAt: newBan.createdAt ?? new Date(),
        };
    },

    async removeBan(id: string): Promise<void> {
        await db.delete(groupBans).where(eq(groupBans.id, id));
    },
};