import { db } from "../db/connection";
import { accounts } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Account } from "../types/entities";

export const accountsService = {
    async getAll(): Promise<Account[]> {
        const result = await db.select().from(accounts);
        return result.map(account => ({
            ...account,
            refreshToken: account.refreshToken ?? undefined,
            accessToken: account.accessToken ?? undefined,
            expiresAt: account.expiresAt ?? undefined,
            tokenType: account.tokenType ?? undefined,
            scope: account.scope ?? undefined,
            idToken: account.idToken ?? undefined,
            sessionState: account.sessionState ?? undefined,
        }));
    },

    async getById(id: string): Promise<Account | undefined> {
        const result = await db.select().from(accounts).where(eq(accounts.id, id));
        if (result[0]) {
            return {
                ...result[0],
                refreshToken: result[0].refreshToken ?? undefined,
                accessToken: result[0].accessToken ?? undefined,
                expiresAt: result[0].expiresAt ?? undefined,
                tokenType: result[0].tokenType ?? undefined,
                scope: result[0].scope ?? undefined,
                idToken: result[0].idToken ?? undefined,
                sessionState: result[0].sessionState ?? undefined,
            };
        }
        return undefined;
    },

    async create(account: Omit<Account, "id">): Promise<Account> {
        const [newAccount] = await db.insert(accounts).values(account).returning();
        return {
            ...newAccount,
            refreshToken: newAccount.refreshToken ?? undefined,
            accessToken: newAccount.accessToken ?? undefined,
            expiresAt: newAccount.expiresAt ?? undefined,
            tokenType: newAccount.tokenType ?? undefined,
            scope: newAccount.scope ?? undefined,
            idToken: newAccount.idToken ?? undefined,
            sessionState: newAccount.sessionState ?? undefined,
        };
    },

    async update(id: string, updates: Partial<Omit<Account, "id">>): Promise<Account | undefined> {
        const [updatedAccount] = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();
        if (updatedAccount) {
            return {
                ...updatedAccount,
                refreshToken: updatedAccount.refreshToken ?? undefined,
                accessToken: updatedAccount.accessToken ?? undefined,
                expiresAt: updatedAccount.expiresAt ?? undefined,
                tokenType: updatedAccount.tokenType ?? undefined,
                scope: updatedAccount.scope ?? undefined,
                idToken: updatedAccount.idToken ?? undefined,
                sessionState: updatedAccount.sessionState ?? undefined,
            };
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        await db.delete(accounts).where(eq(accounts.id, id));
    },
};