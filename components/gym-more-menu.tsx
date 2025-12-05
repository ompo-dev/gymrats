"use client"

import { BarChart3, Settings, Trophy } from "lucide-react"
import { motion } from "motion/react"
import { FadeIn } from "@/components/animations/fade-in"
import { HoverScale } from "@/components/animations/hover-scale"
import { useQueryState } from "nuqs"

interface MoreMenuItem {
  id: string
  icon: typeof BarChart3
  label: string
  description: string
  color: string
  bgGradient: string
  borderColor: string
}

const moreMenuItems: MoreMenuItem[] = [
  {
    id: "stats",
    icon: BarChart3,
    label: "Estatísticas",
    description: "Análises detalhadas e relatórios",
    color: "text-duo-blue",
    bgGradient: "from-duo-blue/10 to-duo-green/10",
    borderColor: "border-duo-blue",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Configurações",
    description: "Perfil, planos e preferências",
    color: "text-duo-gray-dark",
    bgGradient: "from-gray-100 to-gray-200",
    borderColor: "border-gray-300",
  },
  {
    id: "gamification",
    icon: Trophy,
    label: "Gamificação",
    description: "XP, rankings e conquistas",
    color: "text-duo-yellow",
    bgGradient: "from-duo-yellow/10 to-duo-orange/10",
    borderColor: "border-duo-yellow",
  },
]

export function GymMoreMenu() {
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

