import { apiClient } from "./client";
import type { BoostCampaign } from "@/lib/types";

export async function getActiveBoostCampaignsRequest() {
  const response = await apiClient.get<{ campaigns: BoostCampaign[] }>(
    "/api/boost-campaigns/nearby",
  );
  return response.data.campaigns ?? [];
}
