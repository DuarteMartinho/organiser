import { db } from "../db/connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { User } from "../types/entities";

export const usersService = {
    async getAll(): Promise<User[]> {
        const result = await db.select().from(users);
        return result.map(user => ({
            ...user,
            joinedAt: user.joinedAt ?? new Date(),
        }));
    },

    async getById(id: string): Promise<User | undefined> {
        const result = await db.select().from(users).where(eq(users.id, id));
        if (result[0]) {
            return {
                ...result[0],
                joinedAt: result[0].joinedAt ?? new Date(),
            };
        }
        return undefined;
    },

    async create(user: { name: string; email: string }): Promise<User> {
        const [newUser] = await db.insert(users).values(user).returning();
        return {
            ...newUser,
            joinedAt: newUser.joinedAt ?? new Date(),
        };
    },

    async update(id: string, updates: Partial<{ name: string; email: string }>): Promise<User | undefined> {
        const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
        if (updatedUser) {
            return {
                ...updatedUser,
                joinedAt: updatedUser.joinedAt ?? new Date(),
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(users).where(eq(users.id, id));
    },
};