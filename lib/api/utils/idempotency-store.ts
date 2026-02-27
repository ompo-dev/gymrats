import { db } from "@/lib/db";

type ReplayRow = {
	key: string;
	status: string;
	response_status: number | null;
	response_body: string | null;
};

let tableReady = false;

async function ensureTable() {
	if (tableReady) return;
	await db.$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS api_idempotency_keys (
			key TEXT PRIMARY KEY,
			route TEXT NOT NULL,
			method TEXT NOT NULL,
			request_fingerprint TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'processing',
			response_status INTEGER,
			response_body TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`);
	tableReady = true;
}

function stringifySafe(value: string | number | boolean | null | object) {
	try {
		return JSON.stringify(value ?? null);
	} catch {
		return "null";
	}
}

export async function getReplayRecord(key: string) {
	await ensureTable();
	const rows = (await db.$queryRawUnsafe(
		`SELECT key, status, response_status, response_body FROM api_idempotency_keys WHERE key = $1 LIMIT 1`,
		key,
	)) as ReplayRow[];

	return rows[0] ?? null;
}

export async function reserveIdempotencyKey(input: {
	key: string;
	route: string;
	method: string;
	body: Record<string, string | number | boolean | object | null>;
}) {
	await ensureTable();
	const requestFingerprint = stringifySafe({
		route: input.route,
		method: input.method,
		body: input.body ?? null,
	});

	await db.$executeRawUnsafe(
		`
		INSERT INTO api_idempotency_keys (key, route, method, request_fingerprint, status)
		VALUES ($1, $2, $3, $4, 'processing')
		ON CONFLICT (key) DO NOTHING
		`,
		input.key,
		input.route,
		input.method,
		requestFingerprint,
	);
}

export async function completeIdempotencyKey(input: {
	key: string;
	statusCode: number;
	responseBody: string;
}) {
	await ensureTable();
	await db.$executeRawUnsafe(
		`
		UPDATE api_idempotency_keys
		SET
			status = 'completed',
			response_status = $2,
			response_body = $3,
			updated_at = NOW()
		WHERE key = $1
		`,
		input.key,
		input.statusCode,
		input.responseBody,
	);
}

export async function failIdempotencyKey(key: string) {
	await ensureTable();
	await db.$executeRawUnsafe(
		`DELETE FROM api_idempotency_keys WHERE key = $1`,
		key,
	);
}
