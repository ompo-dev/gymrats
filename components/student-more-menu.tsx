"use client";

import { Heart, BookOpen, MapPin, Wallet, LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { useQueryState } from "nuqs";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";

interface MoreMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: "duo-red" | "duo-green" | "duo-blue" | "duo-purple";
}

const moreMenuItems: MoreMenuItem[] = [
  {
    id: "cardio",
    icon: Heart,
    label: "Cardio e Funcional",
    description: "Corrida, natação, exercícios funcionais",
    color: "duo-red",
  },
  {
    id: "education",
    icon: BookOpen,
    label: "Aprender",
    description: "Anatomia, lições e quizzes",
    color: "duo-green",
  },
  {
    id: "gyms",
    icon: MapPin,
    label: "Academias",
    description: "Encontre academias parceiras",
    color: "duo-blue",
  },
  {
    id: "payments",
    icon: Wallet,
    label: "Pagamentos",
    description: "Assinaturas e histórico",
    color: "duo-purple",
  },
];

export function StudentMoreMenu() {
  const [, setTab] = useQueryState("tab");

  const handleItemClick = async (itemId: string) => {
    await setTab(itemId);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Mais</h1>
          <p className="text-sm text-duo-gray-dark">
            Acesse todas as funcionalidades
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="grid gap-4">
          {moreMenuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <NavigationButtonCard
                icon={item.icon}
                title={item.label}
                description={item.description}
                color={item.color}
                onClick={() => handleItemClick(item.id)}
              />
            </motion.div>
          ))}
        </div>
      </SlideIn>
    </div>
  );
}
