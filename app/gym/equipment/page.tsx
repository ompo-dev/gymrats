import { GymEquipmentPage } from "@/components/organisms/gym/gym-equipment";
import { getGymEquipment } from "../actions";

export default async function EquipmentPage() {
  const equipment = await getGymEquipment();

  return <GymEquipmentPage equipment={equipment} />;
}
