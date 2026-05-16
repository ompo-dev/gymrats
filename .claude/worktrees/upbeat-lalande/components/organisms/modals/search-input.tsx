"use client";

import { Search } from "lucide-react";
import { motion } from "motion/react";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Buscar...",
}: SearchInputProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.15, duration: 0.3 }}
			className="relative flex-1"
		>
			<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-xl border-2 border-gray-300 py-3 pl-12 pr-4 font-bold text-gray-900 placeholder:text-gray-400 focus:border-duo-blue focus:outline-none"
			/>
		</motion.div>
	);
}
