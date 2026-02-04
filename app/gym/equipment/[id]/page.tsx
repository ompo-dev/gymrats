import { getGymEquipmentById } from "../../actions";
import EquipmentDetailPage from "./page-content";

export default async function EquipmentDetailPageWrapper({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const equipment = await getGymEquipmentById(id);

	return <EquipmentDetailPage equipment={equipment} />;
}
