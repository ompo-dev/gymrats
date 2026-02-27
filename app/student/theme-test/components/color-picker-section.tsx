"use client";

import { DuoCard, DuoColorPicker } from "@/components/duo";

export function ColorPickerSection() {
	return (
		<DuoCard.Root variant="elevated" padding="lg">
			<DuoColorPicker.Simple />
		</DuoCard.Root>
	);
}
