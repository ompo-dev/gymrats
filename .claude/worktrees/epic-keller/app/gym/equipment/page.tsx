import { getGymEquipment } from "../actions";
import GymEquipmentPage from "./page-content";

export default async function EquipmentPage() {
	const equipment = await getGymEquipment();

	return <GymEquipmentPage equipment={equipment} />;
}
