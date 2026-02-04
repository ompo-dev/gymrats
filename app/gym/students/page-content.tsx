"use client";

import { Flame, Search, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StudentData } from "@/lib/types";

interface GymStudentsPageProps {
	students: StudentData[];
}

export default function GymStudentsPage({ students }: GymStudentsPageProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "inactive"
	>("all");

	const filteredStudents = students.filter((student) => {
		const matchesSearch =
			student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			student.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || student.membershipStatus === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const getStreakColor = (streak: number) => {
		if (streak >= 20) return "text-[#FF9600]";
		if (streak >= 10) return "text-[#58CC02]";
		return "text-gray-600";
	};

	const getAttendanceColor = (rate: number) => {
		if (rate >= 90) return "bg-[#58CC02]";
		if (rate >= 70) return "bg-[#1CB0F6]";
		if (rate >= 50) return "bg-[#FF9600]";
		return "bg-red-500";
	};

	return (
		<div className="p-4 md:p-8">
			<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-black text-gray-900 md:text-4xl">
						Gestão de Alunos
					</h1>
					<p className="text-sm text-gray-600 md:text-lg">
						{filteredStudents.length} aluno
						{filteredStudents.length !== 1 ? "s" : ""} encontrado
						{filteredStudents.length !== 1 ? "s" : ""}
					</p>
				</div>
				<Button className="h-12 gap-2 bg-[#58CC02] px-6 text-base font-bold hover:bg-[#47A302]">
					<UserPlus className="h-5 w-5" />
					Novo Aluno
				</Button>
			</div>

			<Card className="mb-6 border-2 p-4 md:p-6">
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Buscar por nome ou email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-12 pl-10 text-base"
						/>
					</div>
					<div className="flex gap-2">
						<Button
							variant={statusFilter === "all" ? "default" : "outline"}
							onClick={() => setStatusFilter("all")}
							className="h-12 flex-1 font-bold md:flex-initial"
						>
							Todos
						</Button>
						<Button
							variant={statusFilter === "active" ? "default" : "outline"}
							onClick={() => setStatusFilter("active")}
							className="h-12 flex-1 font-bold md:flex-initial"
						>
							Ativos
						</Button>
						<Button
							variant={statusFilter === "inactive" ? "default" : "outline"}
							onClick={() => setStatusFilter("inactive")}
							className="h-12 flex-1 font-bold md:flex-initial"
						>
							Inativos
						</Button>
					</div>
				</div>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredStudents.map((student) => (
					<Link key={student.id} href={`/gym/students/${student.id}`}>
						<Card className="group cursor-pointer border-2 p-6 transition-all hover:border-[#58CC02] hover:shadow-lg">
							<div className="mb-4 flex items-start gap-4">
								<div className="relative h-16 w-16 overflow-hidden rounded-full">
									<Image
										src={student.avatar || "/placeholder.svg"}
										alt={student.name}
										fill
										className="object-cover"
									/>
								</div>
								<div className="flex-1">
									<h3 className="text-xl font-bold text-gray-900 group-hover:text-[#58CC02]">
										{student.name}
									</h3>
									<p className="text-sm text-gray-600">{student.email}</p>
									<div className="mt-1 flex items-center gap-2">
										<span
											className={`rounded-full px-2 py-1 text-xs font-bold ${
												student.membershipStatus === "active"
													? "bg-[#58CC02] text-white"
													: "bg-gray-300 text-gray-700"
											}`}
										>
											{student.membershipStatus === "active"
												? "Ativo"
												: "Inativo"}
										</span>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between rounded-xl border-2 p-3">
									<div className="flex items-center gap-2">
										<Flame
											className={`h-5 w-5 ${getStreakColor(
												student.currentStreak,
											)} fill-current`}
										/>
										<span className="font-bold text-gray-700">Sequência</span>
									</div>
									<span
										className={`text-xl font-black ${getStreakColor(
											student.currentStreak,
										)}`}
									>
										{student.currentStreak} dias
									</span>
								</div>

								<div className="rounded-xl border-2 p-3">
									<div className="mb-2 flex items-center justify-between">
										<span className="font-bold text-gray-700">Frequência</span>
										<span className="text-xl font-black text-gray-900">
											{student.attendanceRate}%
										</span>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-gray-200">
										<div
											className={`h-full ${getAttendanceColor(
												student.attendanceRate,
											)} transition-all`}
											style={{ width: `${student.attendanceRate}%` }}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-xl bg-[#1CB0F6]/10 p-3 text-center">
										<p className="text-2xl font-black text-[#1CB0F6]">
											{student.totalVisits}
										</p>
										<p className="text-xs font-bold text-gray-600">Treinos</p>
									</div>
									<div className="rounded-xl bg-[#CE82FF]/10 p-3 text-center">
										<p className="text-2xl font-black text-[#CE82FF]">
											{student.currentWeight}kg
										</p>
										<p className="text-xs font-bold text-gray-600">Peso</p>
									</div>
								</div>
							</div>

							{student.assignedTrainer && (
								<div className="mt-4 rounded-xl bg-gray-100 p-2 text-center">
									<p className="text-xs font-bold text-gray-600">
										Personal:{" "}
										<span className="text-gray-900">
											{student.assignedTrainer}
										</span>
									</p>
								</div>
							)}
						</Card>
					</Link>
				))}
			</div>

			{filteredStudents.length === 0 && (
				<Card className="border-2 p-12 text-center">
					<p className="text-xl font-bold text-gray-500">
						Nenhum aluno encontrado
					</p>
					<p className="text-gray-400">Tente ajustar os filtros de busca</p>
				</Card>
			)}
		</div>
	);
}
