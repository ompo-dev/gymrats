const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
	try {
		// Atualizar usuário maicon@gmail.com para ADMIN
		const user = await prisma.user.update({
			where: { email: "maicon@gmail.com" },
			data: {
				role: "ADMIN",
			},
		});

		console.log("✅ Usuário atualizado para ADMIN:", user.email);

		// Garantir que tenha perfil de gym
		let gym = await prisma.gym.findUnique({
			where: { userId: user.id },
		});

		if (!gym) {
			gym = await prisma.gym.create({
				data: {
					userId: user.id,
					name: user.name,
					address: "",
					phone: "",
					email: user.email,
					plan: "basic",
				},
			});
			console.log("✅ Perfil de gym criado para o admin");
		} else {
			console.log("✅ Perfil de gym já existe");
		}

		// Garantir que tenha perfil de student
		let student = await prisma.student.findUnique({
			where: { userId: user.id },
		});

		if (!student) {
			student = await prisma.student.create({
				data: {
					userId: user.id,
				},
			});
			console.log("✅ Perfil de student criado para o admin");
		} else {
			console.log("✅ Perfil de student já existe");
		}

		console.log("\n✅ Configuração concluída!");
		console.log(
			"O usuário",
			user.email,
			"agora é ADMIN e tem acesso a ambos os perfis.",
		);
	} catch (error) {
		console.error("❌ Erro:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
