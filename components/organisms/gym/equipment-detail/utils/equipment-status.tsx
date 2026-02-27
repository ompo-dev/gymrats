import { Activity, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";

export type EquipmentStatus = "available" | "in-use" | "maintenance" | "broken";

export function getStatusColor(status: string): string {
	switch (status) {
		case "available":
			return "bg-duo-green text-white";
		case "in-use":
			return "bg-duo-blue text-white";
		case "maintenance":
			return "bg-duo-orange text-white";
		case "broken":
			return "bg-duo-red text-white";
		default:
			return "bg-duo-gray text-duo-gray-dark";
	}
}

export function getStatusIcon(status: string) {
	switch (status) {
		case "available":
			return <CheckCircle2 className="h-6 w-6" />;
		case "in-use":
			return <Activity className="h-6 w-6" />;
		case "maintenance":
			return <Wrench className="h-6 w-6" />;
		case "broken":
			return <AlertTriangle className="h-6 w-6" />;
		default:
			return null;
	}
}

export function getStatusText(status: string): string {
	switch (status) {
		case "available":
			return "Disponível";
		case "in-use":
			return "Em Uso";
		case "maintenance":
			return "Manutenção";
		case "broken":
			return "Quebrado";
		default:
			return status;
	}
}
