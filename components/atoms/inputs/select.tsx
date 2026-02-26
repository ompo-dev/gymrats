"use client";

import * as React from "react";
import {
	DuoSelect,
	type DuoSelectOption,
} from "@/components/duo/molecules/duo-select";

export interface SelectOption<T = string> {
	value: T;
	label: string;
	description?: string;
	icon?: React.ReactNode;
	badge?: React.ReactNode;
	disabled?: boolean;
}

interface SelectProps<T = string>
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
	options: SelectOption<T>[];
	value?: T;
	onChange?: (value: T) => void;
	placeholder?: string;
	disabled?: boolean;
	renderTrigger?: (selected: SelectOption<T> | undefined) => React.ReactNode;
	renderOption?: (option: SelectOption<T>) => React.ReactNode;
	className?: string;
	dropdownClassName?: string;
	variant?: "default" | "primary" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
}

function SelectInner<T = string>({
	options,
	value,
	onChange,
	placeholder = "Selecione...",
	disabled,
	className,
	...props
}: SelectProps<T>) {
	const duoOptions: DuoSelectOption[] = options.map((opt) => ({
		value: String(opt.value),
		label: opt.label,
		description: opt.description,
		icon: opt.icon,
		badge: opt.badge,
		disabled: opt.disabled,
	}));

	const stringValue =
		value !== undefined && value !== null ? String(value) : undefined;

	return (
		<DuoSelect
			options={duoOptions}
			value={stringValue}
			onChange={(v) => onChange?.(v as T)}
			placeholder={placeholder}
			disabled={disabled}
			className={className}
			{...props}
		/>
	);
}

export const Select = SelectInner as <T = string>(
	props: SelectProps<T>,
) => React.ReactElement;
