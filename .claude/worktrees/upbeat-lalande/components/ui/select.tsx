import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const selectTriggerVariants = cva(
	"inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-[0_2px_0_#E5E7EB] active:shadow-none active:translate-y-[2px]",
				primary:
					"bg-duo-green text-white border-2 border-duo-green shadow-[0_4px_0_#58A700] hover:bg-duo-green/90 active:shadow-none active:translate-y-[4px]",
				outline:
					"bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-50",
				ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
			},
			size: {
				default: "h-[50px] px-4 text-[13.2px]",
				sm: "h-10 px-3 text-xs",
				lg: "h-[58px] px-6 text-base",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

const selectDropdownVariants = cva(
	"absolute z-50 mt-2 rounded-2xl border-2 shadow-[0_4px_16px_rgba(0,0,0,0.1)] overflow-hidden",
	{
		variants: {
			variant: {
				default: "bg-white border-gray-200",
				primary: "bg-white border-duo-green",
				outline: "bg-white border-gray-300",
				ghost: "bg-white border-gray-200",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const selectItemVariants = cva(
	"flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer outline-none",
	{
		variants: {
			variant: {
				default: "hover:bg-gray-100 text-gray-900",
				primary: "hover:bg-green-50 text-gray-900",
				outline: "hover:bg-gray-50 text-gray-900",
				ghost: "hover:bg-gray-100 text-gray-900",
			},
			state: {
				default: "",
				selected: "bg-green-50 text-duo-green font-bold",
			},
		},
		defaultVariants: {
			variant: "default",
			state: "default",
		},
	},
);

export interface SelectOption<T = string> {
	value: T;
	label: string;
	description?: string;
	icon?: React.ReactNode;
	badge?: React.ReactNode;
	disabled?: boolean;
}

interface SelectProps<T = string>
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
		VariantProps<typeof selectTriggerVariants> {
	options: SelectOption<T>[];
	value?: T;
	onChange?: (value: T) => void;
	placeholder?: string;
	disabled?: boolean;
	renderTrigger?: (selected: SelectOption<T> | undefined) => React.ReactNode;
	renderOption?: (option: SelectOption<T>) => React.ReactNode;
	className?: string;
	dropdownClassName?: string;
}

export function Select<T = string>({
	options,
	value,
	onChange,
	placeholder = "Selecione...",
	disabled,
	variant,
	size,
	renderTrigger,
	renderOption,
	className,
	dropdownClassName,
	...props
}: SelectProps<T>) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [isAnimating, setIsAnimating] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	// Fechar dropdown ao clicar fora
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleSelect = (option: SelectOption<T>) => {
		if (option.disabled) return;

		// Animação de seleção
		setIsAnimating(true);

		// Delay para mostrar a animação
		setTimeout(() => {
			onChange?.(option.value);
			setIsOpen(false);
			setIsAnimating(false);
		}, 300);
	};

	const defaultTriggerContent = selectedOption ? (
		<div className="flex items-center gap-2 flex-1 min-w-0">
			{selectedOption.icon}
			<div className="flex flex-col items-start flex-1 min-w-0">
				<span className="truncate">{selectedOption.label}</span>
				{selectedOption.description && (
					<span className="text-xs text-gray-500 font-normal truncate">
						{selectedOption.description}
					</span>
				)}
			</div>
			{selectedOption.badge}
		</div>
	) : (
		<span className="text-gray-500">{placeholder}</span>
	);

	// Filtrar opção selecionada da lista (evitar redundância)
	const availableOptions = options.filter((opt) => opt.value !== value);

	return (
		<>
			<div ref={containerRef} className="relative" {...props}>
				{/* Trigger Button */}
				<button
					type="button"
					onClick={() => !disabled && setIsOpen(!isOpen)}
					disabled={disabled}
					className={cn(
						selectTriggerVariants({ variant, size }),
						"transition-all duration-200",
						className,
					)}
					suppressHydrationWarning
				>
					<div
						className={cn(
							"flex-1 min-w-0 transition-all duration-300",
							isAnimating && "opacity-50 scale-95",
						)}
					>
						{renderTrigger?.(selectedOption) || defaultTriggerContent}
					</div>
					<ChevronDown
						className={cn(
							"h-4 w-4 transition-transform duration-300 shrink-0",
							isOpen && "rotate-180",
						)}
					/>
				</button>

				{/* Dropdown com animação */}
				{isOpen && (
					<div
						className={cn(
							selectDropdownVariants({ variant }),
							"min-w-full w-max max-w-md max-h-[400px] overflow-y-auto select-dropdown",
							dropdownClassName,
						)}
					>
						{availableOptions.map((option, index) => {
							const defaultOptionContent = (
								<>
									<div className="flex items-center gap-2 flex-1 min-w-0">
										{option.icon}
										<div className="flex flex-col items-start flex-1 min-w-0">
											<span className="truncate">{option.label}</span>
											{option.description && (
												<span className="text-xs text-gray-500 font-normal truncate">
													{option.description}
												</span>
											)}
										</div>
										{option.badge}
									</div>
								</>
							);

							return (
								<div
									key={index}
									onClick={() => handleSelect(option)}
									className={cn(
										selectItemVariants({
											variant,
											state: "default",
										}),
										"select-item",
										option.disabled && "opacity-50 cursor-not-allowed",
										isAnimating && "opacity-50",
									)}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									{renderOption?.(option) || defaultOptionContent}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Estilos de animação inline */}
			<style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .select-dropdown {
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .select-item {
          animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
		</>
	);
}

export { selectTriggerVariants, selectDropdownVariants, selectItemVariants };
