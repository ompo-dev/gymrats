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
      const previouslyInactive = gyms.filter(g => !g.isActive).map(g => g.id);
      await db.gym.updateMany({
        where: { userId },
        data: { isActive: true }
      });
      // Reaplicar benefício Enterprise só nas academias que estavam inativas e voltaram a ativas
      for (const gymId of previouslyInactive) {
        await this.syncAllStudentsEnterpriseBenefit(gymId);
      }
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

    const gymIdsToInactivate = gyms.filter(g => g.id !== gymToKeepId).map(g => g.id);

    // Inativar todas as outras
    await db.gym.updateMany({
      where: {
        userId,
        id: { not: gymToKeepId },
        isActive: true
      },
      data: { isActive: false }
    });

    // Alunos das academias inativadas perdem Premium dessa academia; se tiverem outra Enterprise ativa, mantêm
    for (const gymId of gymIdsToInactivate) {
      await this.syncAllStudentsEnterpriseBenefit(gymId);
    }

    // Garantir que a escolhida está ativa
    await db.gym.update({
        where: { id: gymToKeepId },
        data: { isActive: true }
    });
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
   * Quando a academia principal volta a assinar (ex.: Premium de novo), restaura as assinaturas
   * das outras academias que foram canceladas "por causa da principal", desde que o período
   * original (currentPeriodEnd) não tenha expirado. Em seguida reaplica limites de gyms ativas
   * e benefício Premium dos alunos.
   */
  static async restoreSubscriptionsSuspendedByPrincipalCancel(userId: string) {
    const now = new Date();
    const subsToRestore = await db.gymSubscription.findMany({
      where: {
        gym: { userId },
        status: "canceled",
        canceledBecausePrincipalCanceled: true,
        currentPeriodEnd: { gt: now },
      },
      select: { id: true, gymId: true },
    });

    if (subsToRestore.length === 0) return;

    for (const sub of subsToRestore) {
      await db.gymSubscription.update({
        where: { id: sub.id },
        data: {
          status: "active",
          canceledAt: null,
          cancelAtPeriodEnd: false,
          canceledBecausePrincipalCanceled: null,
        },
      });
    }

    await this.enforceActiveGymLimit(userId);
  }

  /**
   * Sincroniza o benefício de plano Premium (gratuito) para alunos de academia Enterprise.
   * - Com Enterprise: aluno passa a usar Premium da academia (substitui até OWN pago).
   *   Se tinha OWN Premium com período futuro, guardamos em ownPeriodEndBackup para restaurar ao sair.
   * - Ao sair da academia Enterprise: se existir ownPeriodEndBackup futura, restaura Premium OWN até essa data.
   */
  static async syncStudentEnterpriseBenefit(studentId: string) {
    const enterpriseMemberships = await db.gymMembership.findMany({
      where: {
        studentId,
        status: "active",
        gym: {
          isActive: true,
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

    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (hasEnterpriseBenefit) {
      const mainGymId = enterpriseMemberships[0].gymId;

      // Guardar fim do período OWN se o aluno tinha Premium próprio (para restaurar ao sair)
      const hadOwnPremium =
        currentSub?.source === "OWN" &&
        currentSub.plan.toLowerCase().includes("premium") &&
        new Date(currentSub.currentPeriodEnd) > now;
      const ownPeriodEndBackup = hadOwnPremium ? currentSub!.currentPeriodEnd : undefined;

      await db.subscription.upsert({
        where: { studentId },
        create: {
          studentId,
          plan: "premium",
          status: "active",
          source: "GYM_ENTERPRISE",
          enterpriseGymId: mainGymId,
          currentPeriodStart: now,
          currentPeriodEnd: oneYearFromNow,
          ...(ownPeriodEndBackup && { ownPeriodEndBackup: ownPeriodEndBackup })
        },
        update: {
          plan: "premium",
          status: "active",
          source: "GYM_ENTERPRISE",
          enterpriseGymId: mainGymId,
          ...(ownPeriodEndBackup != null && { ownPeriodEndBackup: ownPeriodEndBackup })
        }
      });
    } else {
      if (currentSub?.source === "GYM_ENTERPRISE") {
        const sub = currentSub as typeof currentSub & { ownPeriodEndBackup?: Date | null };
        const backupEnd = sub.ownPeriodEndBackup ? new Date(sub.ownPeriodEndBackup) : null;
        const hasValidOwnBackup = backupEnd && backupEnd > now;

        if (hasValidOwnBackup) {
          await db.subscription.update({
            where: { id: currentSub.id },
            data: {
              plan: "premium",
              status: "active",
              source: "OWN",
              enterpriseGymId: null,
              currentPeriodStart: now,
              currentPeriodEnd: backupEnd,
              ownPeriodEndBackup: null
            }
          });
        } else {
          await db.subscription.update({
            where: { id: currentSub.id },
            data: {
              plan: "free",
              status: "inactive",
              source: "OWN",
              enterpriseGymId: null,
              currentPeriodStart: now,
              currentPeriodEnd: now,
              ownPeriodEndBackup: null
            }
          });
        }
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
