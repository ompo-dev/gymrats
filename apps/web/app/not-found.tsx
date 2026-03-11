"use client";

import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DuoButton } from "@/components/duo";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isStudentRoute = pathname?.startsWith("/student");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "w-full max-w-2xl rounded-3xl bg-background/95 backdrop-blur-3xl",
          "border border-white/15 shadow-[0_20px_60px_0_rgba(0,0,0,0.5)]",
          "flex flex-col overflow-hidden",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Página Não Encontrada
            </h1>
            <p className="text-sm text-muted-foreground">
              O que você está procurando não existe
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Informações da Rota */}
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <h2 className="text-sm font-semibold text-foreground/80 mb-3">
              Informações
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[120px]">
                  Rota tentada:
                </span>
                <span className="text-foreground font-mono text-xs break-all bg-black/20 px-2 py-1 rounded">
                  {pathname || "/"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[120px]">
                  URL completa:
                </span>
                <span className="text-foreground font-mono text-xs break-all bg-black/20 px-2 py-1 rounded">
                  {typeof window !== "undefined"
                    ? window.location.href
                    : pathname || "/"}
                </span>
              </div>
            </div>
          </div>

          {/* Mensagem */}
          <div className="rounded-xl bg-yellow-500/10 p-4 border border-yellow-500/20">
            <h2 className="text-sm font-semibold text-yellow-400 mb-2">
              O que aconteceu?
            </h2>
            <p className="text-foreground text-sm">
              A página que você está tentando acessar não existe ou foi
              removida. Isso pode acontecer se:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>O link está desatualizado ou incorreto</li>
              <li>A página foi movida ou removida</li>
              <li>Você digitou o endereço incorretamente</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-white/10 p-6">
          <DuoButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </DuoButton>

          {isStudentRoute ? (
            <DuoButton
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => router.push("/student")}
            >
              <Home className="h-4 w-4" />
              Ir para /student
            </DuoButton>
          ) : (
            <DuoButton
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              Ir para Início
            </DuoButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
