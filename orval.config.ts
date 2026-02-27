import { defineConfig } from "orval";

export default defineConfig({
	gymrats: {
		input: "./openapi.json",
		output: {
			target: "./lib/api/generated/client.ts",
			schemas: "./lib/api/generated/model",
			client: "axios",
			override: {
				mutator: {
					path: "./lib/api/mutator/custom-instance.ts",
					name: "customInstance",
				},
			},
		},
	},
});
