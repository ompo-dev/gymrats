import nodemailer from "nodemailer";

// Configuração do transporter usando Gmail com senha de aplicativo
// Nota: Para usar OAuth2, seria necessário configurar refresh tokens
// Por enquanto, usando senha de aplicativo do Google
const createTransporter = () => {
	return nodemailer.createTransport({
		service: "gmail",
		host: "smtp.gmail.com",
		port: 587,
		secure: false, // true para 465, false para outras portas
		auth: {
			user: process.env.EMAIL_USER || "gym.rats.workout@gmail.com",
			pass:
				process.env.EMAIL_PASSWORD || "K@r@lh0@4K@r@lh0@4K@r@lh0@4K@r@lh0@4",
		},
	});
};

interface SendWelcomeEmailParams {
	to: string;
	name: string;
}

export async function sendWelcomeEmail({
	to,
	name,
}: SendWelcomeEmailParams): Promise<void> {
	try {
		const transporter = createTransporter();

		const mailOptions = {
			from: '"Gym Rats" <gym.rats.workout@gmail.com>',
			to,
			subject: "🎉 Bem-vindo ao Gym Rats!",
			html: getWelcomeEmailTemplate(name),
		};

		await transporter.sendMail(mailOptions);
		console.log(`Email de boas-vindas enviado para ${to}`);
	} catch (error) {
		console.error("Erro ao enviar email de boas-vindas:", error);
		// Não lançar erro para não interromper o fluxo de registro
		// O email é opcional
	}
}

