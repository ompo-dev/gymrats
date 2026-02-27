"use client";

import { Plus } from "lucide-react";

export interface CreateGymButtonProps {
	onClick: () => void;
}

export function CreateGymButton({ onClick }: CreateGymButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-8 hover:border-green-500 hover:bg-green-50 transition-all group"
		>
			<div className="flex flex-col items-center gap-3">
				<div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
					<Plus className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
				</div>
				<div>
					<h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
						Criar Nova Academia
					</h3>
					<p className="text-sm text-gray-600 mt-1">
						Adicione mais uma unidade à sua rede
					</p>
				</div>
			</div>
		</button>
	);
}
