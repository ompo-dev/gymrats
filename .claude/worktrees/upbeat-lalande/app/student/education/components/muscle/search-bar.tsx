"use client";

import { Search, X } from "lucide-react";
import { SlideIn } from "@/components/animations/slide-in";

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
	return (
		<SlideIn delay={0.15}>
			<div className="relative">
				<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-gray-dark" />
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="w-full rounded-xl border-2 border-gray-300 bg-white py-3 pl-12 pr-10 font-semibold text-duo-text placeholder:text-duo-gray-dark focus:border-duo-blue focus:outline-none focus:ring-2 focus:ring-duo-blue/20"
				/>
				{value && (
					<button
						type="button"
						onClick={() => onChange("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-duo-gray-dark transition-colors hover:bg-gray-100 hover:text-duo-text"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>
		</SlideIn>
	);
}
