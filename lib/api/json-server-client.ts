import axios, { type AxiosInstance } from "axios";

const JSON_SERVER_URL =
	process.env.NEXT_PUBLIC_JSON_SERVER_URL || "http://localhost:3000";

class JsonServerClient {
	private client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: JSON_SERVER_URL,
			timeout: 10000,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	async get<T = Record<string, string | number | boolean | object | null>>(url: string) {
		return this.client.get<T>(url);
	}

	async post<T = Record<string, string | number | boolean | object | null>>(url: string, data?: Record<string, string | number | boolean | object | null>) {
		return this.client.post<T>(url, data);
	}

	async put<T = Record<string, string | number | boolean | object | null>>(url: string, data?: Record<string, string | number | boolean | object | null>) {
		return this.client.put<T>(url, data);
	}

	async patch<T = Record<string, string | number | boolean | object | null>>(url: string, data?: Record<string, string | number | boolean | object | null>) {
		return this.client.patch<T>(url, data);
	}

	async delete<T = Record<string, string | number | boolean | object | null>>(url: string) {
		return this.client.delete<T>(url);
	}
}

export const jsonServerClient = new JsonServerClient();
