import type { BoostCampaign } from "@/lib/types";
import { actionClient as apiClient } from "@/lib/actions/client";

export async function getActiveBoostCampaignsRequest() {
  const response = await apiClient.get<{ campaigns: BoostCampaign[] }>(
    "/api/boost-campaigns/nearby",
  );
  return response.data.campaigns ?? [];
}
