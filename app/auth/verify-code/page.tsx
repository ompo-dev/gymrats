"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { DuoButton } from "@/components/ui/duo-button";
import { Input } from "@/components/ui/input";
import { Dumbbell, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { authApi } from "@/lib/api/auth";

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Contador de reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focar no primeiro input quando a página carregar
  useEffect(() => {
    const firstInput = document.getElementById("code-0");
    firstInput?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Apenas números

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Apenas último caractere
    setCode(newCode);

    // Mover para próximo input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
      setCode(newCode.slice(0, 6));
      // Focar no último input preenchido ou próximo vazio
      const nextIndex = Math.min(pastedData.length, 5);
      const nextInput = document.getElementById(`code-${nextIndex}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Por favor, preencha todos os 6 dígitos");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.verifyResetCode(email, fullCode);
      setSuccess(true);
      // Redirecionar para página de reset após 1 segundo
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${fullCode}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Código inválido. Tente novamente.");
      setCode(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("code-0");
      firstInput?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setCountdown(60);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao reenviar código");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Email não fornecido</p>
          <Link href="/auth/forgot-password" className="text-[#58CC02] hover:underline">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <Link href="/auth/forgot-password">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </motion.button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 bg-linear-to-br from-[#58CC02] to-[#47A302] rounded-3xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verificar código
            </h1>
            <p className="text-gray-600">
              Digite o código de 6 dígitos enviado para
            </p>
            <p className="text-gray-900 font-semibold mt-1">{email}</p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 text-sm font-medium"
            >
              Código verificado! Redirecionando...
            </motion.div>
          )}

          {/* Error Message */}
          {error && !success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Code Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-[#58CC02] focus:ring-2 focus:ring-[#58CC02]/20"
                  disabled={isLoading || success}
                />
              ))}
            </div>

            <DuoButton
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || success || code.join("").length !== 6}
            >
              {isLoading ? "Verificando..." : "Verificar código"}
            </DuoButton>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="text-[#58CC02] hover:underline font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reenviando...
                </>
              ) : countdown > 0 ? (
                `Reenviar código em ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reenviar código
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <VerifyCodeContent />
    </Suspense>
  );
}

