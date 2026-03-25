import { getGymEquipment } from "../actions";
import EquipmentPageContent from "./page-content";

export default async function EquipmentPage() {
  const equipment = await getGymEquipment();

  return <EquipmentPageContent equipment={equipment} />;
}
