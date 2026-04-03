import { redirect } from "next/navigation";

export default async function PersonalGymAccessRoute({
  params,
}: {
  params: Promise<{ gymId: string }> | { gymId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  redirect(
    `/personal?tab=gyms&gymId=${resolvedParams.gymId}&gymView=catracas`,
  );
}
