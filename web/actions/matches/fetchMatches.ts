"use server"

import { matchesService } from '@/services/matches-service';
import type { DashboardMatch } from '@/components/dashboard';

export async function fetchMatches(userGroups: any[]): Promise<{ upcoming: DashboardMatch[]; past: DashboardMatch[] }> {
    const groupIds = userGroups.map(group => group.groupId);
    const { upcoming, past } = await matchesService.getMatchesByGroupIds(groupIds);

    const mapToDashboardMatch = (match: any): DashboardMatch => ({
        id: match.id,
        date_time: match.dateTime,
        location: match.location,
        max_players_per_team: match.maxPlayersPerTeam,
        planned_teams: match.plannedTeams,
        teams_created: match.teamsCreated,
        teams_finalized: match.teamsFinalized,
        created_at: match.createdAt,
        created_by: match.createdBy,
        groups: {
            id: match.groupId,
            name: match.groupName, // Replace with actual group name if available
        },
        teams: [], // Replace with actual teams data if available
    });

    return {
        upcoming: upcoming.map(mapToDashboardMatch),
        past: past.map(mapToDashboardMatch),
    };
}