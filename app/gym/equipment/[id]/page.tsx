import { Suspense } from "react";
import EquipmentDetailPage from "./page-content";
import { getGymEquipmentById } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EquipmentDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const equipment = await getGymEquipmentById(id);

  return <EquipmentDetailPage equipment={equipment} />;
}
