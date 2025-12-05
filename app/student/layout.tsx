"use client"

import { AppHeader } from "@/components/app-header"
import { AppBottomNav } from "@/components/app-bottom-nav"
import { WorkoutModal } from "@/components/workout-modal"
import { SwipeDirectionProvider, useSwipeDirection } from "@/contexts/swipe-direction"
import { Home, Dumbbell, User, UtensilsCrossed, MoreHorizontal } from "lucide-react"
import { useStudentStore } from "@/stores"
import { usePathname, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { useSwipe } from "@/hooks/use-swipe"
import { parseAsString, useQueryState } from "nuqs"

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("home"))
  const { setDirection } = useSwipeDirection()
  const [isChecking, setIsChecking] = useState(true)

  const isOnboarding = pathname.includes("/onboarding")
  const isInWorkoutOrLesson = pathname.includes("/workout") || pathname.includes("/lesson")

  const studentTabs = [
    { id: "home", icon: Home, label: "Início" },
    { id: "learn", icon: Dumbbell, label: "Treino" },
    { id: "diet", icon: UtensilsCrossed, label: "Dieta" },
    { id: "profile", icon: User, label: "Perfil" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ]

  const activeTab = tab

  const handleTabChange = async (newTab: string) => {
    const currentIndex = studentTabs.findIndex((t) => t.id === activeTab)
    const newIndex = studentTabs.findIndex((t) => t.id === newTab)
    
    if (newIndex > currentIndex) {
      setDirection("left")
    } else if (newIndex < currentIndex) {
      setDirection("right")
    }
    
    if (newTab === "home") {
      await setTab(null)
      router.push("/student")
    } else {
      await setTab(newTab)
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    
    setTimeout(() => setDirection(null), 300)
  }

  const goToNextTab = async () => {
    setDirection("left")
    const currentIndex = studentTabs.findIndex((t) => t.id === activeTab)
    if (currentIndex < studentTabs.length - 1) {
      await handleTabChange(studentTabs[currentIndex + 1].id)
    }
    setTimeout(() => setDirection(null), 300)
  }

  const goToPreviousTab = async () => {
    setDirection("right")
    const currentIndex = studentTabs.findIndex((t) => t.id === activeTab)
    if (currentIndex > 0) {
      await handleTabChange(studentTabs[currentIndex - 1].id)
    }
    setTimeout(() => setDirection(null), 300)
  }

  const swipeHandlers = useSwipe({
    onSwipeLeft: isInWorkoutOrLesson || isOnboarding ? undefined : goToNextTab,
    onSwipeRight: isInWorkoutOrLesson || isOnboarding ? undefined : goToPreviousTab,
    threshold: 50,
  })

  useEffect(() => {
    const checkProfile = async () => {
      if (isOnboarding) {
        setIsChecking(false)
        return
      }

      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          router.push("/auth/login")
          return
        }

        const response = await fetch("/api/students/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          setIsChecking(false)
          return
        }

        const data = await response.json()
        if (!data.hasProfile) {
          router.push("/student/onboarding")
          return
        }
      } catch (error) {
        console.error("Erro ao verificar perfil:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [pathname, router, isOnboarding])

  if (isOnboarding) {
    return <>{children}</>
  }

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">💪</div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col bg-white overflow-hidden"
      {...(!isInWorkoutOrLesson ? {
        onTouchStart: swipeHandlers.onTouchStart,
        onTouchMove: swipeHandlers.onTouchMove,
        onTouchEnd: swipeHandlers.onTouchEnd,
        onMouseDown: swipeHandlers.onMouseDown,
        onMouseMove: swipeHandlers.onMouseMove,
        onMouseUp: swipeHandlers.onMouseUp,
        onMouseLeave: swipeHandlers.onMouseUp,
      } : {})}
    >
      <AppHeader
        userType="student"
        stats={{
          streak: useStudentStore.getState().progress.currentStreak,
          xp: useStudentStore.getState().progress.totalXP,
        }}
      />

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {children}
      </main>

      <AppBottomNav
        userType="student"
        activeTab={activeTab}
        tabs={studentTabs}
        onTabChange={handleTabChange}
      />

      {/* Workout Modal - Overlay sobre tudo */}
      <WorkoutModal />
    </div>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SwipeDirectionProvider>
      <Suspense fallback={<div className="h-screen flex items-center justify-center">Carregando...</div>}>
        <StudentLayoutContent>{children}</StudentLayoutContent>
      </Suspense>
    </SwipeDirectionProvider>
  )
}
