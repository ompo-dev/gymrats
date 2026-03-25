import type { BoostCampaign } from "@/lib/types";
import { apiClient } from "./client";

export async function getActiveBoostCampaignsRequest() {
  const response = await apiClient.get<{ campaigns: BoostCampaign[] }>(
    "/api/boost-campaigns/nearby",
  );
  return response.data.campaigns ?? [];
}
