import { db } from '@/db/connection';
import { matches, teams, matchPlayers, teamPlayers, users, matchWaitingList, groupMembers } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const matchDetailsService = {
    async fetchMatchDetails(matchId: string) {
        // Get match basic info
        const [matchData] = await db.select()
            .from(matches)
            .where(eq(matches.id, matchId))
            .limit(1);

        if (!matchData) {
            throw new Error('Match not found');
        }

        // Get teams for this match
        const teamsData = await db.select()
            .from(teams)
            .where(eq(teams.matchId, matchId));

        // Get all match players
        const allMatchPlayers = await db.select({
            id: matchPlayers.id,
            teamPlayerId: matchPlayers.teamPlayerId,
            guestName: matchPlayers.guestName,
            joinedAt: matchPlayers.joinedAt,
            teamId: matchPlayers.teamId,
            // Team player info
            tpUserId: teamPlayers.userId,
            tpRating: teamPlayers.rating,
            tpPosition: teamPlayers.preferredPosition,
            tpIsKeyPlayer: teamPlayers.isKeyPlayer,
            // User info
            userName: users.name,
            userEmail: users.email,
        })
            .from(matchPlayers)
            .leftJoin(teamPlayers, eq(matchPlayers.teamPlayerId, teamPlayers.id))
            .leftJoin(users, eq(teamPlayers.userId, users.id))
            .where(eq(matchPlayers.matchId, matchId));

        // Organize match players by team
        const teamsWithPlayers = teamsData.map(team => ({
            ...team,
            matchPlayers: allMatchPlayers
                .filter(mp => mp.teamId === team.id)
                .map(mp => ({
                    id: mp.id,
                    teamPlayerId: mp.teamPlayerId,
                    guestName: mp.guestName,
                    joinedAt: mp.joinedAt,
                    teamPlayers: mp.teamPlayerId ? {
                        users: {
                            id: mp.tpUserId,
                            name: mp.userName,
                            email: mp.userEmail,
                        },
                        rating: mp.tpRating,
                        preferredPosition: mp.tpPosition,
                        isKeyPlayer: mp.tpIsKeyPlayer,
                    } : null,
                })),
        }));

        // Get unassigned players (no team_id)
        const unassignedPlayers = allMatchPlayers
            .filter(mp => !mp.teamId)
            .map(mp => ({
                id: mp.id,
                teamPlayerId: mp.teamPlayerId,
                guestName: mp.guestName,
                joinedAt: mp.joinedAt,
                teamPlayers: mp.teamPlayerId ? {
                    users: {
                        id: mp.tpUserId,
                        name: mp.userName,
                        email: mp.userEmail,
                    },
                    rating: mp.tpRating,
                    preferredPosition: mp.tpPosition,
                    isKeyPlayer: mp.tpIsKeyPlayer,
                } : null,
            }));

        return {
            ...matchData,
            teams: teamsWithPlayers,
            matchPlayers: unassignedPlayers,
        };
    },

    async fetchWaitingList(matchId: string) {
        const waitingListData = await db.select({
            id: matchWaitingList.id,
            teamPlayerId: matchWaitingList.teamPlayerId,
            joinedAt: matchWaitingList.joinedAt,
            // Team player info
            tpUserId: teamPlayers.userId,
            tpRating: teamPlayers.rating,
            tpPosition: teamPlayers.preferredPosition,
            tpIsKeyPlayer: teamPlayers.isKeyPlayer,
            // User info
            userName: users.name,
            userEmail: users.email,
        })
            .from(matchWaitingList)
            .innerJoin(teamPlayers, eq(matchWaitingList.teamPlayerId, teamPlayers.id))
            .innerJoin(users, eq(teamPlayers.userId, users.id))
            .where(eq(matchWaitingList.matchId, matchId));

        return waitingListData.map(item => ({
            id: item.id,
            teamPlayerId: item.teamPlayerId,
            joinedAt: item.joinedAt,
            teamPlayers: {
                users: {
                    id: item.tpUserId,
                    name: item.userName,
                    email: item.userEmail,
                },
                rating: item.tpRating,
                preferredPosition: item.tpPosition,
                isKeyPlayer: item.tpIsKeyPlayer,
            },
        }));
    },

    async fetchAvailableMembers(groupId: string, matchId: string) {
        // Get all group members
        const allMembers = await db.select({
            userId: groupMembers.userId,
            userName: users.name,
            userEmail: users.email,
        })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, groupId));

        // Get team players for these users
        const userIds = allMembers.map(m => m.userId).filter((id): id is string => id !== null);
        if (userIds.length === 0) return [];

        const teamPlayersData = await db.select()
            .from(teamPlayers)
            .where(and(
                eq(teamPlayers.groupId, groupId),
                inArray(teamPlayers.userId, userIds)
            ));

        // Get players already in match
        const teamPlayerIds = teamPlayersData.map(tp => tp.id);
        const playersInMatch = teamPlayerIds.length > 0
            ? await db.select()
                .from(matchPlayers)
                .where(and(
                    eq(matchPlayers.matchId, matchId),
                    inArray(matchPlayers.teamPlayerId, teamPlayerIds)
                ))
            : [];

        const teamPlayerIdsInMatch = new Set(playersInMatch.map(mp => mp.teamPlayerId).filter((id): id is string => id !== null));

        // Filter out players already in match
        return allMembers
            .map(member => {
                const teamPlayer = teamPlayersData.find(tp => tp.userId === member.userId);
                return {
                    id: member.userId || '',
                    name: member.userName || 'Unknown',
                    email: member.userEmail || '',
                    teamPlayerId: teamPlayer?.id,
                };
            })
            .filter(member => member.teamPlayerId && !teamPlayerIdsInMatch.has(member.teamPlayerId));
    },

    async createTeams(matchId: string, teamCount: number) {
        const teamNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const teamsToCreate = [];

        for (let i = 0; i < teamCount; i++) {
            teamsToCreate.push({
                matchId,
                name: `Team ${teamNames[i]}`,
            });
        }

        await db.insert(teams).values(teamsToCreate);

        // Update match to mark teams as created
        await db.update(matches)
            .set({ teamsCreated: true })
            .where(eq(matches.id, matchId));
    },

    async assignPlayerToTeam(matchPlayerId: string, teamId: string) {
        await db.update(matchPlayers)
            .set({ teamId })
            .where(eq(matchPlayers.id, matchPlayerId));
    },

    async removePlayerFromMatch(matchPlayerId: string) {
        await db.delete(matchPlayers)
            .where(eq(matchPlayers.id, matchPlayerId));
    },

    async finalizeTeams(matchId: string) {
        await db.update(matches)
            .set({ teamsFinalized: true })
            .where(eq(matches.id, matchId));
    },

    async deleteMatch(matchId: string) {
        // Delete in order: match_players, teams, match_waiting_list, then match
        await db.delete(matchPlayers).where(eq(matchPlayers.matchId, matchId));
        await db.delete(teams).where(eq(teams.matchId, matchId));
        await db.delete(matchWaitingList).where(eq(matchWaitingList.matchId, matchId));
        await db.delete(matches).where(eq(matches.id, matchId));
    },

    async randomizeTeams(matchId: string) {
        // Get all unassigned players
        const unassignedPlayers = await db.select()
            .from(matchPlayers)
            .where(and(
                eq(matchPlayers.matchId, matchId),
                eq(matchPlayers.teamId, '')
            ));

        // Get all teams for this match
        const teamsData = await db.select()
            .from(teams)
            .where(eq(teams.matchId, matchId));

        if (teamsData.length === 0) return;

        // Shuffle players
        const shuffled = [...unassignedPlayers].sort(() => Math.random() - 0.5);

        // Distribute players evenly across teams
        for (let i = 0; i < shuffled.length; i++) {
            const teamIndex = i % teamsData.length;
            const player = shuffled[i];
            const team = teamsData[teamIndex];

            await db.update(matchPlayers)
                .set({ teamId: team.id })
                .where(eq(matchPlayers.id, player.id));
        }
    },
};
