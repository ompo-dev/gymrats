"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlacementTest } from "@/components/placement-test"
import { PlacementResult } from "@/components/placement-result"
import type { PlacementTestResult } from "@/lib/types"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<"test" | "result">("test")
  const [result, setResult] = useState<PlacementTestResult | null>(null)

  const handleTestComplete = (testResult: PlacementTestResult) => {
    setResult(testResult)
    setStep("result")
  }

  const handleStart = () => {
    // Save onboarding data
    localStorage.setItem("gymrats_onboarded", "true")
    localStorage.setItem("gymrats_placement", JSON.stringify(result))
    router.push("/")
  }

  return (
    <>
      {step === "test" && <PlacementTest onComplete={handleTestComplete} />}
      {step === "result" && result && <PlacementResult result={result} onStart={handleStart} />}
    </>
  )
}
