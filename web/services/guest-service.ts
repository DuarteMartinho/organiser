import { db } from '@/db/connection';
import { users, groupMembers, teamPlayers } from '@/db/schema';
import { eq, and, like } from 'drizzle-orm';

export const guestService = {
    async addGuest(data: {
        groupId: string;
        guestName: string;
    }) {
        // Generate unique ID and email for guest
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const generatedEmail = `${data.guestName.trim().toLowerCase().replace(/\s+/g, '.')}.guest-${Date.now()}@temp.local`;

        // Create guest user
        const [guestUser] = await db
            .insert(users)
            .values({
                id: guestId,
                name: data.guestName.trim(),
                email: generatedEmail,
            })
            .returning();

        // Add to group members
        await db.insert(groupMembers).values({
            groupId: data.groupId,
            userId: guestUser.id,
        });

        // Create team player profile
        await db.insert(teamPlayers).values({
            userId: guestUser.id,
            groupId: data.groupId,
            role: 'player',
            rating: 5,
            isKeyPlayer: false,
            preferredPosition: 'MID',
        });

        return guestUser;
    },

    async fetchGuests(groupId: string) {
        // Get all members with user details who have @temp.local emails (guests)
        const guestsData = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                joinedAt: groupMembers.joinedAt,
            })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(and(
                eq(groupMembers.groupId, groupId),
                like(users.email, '%@temp.local')
            ))
            .orderBy(groupMembers.joinedAt);

        return guestsData.map(guest => ({
            id: guest.id,
            name: guest.name,
            email: guest.email,
            joinedAt: guest.joinedAt,
        }));
    }
};
