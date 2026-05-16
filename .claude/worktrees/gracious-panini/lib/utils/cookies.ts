import { cookies } from "next/headers";

export async function getCookie(name: string): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(name)?.value || null;
}

export async function setCookie(
	name: string,
	value: string,
	options?: {
		maxAge?: number;
		httpOnly?: boolean;
		secure?: boolean;
		sameSite?: "strict" | "lax" | "none";
		path?: string;
	},
) {
	const cookieStore = await cookies();
	cookieStore.set(name, value, {
		maxAge: options?.maxAge || 60 * 60 * 24 * 30,
		httpOnly: options?.httpOnly ?? true,
		secure: options?.secure ?? process.env.NODE_ENV === "production",
		sameSite: options?.sameSite || "lax",
		path: options?.path || "/",
	});
}

export async function deleteCookie(name: string) {
	const cookieStore = await cookies();
	cookieStore.delete(name);
}
