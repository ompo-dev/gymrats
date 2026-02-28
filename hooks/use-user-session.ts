"use client";

import { useEffect, useState } from "react";

interface UserSession {
	id: string;
	email: string;
	name: string;
	role: "PENDING" | "STUDENT" | "GYM" | "ADMIN";
	hasGym: boolean;
	hasStudent: boolean;
}

let sessionPromise: Promise<UserSession | null> | null = null;
let cachedSession: UserSession | null | undefined;
let cacheAt = 0;
const SESSION_TTL_MS = 5000;

async function fetchSessionSingleFlight(): Promise<UserSession | null> {
	const now = Date.now();
	if (cachedSession !== undefined && now - cacheAt < SESSION_TTL_MS) {
		return cachedSession;
	}

	if (!sessionPromise) {
		sessionPromise = (async () => {
			const { apiClient } = await import("@/lib/api/client");
			const response = await apiClient.get<{ user: UserSession | null }>(
				"/api/auth/session",
				{ timeout: 30000 },
			);
			cachedSession = response.data.user ?? null;
			cacheAt = Date.now();
			return cachedSession;
		})().finally(() => {
			sessionPromise = null;
		});
	}

	return sessionPromise;
}

export function useUserSession() {
	const [userSession, setUserSession] = useState<UserSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		async function fetchSession() {
			try {
				const session = await fetchSessionSingleFlight();
				if (session) {
					setUserSession(session);
					setIsAdmin(session.role === "ADMIN");
				} else {
					setUserSession(null);
					setIsAdmin(false);
				}
			} catch (error) {
				console.error("Erro ao buscar sessão:", error);
				setUserSession(null);
				setIsAdmin(false);
			} finally {
				setIsLoading(false);
			}
		}

		fetchSession();
	}, []);

	return {
		userSession,
		isAdmin,
		isLoading,
		role: (userSession?.role ?? null) as
			| "PENDING"
			| "STUDENT"
			| "GYM"
			| "ADMIN"
			| null,
		hasGym: userSession?.hasGym ?? false,
	};
}