function getWelcomeEmailTemplate(userName: string): string {
	// Pegar apenas o primeiro nome
	const firstName = userName.split(" ")[0];

	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Gym Rats!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F9FAFB; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Container Principal - Baseado no DuoCard -->
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; border: 2px solid #D1D5DB; box-shadow: 0 4px 0 #D1D5DB; overflow: hidden;">
                    <!-- Header com gradiente verde -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #58CC02 0%, #47A302 100%); padding: 40px 24px; text-align: center;">
                            <div style="background-color: #FFFFFF; width: 110px; height: 110px; border-radius: 24px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                <img src="${
																	process.env.NEXT_PUBLIC_APP_URL ||
																	"https://gym-rats-testes.vercel.app"
																}/icon-512.png" alt="Gym Rats Logo" width="56" height="56" style="display: block; width: 56px; height: 56px; margin: 0 auto;" />
                            </div>
                            <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                Bem-vindo, ${firstName}!
                            </h1>
                            <p style="margin: 12px 0 0; color: #FFFFFF; font-size: 18px; opacity: 0.95;">
                                Sua jornada fitness começa agora
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Conteúdo Principal -->
                    <tr>
                        <td style="padding: 40px 24px;">
                            <!-- Card de Boas-vindas - Estilo DuoCard -->
                            <div style="background-color: #FFFFFF; border-radius: 16px; border: 2px solid #D1D5DB; box-shadow: 0 4px 0 #D1D5DB; padding: 32px; margin-bottom: 24px;">
                                <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: bold;">
                                    🎉 Parabéns por se juntar ao Gym Rats!
                                </h2>
                                <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                                    Estamos muito felizes em ter você conosco! O Gym Rats foi criado para transformar sua experiência na academia, oferecendo treinos personalizados, acompanhamento nutricional e muito mais.
                                </p>
                            </div>

                            <!-- Botão CTA Principal - Estilo Button -->
                            <table role="presentation" style="width: 100%; margin: 0 0 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="${
																					process.env.NEXT_PUBLIC_APP_URL ||
																					"https://gym-rats-testes.vercel.app"
																				}/student" 
                                           style="display: inline-block; background-color: #58CC02; color: #FFFFFF; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 16px 32px; border-radius: 16px; box-shadow: 0 4px 0 #58A700; font-size: 13.2px; line-height: 18px;">
                                            Começar minha jornada
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Cards de Ações Rápidas - Estilo DuoCard -->
                            <div style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: bold; text-align: center;">
                                    Explore nossas funcionalidades
                                </h3>
                                
                                <!-- Grid de Cards -->
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <!-- Card Treino -->
                                        <td style="padding: 8px; vertical-align: top; width: 50%;">
                                            <a href="${
																							process.env.NEXT_PUBLIC_APP_URL ||
																							"https://gym-rats-testes.vercel.app"
																						}/student?tab=learn" 
                                               style="display: block; background-color: #FFFFFF; border-radius: 12px; border: 2px solid #D1D5DB; box-shadow: 0 2px 0 #D1D5DB; padding: 20px; text-decoration: none; text-align: center; transition: all 0.2s;">
                                                <div style="font-size: 32px; margin-bottom: 12px;">💪</div>
                                                <h4 style="margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: bold;">
                                                    Iniciar Treino
                                                </h4>
                                                <p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.4;">
                                                    Comece seus treinos personalizados
                                                </p>
                                            </a>
                                        </td>
                                        
                                        <!-- Card Dieta -->
                                        <td style="padding: 8px; vertical-align: top; width: 50%;">
                                            <a href="${
																							process.env.NEXT_PUBLIC_APP_URL ||
																							"https://gym-rats-testes.vercel.app"
																						}/student?tab=diet" 
                                               style="display: block; background-color: #FFFFFF; border-radius: 12px; border: 2px solid #D1D5DB; box-shadow: 0 2px 0 #D1D5DB; padding: 20px; text-decoration: none; text-align: center; transition: all 0.2s;">
                                                <div style="font-size: 32px; margin-bottom: 12px;">🍎</div>
                                                <h4 style="margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: bold;">
                                                    Ajustar Alimentação
                                                </h4>
                                                <p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.4;">
                                                    Acompanhe sua nutrição diária
                                                </p>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <!-- Card Educação -->
                                        <td style="padding: 8px; vertical-align: top; width: 50%;">
                                            <a href="${
																							process.env.NEXT_PUBLIC_APP_URL ||
																							"https://gym-rats-testes.vercel.app"
																						}/student?tab=education" 
                                               style="display: block; background-color: #FFFFFF; border-radius: 12px; border: 2px solid #D1D5DB; box-shadow: 0 2px 0 #D1D5DB; padding: 20px; text-decoration: none; text-align: center; transition: all 0.2s;">
                                                <div style="font-size: 32px; margin-bottom: 12px;">📚</div>
                                                <h4 style="margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: bold;">
                                                    Aprender Mais
                                                </h4>
                                                <p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.4;">
                                                    Conteúdos educativos exclusivos
                                                </p>
                                            </a>
                                        </td>
                                        
                                        <!-- Card Perfil -->
                                        <td style="padding: 8px; vertical-align: top; width: 50%;">
                                            <a href="${
																							process.env.NEXT_PUBLIC_APP_URL ||
																							"https://gym-rats-testes.vercel.app"
																						}/student?tab=profile" 
                                               style="display: block; background-color: #FFFFFF; border-radius: 12px; border: 2px solid #D1D5DB; box-shadow: 0 2px 0 #D1D5DB; padding: 20px; text-decoration: none; text-align: center; transition: all 0.2s;">
                                                <div style="font-size: 32px; margin-bottom: 12px;">👤</div>
                                                <h4 style="margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: bold;">
                                                    Meu Perfil
                                                </h4>
                                                <p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.4;">
                                                    Veja seu progresso e estatísticas
                                                </p>
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Card Destacado - Estilo DuoCard highlighted -->
                            <div style="background-color: #E8F5E9; border-radius: 12px; border: 2px solid #58A700; box-shadow: 0 2px 0 #58A700; padding: 24px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 12px; color: #2E7D32; font-size: 20px; font-weight: bold;">
                                    ✨ Dicas para começar:
                                </h3>
                                <ul style="margin: 0; padding-left: 24px; color: #1B5E20; font-size: 15px; line-height: 2;">
                                    <li style="margin-bottom: 8px;">Complete seu perfil no onboarding</li>
                                    <li style="margin-bottom: 8px;">Inicie seu primeiro treino personalizado</li>
                                    <li style="margin-bottom: 8px;">Configure sua alimentação diária</li>
                                    <li style="margin-bottom: 8px;">Explore conteúdos educativos</li>
                                </ul>
                            </div>

                            <!-- Card Informativo -->
                            <div style="background-color: #F9FAFB; border-radius: 12px; border: 2px solid #E5E7EB; padding: 24px; margin-top: 24px;">
                                <h3 style="margin: 0 0 12px; color: #111827; font-size: 18px; font-weight: bold;">
                                    💪 Dica do dia
                                </h3>
                                <p style="margin: 0; color: #4B5563; font-size: 15px; line-height: 1.6;">
                                    Comece definindo seus objetivos no perfil. Isso nos ajuda a criar treinos personalizados que realmente fazem a diferença na sua evolução!
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center;">
                            <p style="margin: 0 0 12px; color: #6B7280; font-size: 14px;">
                                Precisa de ajuda? Estamos aqui para você!
                            </p>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                © ${new Date().getFullYear()} Gym Rats. Todos os direitos reservados.
                            </p>
                            <p style="margin: 12px 0 0; color: #9CA3AF; font-size: 12px;">
                                <a href="${
																	process.env.NEXT_PUBLIC_APP_URL ||
																	"https://gym-rats-testes.vercel.app"
																}" style="color: #1899D6; text-decoration: none;">Visite nosso site</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `;
}

