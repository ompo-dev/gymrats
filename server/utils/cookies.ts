import type { Context } from "elysia";

export interface CookieOptions {
	maxAge?: number;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
	path?: string;
}

function serializeCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
) {
	const parts = [`${name}=${encodeURIComponent(value)}`];

	if (options.maxAge !== undefined) {
		parts.push(`Max-Age=${options.maxAge}`);
	}
	if (options.httpOnly !== false) {
		parts.push("HttpOnly");
	}
	if (options.secure ?? process.env.NODE_ENV === "production") {
		parts.push("Secure");
	}
	if (options.sameSite) {
		parts.push(`SameSite=${options.sameSite}`);
	} else {
		parts.push("SameSite=Lax");
	}
	parts.push(`Path=${options.path || "/"}`);

	return parts.join("; ");
}

export function appendSetCookie(set: Context["set"], cookieValue: string) {
	const headers = set.headers as Record<string, string | string[]>;
	const existing = headers["Set-Cookie"];
	if (!existing) {
		headers["Set-Cookie"] = cookieValue;
		return;
	}

	if (Array.isArray(existing)) {
		existing.push(cookieValue);
		headers["Set-Cookie"] = existing;
		return;
	}

	headers["Set-Cookie"] = [existing, cookieValue];
}

export function setCookieHeader(
	set: Context["set"],
	name: string,
	value: string,
	options: CookieOptions = {},
) {
	appendSetCookie(set, serializeCookie(name, value, options));
}

export function deleteCookieHeader(
	set: Context["set"],
	name: string,
	options: CookieOptions = {},
) {
	appendSetCookie(
		set,
		serializeCookie(name, "", {
			...options,
			maxAge: 0,
		}),
	);
}
