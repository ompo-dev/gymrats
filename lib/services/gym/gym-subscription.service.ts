import { db } from "@/lib/db";

export class GymSubscriptionService {
  /**
   * Garante que um usuário com plano Basic tenha apenas 1 academia ativa.
   * Inativa as demais seguindo os critérios:
   * 1. Mantém a activeGymId se as outras estiverem inativas.
   * 2. Se houver múltiplas ativas, mantém a mais antiga (createdAt asc).
   */
  static async enforceActiveGymLimit(userId: string) {
    const gyms = await db.gym.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    if (gyms.length === 0) return;

    const hasQualifiedSubscription = await this.hasQualifiedSubscription(gyms.map(g => g.id));

    // Se tem plano Premium/Enterprise, reativar TODAS as academias (ex.: usuário voltou ao plano)
    if (hasQualifiedSubscription) {
      await db.gym.updateMany({
        where: { userId },
        data: { isActive: true }
      });
      return;
    }

    if (gyms.length <= 1) return;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { activeGymId: true }
    });

    // Se chegou aqui, o usuário está no plano Basic/Free e tem > 1 gym.
    // Critério: manter a activeGymId ou a mais antiga.
    let gymToKeepId = user?.activeGymId || gyms[0].id;
    
    // Se a activeGymId não estiver na lista (improvável), usa a primeira.
    if (!gyms.some(g => g.id === gymToKeepId)) {
        gymToKeepId = gyms[0].id;
    }

    // Inativar todas as outras
    await db.gym.updateMany({
      where: {
        userId,
        id: { not: gymToKeepId },
        isActive: true
      },
      data: { isActive: false }
    });
    
    // Garantir que a escolhida está ativa
    await db.gym.update({
        where: { id: gymToKeepId },
        data: { isActive: true }
    });

    // Se a academia que foi inativada era a activeGymId, atualizar o usuário? 
    // Na verdade, tentamos manter a activeGymId ativa acima.
  }

  /**
   * Verifica se o conjunto de academias possui alguma assinatura Premium ou Enterprise ativa.
   */
  private static async hasQualifiedSubscription(gymIds: string[]): Promise<boolean> {
    const subs = await db.gymSubscription.findMany({
      where: {
        gymId: { in: gymIds },
        status: "active"
      }
    });

    return subs.some(s => 
      s.plan.toLowerCase().includes("premium") || 
      s.plan.toLowerCase().includes("enterprise")
    );
  }

  /**
   * Processa o downgrade de uma assinatura de academia.
   */
  static async handleGymDowngrade(gymId: string) {
    const gym = await db.gym.findUnique({
      where: { id: gymId },
      select: { userId: true }
    });

    if (!gym) return;

    await this.enforceActiveGymLimit(gym.userId);
    
    // Se a academia deixou de ser enterprise, atualizar alunos
    await this.syncAllStudentsEnterpriseBenefit(gymId);
  }

  /**
   * Sincroniza o benefício de plano Basic para um aluno específico.
   * Chamado quando o aluno entra em uma academia ou quando o status de uma academia muda.
   */
  static async syncStudentEnterpriseBenefit(studentId: string) {
    // 1. Encontrar todas as academias Enterprise ativas que o aluno frequenta
    const enterpriseMemberships = await db.gymMembership.findMany({
      where: {
        studentId,
        status: "active",
        gym: {
          subscription: {
            plan: "enterprise",
            status: "active"
          }
        }
      },
      include: { gym: { include: { subscription: true } } }
    });

    const hasEnterpriseBenefit = enterpriseMemberships.length > 0;
    const currentSub = await db.subscription.findUnique({
      where: { studentId }
    });

    // Regra: Plano Próprio PREMIUM sempre tem prioridade
    if (currentSub?.source === "OWN" && currentSub.plan.toLowerCase().includes("premium") && currentSub.status === "active") {
      return;
    }

    if (hasEnterpriseBenefit) {
      const mainGymId = enterpriseMemberships[0].gymId;
      
      // Se não tem assinatura ou se a atual é free/basic, garantir que seja Basic via Enterprise
      if (!currentSub || currentSub.plan === "free" || currentSub.source === "GYM_ENTERPRISE") {
        await db.subscription.upsert({
          where: { studentId },
          create: {
            studentId,
            plan: "basic",
            status: "active",
            source: "GYM_ENTERPRISE",
            enterpriseGymId: mainGymId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          update: {
            plan: "basic",
            status: "active",
            source: "GYM_ENTERPRISE",
            enterpriseGymId: mainGymId
          }
        });
      }
    } else {
      // Se tinha benefício enterprise e não tem mais nenhuma academia enterprise ativa
      if (currentSub?.source === "GYM_ENTERPRISE") {
        await db.subscription.update({
          where: { id: currentSub.id },
          data: {
            plan: "free",
            status: "inactive",
            source: "OWN",
            enterpriseGymId: null
          }
        });
      }
    }
  }

  /**
   * Sincroniza benefícios para todos os alunos de uma academia.
   * Chamado quando a assinatura da academia muda.
   */
  static async syncAllStudentsEnterpriseBenefit(gymId: string) {
     const memberships = await db.gymMembership.findMany({
       where: { gymId, status: "active" },
       select: { studentId: true }
     });

     for (const m of memberships) {
       await this.syncStudentEnterpriseBenefit(m.studentId);
     }
  }
}
