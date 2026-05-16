"use client";

import { AlertCircle } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionCancelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isTrial?: boolean;
	isLoading?: boolean;
}

export function SubscriptionCancelDialog({
	open,
	onOpenChange,
	onConfirm,
	isTrial = false,
	isLoading = false,
}: SubscriptionCancelDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<AlertCircle className="h-6 w-6 text-red-600" />
					</div>
					<AlertDialogTitle className="text-center text-xl font-bold">
						{isTrial ? "Cancelar Trial?" : "Cancelar Assinatura?"}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-center text-sm text-gray-600">
						{isTrial
							? "Tem certeza que deseja cancelar seu trial gratuito? Você perderá acesso às funcionalidades Premium imediatamente."
							: "Tem certeza que deseja cancelar sua assinatura? O cancelamento será imediato e você perderá acesso às funcionalidades Premium agora."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex-col gap-2 sm:flex-row">
					<AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto">
						Manter
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isLoading}
						className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
					>
						{isLoading
							? "Cancelando..."
							: isTrial
								? "Cancelar Trial"
								: "Cancelar Assinatura"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