interface SendResetPasswordEmailParams {
	to: string;
	name: string;
	code: string;
}

export async function sendResetPasswordEmail({
	to,
	name,
	code,
}: SendResetPasswordEmailParams): Promise<void> {
	try {
		const transporter = createTransporter();

		const mailOptions = {
			from: '"Gym Rats" <gym.rats.workout@gmail.com>',
			to,
			subject: "🔐 Código de recuperação de senha - Gym Rats",
			html: getResetPasswordEmailTemplate(name, code),
		};

		await transporter.sendMail(mailOptions);
		console.log(`Email de recuperação de senha enviado para ${to}`);
	} catch (error) {
		console.error("Erro ao enviar email de recuperação de senha:", error);
		throw error;
	}
}

function getResetPasswordEmailTemplate(userName: string, code: string): string {
	const firstName = userName.split(" ")[0];
	const appUrl =
		process.env.NEXT_PUBLIC_APP_URL || "https://gym-rats-testes.vercel.app";

	return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Gym Rats</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F9FAFB; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <!-- Container Principal -->
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; border: 2px solid #D1D5DB; box-shadow: 0 4px 0 #D1D5DB; overflow: hidden;">
                        <!-- Header com gradiente verde -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #58CC02 0%, #47A302 100%); padding: 40px 24px; text-align: center;">
                                <div style="background-color: #FFFFFF; width: 110px; height: 110px; border-radius: 24px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                    <img src="${appUrl}/icon-512.png" alt="Gym Rats Logo" width="56" height="56" style="display: block; width: 56px; height: 56px; margin: 0 auto;" />
                                </div>
                                <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    Recuperação de Senha
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Conteúdo Principal -->
                        <tr>
                            <td style="padding: 40px 24px;">
                                <!-- Card de Informação -->
                                <div style="background-color: #FFFFFF; border-radius: 16px; border: 2px solid #D1D5DB; box-shadow: 0 4px 0 #D1D5DB; padding: 32px; margin-bottom: 24px;">
                                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: bold;">
                                        Olá, ${firstName}!
                                    </h2>
                                    <p style="margin: 0 0 20px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                                        Recebemos uma solicitação para redefinir a senha da sua conta no Gym Rats. Use o código abaixo para continuar:
                                    </p>
                                    
                                    <!-- Código de Verificação -->
                                    <div style="background: linear-gradient(135deg, #58CC02 0%, #47A302 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                                        <p style="margin: 0 0 12px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                            Seu código de verificação
                                        </p>
                                        <p style="margin: 0; color: #FFFFFF; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            ${code}
                                        </p>
                                    </div>
                                    
                                    <p style="margin: 20px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                                        Este código expira em <strong>15 minutos</strong>. Se você não solicitou esta alteração, ignore este email.
                                    </p>
                                </div>

                                <!-- Card Informativo -->
                                <div style="background-color: #FEF3C7; border-radius: 12px; border: 2px solid #FBBF24; padding: 20px; margin-top: 24px;">
                                    <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                                        ⚠️ <strong>Dica de segurança:</strong> Nunca compartilhe este código com outras pessoas. O Gym Rats nunca solicitará seu código por telefone ou email não solicitado.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center;">
                                <p style="margin: 0 0 12px; color: #6B7280; font-size: 14px;">
                                    Precisa de ajuda? Estamos aqui para você!
                                </p>
                                <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                                    © ${new Date().getFullYear()} Gym Rats. Todos os direitos reservados.
                                </p>
                                <p style="margin: 12px 0 0; color: #9CA3AF; font-size: 12px;">
                                    <a href="${appUrl}" style="color: #1899D6; text-decoration: none;">Visite nosso site</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
}
