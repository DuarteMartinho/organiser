import { db } from "../db/connection";
import { groupMembers } from "../db/schema";
import { eq } from "drizzle-orm";
import type { GroupMember } from "../types/entities";

export const groupMembersService = {
    async listGroupsForUser(userId: string): Promise<GroupMember[]> {
        const result = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
        return result.map(member => ({
            groupId: member.groupId,
            userId: member.userId,
            joinedAt: member.joinedAt ?? new Date(),
        }));
    },
};