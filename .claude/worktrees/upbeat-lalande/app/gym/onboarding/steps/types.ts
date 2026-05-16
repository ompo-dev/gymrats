import type { EquipmentItem } from "@/lib/equipment-database";

export interface GymOnboardingData {
	name: string;
	address: string;
	addressNumber: string;
	city: string;
	state: string;
	zipCode: string;
	phone: string;
	email: string;
	cnpj: string;
	equipment: EquipmentItem[];
}

export interface StepProps {
	formData: GymOnboardingData;
	setFormData: React.Dispatch<React.SetStateAction<GymOnboardingData>>;
}
