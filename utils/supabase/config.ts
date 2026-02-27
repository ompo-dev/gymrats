/**
 * Configuração centralizada do Supabase
 *
 * Valida e retorna url e key em um único lugar (DRY).
 * Usado por client, server e middleware.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		"NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required",
	);
}

export function getSupabaseConfig() {
	return { url: supabaseUrl, key: supabaseKey };
}
