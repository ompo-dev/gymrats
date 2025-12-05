"use client"

import { LayoutDashboard, Users, Dumbbell, BarChart3, Trophy, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/gym/dashboard" },
  { icon: Users, label: "Alunos", href: "/gym/students" },
  { icon: Dumbbell, label: "Equipamentos", href: "/gym/equipment" },
  { icon: BarChart3, label: "Estatísticas", href: "/gym/stats" },
  { icon: Trophy, label: "Gamificação", href: "/gym/gamification" },
  { icon: Settings, label: "Configurações", href: "/gym/settings" },
]

export function GymSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("userMode")
    router.push("/select-mode")
  }

  return (
    <aside className="fixed left-0 top-[70px] h-[calc(100vh-70px)] w-64 border-r-2 border-gray-200 bg-white p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all",
                isActive ? "bg-[#FF9600] text-white shadow-md" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-red-600 transition-all hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        <span>Sair</span>
      </button>
    </aside>
  )
}
