/**
 * API Client padrão (online).
 * Usa createApiClient da factory. Para offline, use createApiClient({ offline: true }).
 */

import { createApiClient } from "./client-factory";

export const apiClient = createApiClient({ offline: false });
