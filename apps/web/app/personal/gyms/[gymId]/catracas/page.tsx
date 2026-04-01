import { PersonalGymAccessPage } from "@/components/organisms/personal";

export default async function PersonalGymAccessRoute({
  params,
}: {
  params: Promise<{ gymId: string }> | { gymId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  return <PersonalGymAccessPage gymId={resolvedParams.gymId} />;
}
