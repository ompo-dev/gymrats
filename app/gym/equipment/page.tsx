import { Suspense } from "react";
import GymEquipmentPage from "./page-content";
import { getGymEquipment } from "../actions";

export default async function EquipmentPage() {
  const equipment = await getGymEquipment();

  return <GymEquipmentPage equipment={equipment} />;
}
