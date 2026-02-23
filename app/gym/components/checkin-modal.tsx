"use client";

import { CheckCircle, Loader2, LogIn, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { Input } from "@/components/ui/input";

interface ActiveMember {
	id: string;
	name: string;
	avatar?: string | null;
}

interface CheckInModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function CheckInModal({ isOpen, onClose, onSuccess }: CheckInModalProps) {
	const [search, setSearch] = useState("");
	const [members, setMembers] = useState<ActiveMember[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [checking, setChecking] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounce: buscar membros ativos pelo nome
	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (search.length < 2) {
			setMembers([]);
			return;
		}
		timerRef.current = setTimeout(async () => {
			setIsLoading(true);
			try {
				const res = await fetch(
					`/api/gyms/members?status=active&search=${encodeURIComponent(search)}`,
				);
				const data = await res.json();
				setMembers(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(data.members ?? []).map((m: any) => ({
						id: m.student.id,
						name: m.student.user?.name ?? m.studentName ?? "Aluno",
						avatar: m.student.avatar,
					})),
				);
			} catch {
				setMembers([]);
			} finally {
				setIsLoading(false);
			}
		}, 400);
	}, [search]);

	// Focar no input ao abrir
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	const handleCheckIn = async (studentId: string, studentName: string) => {
		setChecking(studentId);
		setError("");
		try {
			const res = await fetch("/api/gyms/checkin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ studentId }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error ?? "Erro ao registrar check-in");
			} else {
				setSuccess(studentName);
				setTimeout(() => {
					setSuccess(null);
					onSuccess();
				}, 1800);
			}
		} finally {
			setChecking(null);
		}
	};

	const handleClose = () => {
		setSearch("");
		setMembers([]);
		setSuccess(null);
		setError("");
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
			onClick={(e) => e.target === e.currentTarget && handleClose()}
			onKeyDown={(e) => e.key === "Escape" && handleClose()}
		>
			<DuoCard
				variant="default"
				size="default"
				className="w-full max-w-md"
			>
				{/* Header */}
				<div className="mb-5 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-duo-green/10">
							<LogIn className="h-5 w-5 text-duo-green" />
						</div>
						<h2 className="text-xl font-bold text-duo-text">
							Registrar Check-in
						</h2>
					</div>
					<button
						onClick={handleClose}
						className="flex h-8 w-8 items-center justify-center rounded-full text-duo-gray-dark transition-colors hover:bg-duo-gray-lighter hover:text-duo-text"
						type="button"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Feedback de sucesso */}
				{success && (
					<DuoCard variant="highlighted" size="sm" className="mb-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 flex-shrink-0 text-duo-green" />
							<p className="font-bold text-duo-green">
								Check-in registrado para {success}!
							</p>
						</div>
					</DuoCard>
				)}

				{/* Feedback de erro */}
				{error && (
					<DuoCard variant="orange" size="sm" className="mb-4">
						<p className="text-sm text-duo-text">{error}</p>
					</DuoCard>
				)}

				{/* Campo de busca */}
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-duo-gray-dark" />
					<Input
						ref={inputRef}
						placeholder="Buscar aluno pelo nome..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Lista de membros */}
				<div className="max-h-64 space-y-2 overflow-y-auto">
					{isLoading && (
						<div className="flex items-center justify-center gap-2 py-4 text-sm text-duo-gray-dark">
							<Loader2 className="h-4 w-4 animate-spin" />
							Buscando...
						</div>
					)}
					{!isLoading && search.length >= 2 && members.length === 0 && (
						<p className="py-4 text-center text-sm text-duo-gray-dark">
							Nenhum aluno ativo encontrado
						</p>
					)}
					{!isLoading && search.length < 2 && (
						<p className="py-3 text-center text-sm text-duo-gray-dark">
							Digite pelo menos 2 caracteres para buscar
						</p>
					)}
					{members.map((member) => (
						<DuoCard key={member.id} variant="default" size="sm">
							<div className="flex items-center justify-between gap-3">
								<div className="flex min-w-0 items-center gap-2">
									{member.avatar ? (
										<div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full">
											<Image
												src={member.avatar}
												alt={member.name}
												fill
												className="object-cover"
											/>
										</div>
									) : (
										<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-duo-green/15 text-sm font-bold text-duo-green">
											{member.name.charAt(0).toUpperCase()}
										</div>
									)}
									<p className="truncate font-bold text-sm text-duo-text">
										{member.name}
									</p>
								</div>
								<Button
									size="sm"
									onClick={() => handleCheckIn(member.id, member.name)}
									disabled={checking === member.id || !!success}
									className="flex-shrink-0"
								>
									{checking === member.id ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<>
											<LogIn className="mr-1 h-3 w-3" />
											Check-in
										</>
									)}
								</Button>
							</div>
						</DuoCard>
					))}
				</div>
			</DuoCard>
		</div>
	);
}
