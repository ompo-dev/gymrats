import {
  BarChart3,
  BookOpen,
  Crown,
  MapPin,
  Palette,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import type { StudentMoreMenuScreenProps } from "./student-more-menu.screen";

export function createStudentMoreMenuFixture(
  overrides: Partial<StudentMoreMenuScreenProps> = {},
): StudentMoreMenuScreenProps {
  return {
    items: [
      {
        id: "gyms",
        icon: MapPin,
        label: "Academias",
        description: "Encontre academias parceiras",
        color: "duo-blue",
      },
      {
        id: "personals",
        icon: Users,
        label: "Personais",
        description: "Encontre personais próximos ou remotos",
        color: "duo-purple",
      },
      {
        id: "payments",
        icon: Wallet,
        label: "Pagamentos",
        description: "Assinaturas e histórico",
        color: "duo-purple",
      },
      {
        id: "subscription",
        icon: Crown,
        label: "Assinatura Premium",
        description: "Gerencie sua assinatura",
        color: "duo-yellow",
      },
      {
        id: "home",
        icon: BarChart3,
        label: "Estatísticas",
        description: "Resumo e evolução",
        color: "duo-blue",
      },
      {
        id: "profile",
        icon: Settings,
        label: "Configurações",
        description: "Perfil e preferências",
        color: "duo-green",
      },
      {
        id: "education",
        icon: BookOpen,
        label: "Aprender",
        description: "Anatomia, lições e quizzes",
        color: "duo-purple",
      },
      {
        id: "theme-test",
        icon: Palette,
        label: "Teste de Tema",
        description: "Tabs, cards, stats e color picker",
        color: "duo-yellow",
        href: "/student/theme-test",
      },
    ],
    ...overrides,
  };
}
