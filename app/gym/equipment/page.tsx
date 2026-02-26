import { getGymEquipment } from "../actions";
import { GymEquipmentPage } from "../components/gym-equipment";

export default async function EquipmentPage() {
	const equipment = await getGymEquipment();

	return <GymEquipmentPage equipment={equipment} />;
}
