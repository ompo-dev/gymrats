import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "./config";

export const createClient = (request: NextRequest) => {
	const { url, key } = getSupabaseConfig();
	let supabaseResponse = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(url, key, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
				cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => {
					request.cookies.set(name, value);
				});
				supabaseResponse = NextResponse.next({
					request,
				});
				cookiesToSet.forEach(
					({ name, value, options }: { name: string; value: string; options?: object }) => {
						supabaseResponse.cookies.set(name, value, options);
					},
				);
			},
		},
	});

	return { supabase, response: supabaseResponse };
};
