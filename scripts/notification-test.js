// Script de Teste de Notificação - Copie e cole no console do navegador
// IMPORTANTE: Se aparecer aviso, digite "allow pasting" e pressione Enter primeiro

(async () => {
	console.log("🔍 DIAGNÓSTICO COMPLETO DE NOTIFICAÇÕES");
	console.log("==========================================");

	// 1. Verificar suporte básico
	console.log("\n1️⃣ Verificando suporte básico...");
	if (!("Notification" in window)) {
		console.error("❌ Navegador não suporta notificações");
		return;
	}
	console.log("✅ API Notification disponível");

	// 2. Verificar Service Worker
	console.log("\n2️⃣ Verificando Service Worker...");
	if ("serviceWorker" in navigator) {
		try {
			// Verificar se há registros primeiro
			const registrations = await navigator.serviceWorker.getRegistrations();
			if (registrations.length === 0) {
				console.log("ℹ️ Nenhum Service Worker registrado");
			} else {
				console.log(
					`ℹ️ ${registrations.length} Service Worker(s) registrado(s)`,
				);
				// Tentar obter o ready com timeout
				const readyPromise = navigator.serviceWorker.ready;
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Timeout")), 1000),
				);

				try {
					const registration = await Promise.race([
						readyPromise,
						timeoutPromise,
					]);
					console.log(
						"✅ Service Worker ativo:",
						registration.active?.scriptURL,
					);
					console.log(
						"⚠️ ATENÇÃO: Service Worker pode estar interceptando notificações!",
					);
				} catch (_e) {
					console.log("ℹ️ Service Worker registrado mas não está pronto ainda");
				}
			}
		} catch (e) {
			console.log("ℹ️ Erro ao verificar Service Worker:", e.message);
		}
	} else {
		console.log("ℹ️ Service Worker não suportado");
	}

	// 3. Verificar permissão
	console.log("\n3️⃣ Verificando permissão...");
	let permission = Notification.permission;
	console.log("📊 Status atual:", permission);

	if (permission === "denied") {
		console.error("❌ Permissão negada anteriormente");
		console.log("💡 Para reativar:");
		console.log("   1. Clique no ícone de cadeado 🔒 na barra de endereço");
		console.log("   2. Procure por 'Notificações'");
		console.log("   3. Altere para 'Permitir'");
		console.log("   4. Recarregue a página e tente novamente");
		return;
	}

	if (permission === "default") {
		console.log("📱 Solicitando permissão...");
		permission = await Notification.requestPermission();
		console.log("📊 Nova permissão:", permission);
	}

	if (permission !== "granted") {
		console.error("❌ Permissão não concedida");
		return;
	}

	// 4. Testar criação de notificação
	console.log("\n4️⃣ Testando criação de notificação...");

	try {
		// Teste 1: Notificação simples sem ícone
		console.log("\n📝 Teste 1: Notificação simples (sem ícone)...");
		const notification1 = new Notification("TESTE SIMPLES", {
			body: "Esta é uma notificação de teste básica",
			tag: `test-simple-${Date.now()}`,
			requireInteraction: true,
		});

		console.log("✅ Notificação 1 criada");
		notification1.onshow = () => console.log("👁️ Notificação 1 EXIBIDA!");
		notification1.onerror = (e) =>
			console.error("❌ Erro na notificação 1:", e);

		// Aguardar 2 segundos antes do próximo teste
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Teste 2: Notificação com ícone
		console.log("\n📝 Teste 2: Notificação com ícone...");
		const iconUrl = `${window.location.origin}/icon-192.png`;
		console.log("🔗 URL do ícone:", iconUrl);

		// Verificar se ícone existe
		try {
			const iconCheck = await fetch(iconUrl, { method: "HEAD" });
			console.log("📊 Ícone existe?", iconCheck.ok ? "✅ Sim" : "❌ Não");
		} catch (e) {
			console.log("⚠️ Não foi possível verificar ícone:", e.message);
		}

		const notification2 = new Notification("🧪 Teste - GymRats", {
			body: "Notificação de teste funcionando! Se você está vendo isso, funcionou!",
			icon: iconUrl,
			badge: iconUrl,
			tag: `test-full-${Date.now()}`,
			requireInteraction: true,
			silent: false,
		});

		console.log("✅ Notificação 2 criada");
		notification2.onshow = () => console.log("👁️ Notificação 2 EXIBIDA!");
		notification2.onerror = (e) =>
			console.error("❌ Erro na notificação 2:", e);

		// Usar notification2 como principal
		const notification = notification2;

		console.log("\n5️⃣ Verificando notificação criada...");
		console.log("📋 Detalhes:", {
			title: notification.title,
			body: notification.body,
			tag: notification.tag,
			icon: notification.icon,
		});

		// Verificar se notificação foi realmente criada
		if (!notification) {
			console.error("❌ Notificação não foi criada");
			return;
		}

		console.log("✅ Objeto Notification criado com sucesso");

		// Event listeners
		notification.onclick = () => {
			console.log("👆 Notificação clicada!");
			window.focus();
			notification.close();
		};

		notification.onshow = () => {
			console.log("👁️ Notificação exibida!");
		};

		notification.onerror = (error) => {
			console.error("❌ Erro na notificação:", error);
		};

		notification.onclose = () => {
			console.log("🔒 Notificação fechada");
		};

		// Manter notificação aberta por mais tempo (30 segundos) para garantir que seja vista
		setTimeout(() => {
			if (notification) {
				notification.close();
				console.log("⏰ Notificação fechada automaticamente após 30s");
			}
		}, 30000);

		// 6. Testar via Service Worker (mais confiável no Opera)
		console.log("\n6️⃣ Testando via Service Worker (MÉTODO ALTERNATIVO)...");
		console.log("💡 Este método é mais confiável no Opera!");

		if ("serviceWorker" in navigator) {
			try {
				// Tentar registrar um SW temporário simples se não houver
				let registration = null;
				const existingRegs = await navigator.serviceWorker.getRegistrations();

				if (existingRegs.length > 0) {
					console.log("ℹ️ Usando Service Worker existente...");
					const readyPromise = navigator.serviceWorker.ready;
					const timeoutPromise = new Promise((_, reject) =>
						setTimeout(() => reject(new Error("Timeout")), 2000),
					);
					registration = await Promise.race([readyPromise, timeoutPromise]);
				} else {
					console.log("📝 Criando Service Worker temporário para teste...");
					// Criar um SW inline simples
					const swCode = `
            self.addEventListener('install', () => self.skipWaiting());
            self.addEventListener('activate', () => self.clients.claim());
            self.addEventListener('message', async (event) => {
              if (event.data.type === 'SHOW_NOTIFICATION') {
                await self.registration.showNotification(event.data.title, event.data.options);
              }
            });
          `;
					const blob = new Blob([swCode], { type: "application/javascript" });
					const swUrl = URL.createObjectURL(blob);

					try {
						registration = await navigator.serviceWorker.register(swUrl);
						await registration.update();
						await new Promise((resolve) => setTimeout(resolve, 500));
						console.log("✅ Service Worker temporário criado");
					} catch (e) {
						console.log("⚠️ Não foi possível criar SW temporário:", e.message);
					}
				}

				if (registration?.active) {
					console.log("📤 Enviando notificação via Service Worker...");
					registration.active.postMessage({
						type: "SHOW_NOTIFICATION",
						title: "🔔 Teste via SW - GymRats",
						options: {
							body: "Esta notificação foi enviada via Service Worker (mais confiável no Opera!)",
							icon: `${window.location.origin}/icon-192.png`,
							badge: `${window.location.origin}/icon-192.png`,
							tag: `test-sw-${Date.now()}`,
							requireInteraction: true,
							data: { url: window.location.href },
						},
					});
					console.log("✅ Comando enviado ao Service Worker");
					console.log("💡 Notificações via SW são mais confiáveis no Opera!");

					// Também tentar usar registration.showNotification diretamente
					try {
						await registration.showNotification(
							"🔔 Teste Direto SW - GymRats",
							{
								body: "Esta notificação foi criada diretamente via registration.showNotification()",
								icon: `${window.location.origin}/icon-192.png`,
								badge: `${window.location.origin}/icon-192.png`,
								tag: `test-direct-sw-${Date.now()}`,
								requireInteraction: true,
								data: { url: window.location.href },
							},
						);
						console.log(
							"✅ Notificação criada diretamente via registration.showNotification()",
						);
					} catch (e) {
						console.log("⚠️ Erro ao criar notificação direta:", e.message);
					}
				} else {
					console.log("ℹ️ Service Worker não está ativo");
				}
			} catch (e) {
				console.log("⚠️ Erro ao usar Service Worker:", e.message);
			}
		} else {
			console.log("ℹ️ Service Worker não suportado");
		}

		console.log("\n7️⃣ RESULTADO FINAL:");
		console.log("==========================================");
		console.log("✅ Notificações criadas com sucesso!");
		console.log("");
		console.log("🔍 SE NÃO APARECERAM, VERIFIQUE:");
		console.log("");
		console.log("📱 WINDOWS - Configurações do Sistema:");
		console.log("   1. Win + I → Sistema → Notificações");
		console.log("   2. Certifique-se que 'Notificações' está ATIVADO");
		console.log(
			"   3. Verifique se seu navegador está na lista de apps permitidos",
		);
		console.log("   4. Desative 'Modo Foco' ou 'Não perturbe'");
		console.log("   5. Verifique 'Centro de Ações' (canto inferior direito)");
		console.log("");
		console.log("🌐 NAVEGADOR:");
		console.log("   1. Verifique se não está em modo 'Não perturbe'");
		console.log("   2. Tente focar na aba do navegador (clique nela)");
		console.log("   3. Alguns navegadores só mostram quando a aba está ativa");
		console.log("");
		console.log("🔧 SERVICE WORKER (POSSÍVEL CAUSA):");
		console.log("   O Service Worker pode estar interferindo!");
		console.log("   Para testar sem SW, execute no console:");
		console.log(
			"   navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))",
		);
		console.log("   Depois recarregue a página e teste novamente");
		console.log("");
		console.log("💡 DICAS ADICIONAIS:");
		console.log("   - Olhe no canto inferior direito da tela");
		console.log("   - Verifique o histórico de notificações do Windows");
		console.log("   - Tente em uma janela anônima/privada");
		console.log("   - Verifique se o Windows não está em modo 'Não perturbe'");
		console.log("");
		console.log("🎭 OPERA - PROBLEMA CONHECIDO:");
		console.log(
			"   O Opera pode não mostrar notificações de 'new Notification()'",
		);
		console.log("   em localhost, mesmo com permissão concedida.");
		console.log("   ✅ SOLUÇÃO: Use notificações via Service Worker (teste 6)");
		console.log("   ✅ Ou teste em produção (não localhost)");
		console.log("   ✅ Ou use outro navegador (Chrome, Edge, Firefox)");
	} catch (error) {
		console.error("❌ Erro ao criar notificação:", error);
		console.error("Stack:", error.stack);
	}
})();

// ============================================
// INSTRUÇÕES:
// ============================================
// 1. Abra o console (F12)
// 2. Se aparecer aviso, digite: allow pasting
// 3. Pressione Enter
// 4. Cole este código completo
// 5. Pressione Enter novamente
