import { db } from "../db/connection";
import { groupAdmins } from "../db/schema";
import { and, eq } from "drizzle-orm";
import type { GroupAdmin } from "../types/entities";

export const groupAdminsService = {
    async getAll(): Promise<GroupAdmin[]> {
        const result = await db.select().from(groupAdmins);
        return result.map(admin => ({
            ...admin,
            createdAt: admin.createdAt ?? new Date(),
        }));
    },

    async addAdmin(groupId: string, userId: string): Promise<GroupAdmin> {
        const [newAdmin] = await db.insert(groupAdmins).values({ groupId, userId }).returning();
        return {
            ...newAdmin,
            createdAt: newAdmin.createdAt ?? new Date(),
        };
    },

    async removeAdmin(groupId: string, userId: string): Promise<void> {
        await db.delete(groupAdmins).where(and(eq(groupAdmins.groupId, groupId), eq(groupAdmins.userId, userId)));
    },
};