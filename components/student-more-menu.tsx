"use client"

import { Heart, BookOpen, MapPin, Wallet } from "lucide-react"
import { motion } from "motion/react"
import { FadeIn } from "@/components/animations/fade-in"
import { HoverScale } from "@/components/animations/hover-scale"
import { useQueryState } from "nuqs"

interface MoreMenuItem {
  id: string
  icon: typeof Heart
  label: string
  description: string
  color: string
  bgGradient: string
  borderColor: string
}

const moreMenuItems: MoreMenuItem[] = [
  {
    id: "cardio",
    icon: Heart,
    label: "Cardio e Funcional",
    description: "Corrida, natação, exercícios funcionais",
    color: "text-duo-red",
    bgGradient: "from-duo-red/10 to-duo-orange/10",
    borderColor: "border-duo-red",
  },
  {
    id: "education",
    icon: BookOpen,
    label: "Aprender",
    description: "Anatomia, lições e quizzes",
    color: "text-duo-green",
    bgGradient: "from-duo-green/10 to-duo-blue/10",
    borderColor: "border-duo-green",
  },
  {
    id: "gyms",
    icon: MapPin,
    label: "Academias",
    description: "Encontre academias parceiras",
    color: "text-duo-blue",
    bgGradient: "from-duo-blue/10 to-duo-purple/10",
    borderColor: "border-duo-blue",
  },
  {
    id: "payments",
    icon: Wallet,
    label: "Pagamentos",
    description: "Assinaturas e histórico",
    color: "text-duo-purple",
    bgGradient: "from-duo-purple/10 to-duo-blue/10",
    borderColor: "border-duo-purple",
  },
]

export function StudentMoreMenu() {
  const [, setTab] = useQueryState("tab")

  const handleItemClick = async (itemId: string) => {
    await setTab(itemId)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Mais</h1>
          <p className="text-sm text-duo-gray-dark">Acesse todas as funcionalidades</p>
        </div>
      </FadeIn>

      <div className="grid gap-4">
        {moreMenuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <HoverScale key={item.id}>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleItemClick(item.id)}
                className={`w-full rounded-2xl border-2 ${item.borderColor} bg-gradient-to-br ${item.bgGradient} p-4 text-left shadow-sm transition-shadow hover:shadow-lg`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.color.replace("text-", "bg-")} text-2xl shadow-md`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-duo-text">{item.label}</h3>
                    <p className="text-xs text-duo-gray-dark">{item.description}</p>
                  </div>
                </div>
              </motion.button>
            </HoverScale>
          )
        })}
      </div>
    </div>
  )
}

