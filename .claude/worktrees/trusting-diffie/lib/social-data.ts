import type { Activity, Challenge, Friend, LeaderboardEntry } from "./types";

export const mockFriends: Friend[] = [
	{
		id: "friend-1",
		name: "Carlos Silva",
		username: "carlosfit",
		level: 12,
		currentStreak: 8,
		totalXP: 2450,
		weeklyXP: 420,
		status: "mutual",
		isOnline: true,
	},
	{
		id: "friend-2",
		name: "Ana Costa",
		username: "anastrong",
		level: 15,
		currentStreak: 15,
		totalXP: 3200,
		weeklyXP: 550,
		status: "mutual",
		isOnline: false,
		lastActive: new Date(Date.now() - 3600000),
	},
	{
		id: "friend-3",
		name: "Pedro Santos",
		username: "pedrolift",
		level: 10,
		currentStreak: 5,
		totalXP: 1890,
		weeklyXP: 380,
		status: "mutual",
		isOnline: true,
	},
	{
		id: "friend-4",
		name: "Julia Lima",
		username: "juliafit",
		level: 18,
		currentStreak: 22,
		totalXP: 4100,
		weeklyXP: 620,
		status: "following",
		isOnline: false,
	},
	{
		id: "friend-5",
		name: "Bruno Alves",
		username: "brunogains",
		level: 9,
		currentStreak: 3,
		totalXP: 1650,
		weeklyXP: 290,
		status: "mutual",
		isOnline: false,
	},
];

// Mock current user
export const mockCurrentUser: Friend = {
	id: "user-me",
	name: "Você",
	username: "voce",
	level: 8,
	currentStreak: 5,
	totalXP: 1287,
	weeklyXP: 340,
	status: "mutual",
	isOnline: true,
};

export const mockLeaderboard: LeaderboardEntry[] = [
	{ rank: 1, user: mockFriends[3], xp: 620, change: 0 },
	{ rank: 2, user: mockFriends[1], xp: 550, change: 1 },
	{ rank: 3, user: mockFriends[0], xp: 420, change: -1 },
	{ rank: 4, user: mockFriends[2], xp: 380, change: 2 },
	{ rank: 5, user: mockCurrentUser, xp: 340, change: 0 },
	{ rank: 6, user: mockFriends[4], xp: 290, change: -2 },
];

export const mockChallenges: Challenge[] = [
	{
		id: "challenge-1",
		title: "Desafio de Sequência",
		description: "Mantenha 7 dias seguidos de treino",
		type: "streak",
		startDate: new Date(Date.now() - 432000000),
		endDate: new Date(Date.now() + 172800000),
		participants: [mockCurrentUser, mockFriends[0], mockFriends[1]],
		goal: 7,
		currentProgress: 5,
		reward: { xp: 150, badge: "🔥" },
		isActive: true,
	},
	{
		id: "challenge-2",
		title: "Corrida de XP",
		description: "Seja o primeiro a ganhar 500 XP esta semana",
		type: "xp",
		startDate: new Date(Date.now() - 259200000),
		endDate: new Date(Date.now() + 345600000),
		participants: [mockCurrentUser, ...mockFriends.slice(0, 4)],
		goal: 500,
		currentProgress: 340,
		reward: { xp: 200, badge: "⚡" },
		isActive: true,
	},
	{
		id: "challenge-3",
		title: "Treino de Pernas",
		description: "Complete 5 treinos de pernas este mês",
		type: "workout",
		startDate: new Date(Date.now() - 864000000),
		endDate: new Date(Date.now() + 1728000000),
		participants: [mockCurrentUser, mockFriends[2]],
		goal: 5,
		currentProgress: 2,
		reward: { xp: 100, badge: "🦵" },
		isActive: true,
	},
];

export const mockActivities: Activity[] = [
	{
		id: "act-1",
		user: mockFriends[1],
		type: "workout",
		description: "completou Peito e Tríceps",
		timestamp: new Date(Date.now() - 1800000),
		xpEarned: 50,
		workoutName: "Peito e Tríceps - Dia A",
	},
	{
		id: "act-2",
		user: mockFriends[0],
		type: "achievement",
		description: "desbloqueou uma conquista",
		timestamp: new Date(Date.now() - 3600000),
		achievementIcon: "🏆",
	},
	{
		id: "act-3",
		user: mockFriends[2],
		type: "streak",
		description: "atingiu 5 dias de sequência",
		timestamp: new Date(Date.now() - 7200000),
	},
	{
		id: "act-4",
		user: mockFriends[3],
		type: "level-up",
		description: "subiu para o nível 18",
		timestamp: new Date(Date.now() - 10800000),
	},
	{
		id: "act-5",
		user: mockFriends[4],
		type: "workout",
		description: "completou Pernas Completo",
		timestamp: new Date(Date.now() - 14400000),
		xpEarned: 75,
		workoutName: "Pernas Completo - Dia C",
	},
];

export function searchUsers(query: string): Friend[] {
	const allUsers = [...mockFriends, mockCurrentUser];
	return allUsers.filter(
		(user) =>
			user.name.toLowerCase().includes(query.toLowerCase()) ||
			user.username.toLowerCase().includes(query.toLowerCase()),
	);
}

export function getWeeklyRankings(): LeaderboardEntry[] {
	return mockLeaderboard.sort((a, b) => b.xp - a.xp);
}

export function getActiveChallenges(): Challenge[] {
	return mockChallenges.filter((c) => c.isActive && new Date() < c.endDate);
}
