"use client";

import { 
  ArrowRight, 
  Check, 
  Dumbbell, 
  Flame, 
  Globe, 
  Zap, 
  Shield, 
  Layout,
  LineChart,
  Users,
  Smartphone,
  Trophy,
  Activity
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DuoButton, DuoCard, DuoStatsGrid, DuoAchievementCard, DuoColorPicker } from "@/components/duo";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { WorkoutNode } from "@/components/organisms/workout/workout-node";
import { StaggerContainer } from "@/components/animations/stagger-container";
import { StaggerItem } from "@/components/animations/stagger-item";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme-store";

// Mock Data
const MOCK_NUTRITION = {
  id: "mock-1",
  userId: "user-1",
  date: new Date().toISOString(),
  targetCalories: 2500,
  totalCalories: 1850,
  targetProtein: 180,
  totalProtein: 140,
  targetCarbs: 250,
  totalCarbs: 190,
  targetFats: 70,
  totalFats: 55,
  waterIntake: 1750,
  targetWater: 3000,
  meals: [
    {
      id: "meal-1",
      name: "Café da Manhã",
      time: "08:00",
      type: "breakfast",
      calories: 450,
      protein: 30,
      carbs: 50,
      fats: 15,
      completed: true,
      foods: []
    },
    {
      id: "meal-2",
      name: "Almoço",
      time: "12:30",
      type: "lunch",
      calories: 750,
      protein: 55,
      carbs: 80,
      fats: 20,
      completed: true,
      foods: []
    }
  ]
};

const MOCK_WORKOUTS = [
  {
    id: "w1",
    title: "Peito e Tríceps",
    exercises: [{}, {}, {}],
    estimatedTime: 45,
    completed: true,
    locked: false,
    type: "hypertrophy"
  },
  {
    id: "w2",
    title: "Costas e Bíceps",
    exercises: [{}, {}, {}, {}],
    estimatedTime: 50,
    completed: false,
    locked: false,
    type: "hypertrophy"
  },
  {
    id: "w3",
    title: "Pernas Completo",
    exercises: [{}, {}, {}, {}, {}],
    estimatedTime: 60,
    completed: false,
    locked: true,
    type: "strength"
  }
];

export function LandingPage() {
  const [nutrition, setNutrition] = useState(MOCK_NUTRITION);

  const handleToggleWater = (index: number) => {
    setNutrition(prev => ({
      ...prev,
      waterIntake: prev.waterIntake + (prev.waterIntake >= (index + 1) * 250 ? -250 : 250)
    }));
  };

  const handleToggleMeal = (mealId: string) => {
    setNutrition(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, completed: !m.completed } : m)
    }));
  };

  return (
    <div className="min-h-screen bg-duo-bg text-duo-fg selection:bg-duo-green/30 selection:text-duo-green-dark">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-[var(--duo-border)]/50 bg-[var(--duo-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--duo-primary)] shadow-lg shadow-[var(--duo-primary)]/20">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-[var(--duo-primary)]">GymRats</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-bold text-[var(--duo-fg-muted)] transition-colors hover:text-[var(--duo-primary)]">Recursos</a>
            <a href="#how-it-works" className="text-sm font-bold text-[var(--duo-fg-muted)] transition-colors hover:text-[var(--duo-primary)]">Como Funciona</a>
            <a href="#pricing" className="text-sm font-bold text-[var(--duo-fg-muted)] transition-colors hover:text-[var(--duo-primary)]">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            <DuoColorPicker.Simple compact className="flex items-center" />
            <Link href="/welcome">
              <DuoButton variant="white" size="sm" className="hidden border-transparent md:flex">
                Entrar
              </DuoButton>
            </Link>
            <Link href="/welcome">
              <DuoButton variant="primary" size="sm" className="px-6 font-bold shadow-lg shadow-[var(--duo-primary)]/20">
                Começar
              </DuoButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-duo-green/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-duo-blue/5 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--duo-primary)]/20 bg-[var(--duo-primary)]/10 px-4 py-1.5 text-xs font-black text-[var(--duo-primary)] leading-none">
                <Zap className="h-3.5 w-3.5" />
                <span>O FUTURO DO TREINO CHEGOU</span>
              </div>
              <h1 className="mt-6 text-5xl font-black leading-[1.1] text-[var(--duo-fg)] md:text-7xl">
                O <span className="bg-gradient-to-r from-[var(--duo-primary)] to-[var(--duo-secondary)] bg-clip-text text-transparent">Duolingo</span> da <br /> Academia.
              </h1>
              <p className="mt-6 text-lg font-medium text-[var(--duo-fg-muted)] md:text-xl md:leading-relaxed">
                Domine técnicas de musculação, acompanhe sua nutrição e evolua seu físico com uma experiência gamificada, interativa e feita para te manter focado.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/welcome">
                  <DuoButton variant="primary" size="lg" className="w-full gap-2 px-8 py-6 text-lg shadow-xl shadow-[var(--duo-primary)]/30 sm:w-fit">
                    Criar minha conta <ArrowRight className="h-5 w-5" />
                  </DuoButton>
                </Link>
                <a href="#features">
                  <DuoButton variant="white" size="lg" className="w-full px-8 py-6 text-lg sm:w-fit">
                    Ver todos os recursos
                  </DuoButton>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Pure CSS App Mockup */}
              <div className="relative mx-auto h-[600px] w-[300px] rounded-[3rem] border-[12px] border-[var(--duo-fg)] bg-[var(--duo-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] ring-1 ring-[var(--duo-border)]">
                {/* Screen Content Mockup */}
                <div className="flex h-full flex-col p-4 pt-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-[var(--duo-border)]" />
                    <div className="flex gap-2">
                       <div className="h-6 w-12 rounded-full bg-[var(--duo-primary)]/20" />
                       <div className="h-6 w-6 rounded-full bg-[var(--duo-secondary)]/20" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-32 w-full rounded-2xl bg-[var(--duo-bg-card)] border-2 border-[var(--duo-border)] p-3">
                      <div className="mb-2 h-3 w-24 rounded-full bg-[var(--duo-fg-muted)]/20" />
                      <div className="grid grid-cols-4 gap-2">
                         {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-[var(--duo-bg-elevated)]" />)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-6 pt-4">
                      <div className="h-16 w-16 rounded-full bg-[var(--duo-primary)] shadow-lg shadow-[var(--duo-primary)]/30" />
                      <div className="h-16 w-16 rounded-full bg-[var(--duo-bg-elevated)]" />
                      <div className="h-16 w-16 rounded-full bg-[var(--duo-bg-elevated)]" />
                    </div>
                  </div>
                </div>

                {/* Floating UI Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-20 top-20 z-20"
                >
                  <DuoCard.Root className="!border-[var(--duo-primary)] shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--duo-primary)] text-white">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[var(--duo-fg-muted)]">STREAK</p>
                        <p className="text-sm font-black text-[var(--duo-fg)]">15 DIAS</p>
                      </div>
                    </div>
                  </DuoCard.Root>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -left-16 bottom-32 z-20"
                >
                  <DuoCard.Root className="!border-[var(--duo-secondary)] shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--duo-secondary)] text-white">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[var(--duo-fg-muted)]">RANK</p>
                        <p className="text-sm font-black text-[var(--duo-fg)]">OURO III</p>
                      </div>
                    </div>
                  </DuoCard.Root>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Highlight: Journey */}
      <section id="features" className="bg-[var(--duo-bg-card)] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-[var(--duo-fg)] md:text-5xl">Sua Jornada Gamificada</h2>
            <p className="mt-4 text-lg font-medium text-[var(--duo-fg-muted)]">Não é apenas um treino, é uma missão para o seu corpo.</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm overflow-hidden rounded-[2rem] bg-[var(--duo-bg)] p-8 shadow-inner ring-1 ring-[var(--duo-border)]/50">
                <StaggerContainer className="flex flex-col items-center space-y-8 py-4">
                  {MOCK_WORKOUTS.map((w, idx) => (
                    <StaggerItem key={w.id} className="w-full">
                      <WorkoutNode.Simple 
                        position={idx === 1 ? "left" : idx === 2 ? "right" : "center"}
                        workout={w as any}
                        onClick={() => {}}
                        isFirst={idx === 0}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </div>

            <div className="order-1 flex flex-col justify-center space-y-8 lg:order-2">
              <div className="group space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--duo-primary)]/10 text-[var(--duo-primary)] group-hover:bg-[var(--duo-primary)] group-hover:text-white transition-all duration-300">
                  <Layout className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-[var(--duo-fg)]">Trilhas de Aprendizado</h3>
                <p className="text-lg text-[var(--duo-fg-muted)]">
                  Siga um caminho lógico de evolução. Desbloqueie novos exercícios e técnicas conforme você domina o básico.
                </p>
              </div>
              <div className="group space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--duo-secondary)]/10 text-[var(--duo-secondary)] group-hover:bg-[var(--duo-secondary)] group-hover:text-white transition-all duration-300">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-[var(--duo-fg)]">Execução Perfeita</h3>
                <p className="text-lg text-[var(--duo-fg-muted)]">
                  Cada exercício vem com guias completos e checkpoints de progresso para garantir que você treine com segurança.
                </p>
              </div>
              <div className="group space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--duo-accent)]/10 text-[var(--duo-accent)] group-hover:bg-[var(--duo-accent)] group-hover:text-white transition-all duration-300">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-[var(--duo-fg)]">Progresso Real</h3>
                <p className="text-lg text-[var(--duo-fg-muted)]">
                  Acompanhe cada repetição, cada quilo a mais e sinta a evolução com métricas precisas desenhadas para o seu sucesso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlight: Nutrition */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-duo-fg md:text-6xl">
                Alimente seu <br />
                <span className="text-duo-green">Progresso</span>
              </h2>
              <p className="text-xl leading-relaxed text-duo-fg-muted">
                Diga adeus às planilhas chatas. O GymRats torna o acompanhamento de calorias e macros tão simples quanto um jogo.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-duo-green/20 text-duo-green">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-duo-fg">Macros Inteligentes</h4>
                    <p className="text-sm text-duo-fg-muted">Cálculo automático baseado no seu treino do dia.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-duo-green/20 text-duo-green">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-duo-fg">Log Instantâneo</h4>
                    <p className="text-sm text-duo-fg-muted">Adicione refeições em segundos com nossa base de dados.</p>
                  </div>
                </div>
              </div>

              <DuoButton variant="primary" size="lg" className="w-full sm:w-fit font-bold shadow-lg shadow-duo-green/20">
                Ver demonstração real
              </DuoButton>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-[2rem] bg-duo-blue/10" />
              <div className="rounded-[2rem] border-2 border-duo-border bg-duo-bg-card p-6 shadow-2xl backdrop-blur-sm md:p-10">
                <NutritionTracker.Simple 
                  nutrition={nutrition as any} 
                  onMealComplete={handleToggleMeal}
                  onAddMeal={() => {}}
                  onToggleWaterGlass={handleToggleWater}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SaaS Stats Section */}
      <section className="bg-[var(--duo-fg)] py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-3 md:text-center">
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md">
                <Smartphone className="h-8 w-8 text-[var(--duo-primary)]" />
              </div>
              <h4 className="text-4xl font-black">98%</h4>
              <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Adesão ao Treino</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md">
                <LineChart className="h-8 w-8 text-[var(--duo-secondary)]" />
              </div>
              <h4 className="text-4xl font-black">+35%</h4>
              <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Aumento de Força</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md">
                <Users className="h-8 w-8 text-[var(--duo-accent)]" />
              </div>
              <h4 className="text-4xl font-black">2k+</h4>
              <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Membros Ativos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-duo-fg md:text-5xl">Escolha seu Nível</h2>
            <p className="mt-4 text-lg font-medium text-duo-fg-muted">O plano certo para qualquer tipo de rato de academia.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <PricingCard 
              title="Individual"
              price="Grátis"
              description="Perfeito para começar sua jornada."
              features={[
                "Acesso às trilhas básicas",
                "Log de treinos ilimitado",
                "Ranking semanal",
                "1 Programa personalizado"
              ]}
              buttonText="Começar Agora"
              variant="white"
            />
            <PricingCard 
              title="Pro Athlete"
              price="R$ 19,90"
              period="/mês"
              highlight
              description="Para quem quer resultados sérios."
              features={[
                "Tudo do plano Grátis",
                "Macros personalizados por IA",
                "Análise de volume e carga",
                "Guia de suplementação",
                "Sem anúncios"
              ]}
              buttonText="Assinar Pro"
              variant="primary"
            />
             <PricingCard 
              title="Plano Academia"
              price="Sob consulta"
              description="Gestão completa para sua unidade."
              features={[
                "Dashboard para instrutores",
                "Criação de trilhas exclusivas",
                "Ranking interno da academia",
                "Integração com catraca",
                "Suporte prioritário"
              ]}
              buttonText="Falar com Vendas"
              variant="secondary"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--duo-border)] bg-[var(--duo-bg-card)] py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-1">
               <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--duo-primary)] shadow-lg shadow-[var(--duo-primary)]/20">
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-[var(--duo-primary)]">GymRats</span>
              </div>
              <p className="text-sm text-[var(--duo-fg-muted)]">
                Tornando o fitness tão viciante quanto um jogo. Evolua seu corpo, domine a técnica.
              </p>
            </div>
            <div>
              <h5 className="mb-4 font-black uppercase tracking-widest text-xs text-[var(--duo-fg)]">Produto</h5>
              <ul className="space-y-2 text-sm text-[var(--duo-fg-muted)]">
                <li><a href="#" className="hover:text-[var(--duo-primary)] transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-[var(--duo-primary)] transition-colors">Trilhas</a></li>
                <li><a href="#" className="hover:text-[var(--duo-primary)] transition-colors">Nutrição</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 font-black uppercase tracking-widest text-xs text-[var(--duo-fg)]">Empresa</h5>
              <ul className="space-y-2 text-sm text-[var(--duo-fg-muted)]">
                <li><a href="#" className="hover:text-[var(--duo-primary)] transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-[var(--duo-primary)] transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-[var(--duo-primary)] transition-colors">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 font-black uppercase tracking-widest text-xs text-[var(--duo-fg)]">Social</h5>
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--duo-bg-elevated)] hover:bg-[var(--duo-primary)]/10 hover:text-[var(--duo-primary)] transition-all cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--duo-bg-elevated)] hover:bg-[var(--duo-primary)]/10 hover:text-[var(--duo-primary)] transition-all cursor-pointer">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--duo-border)] pt-8 text-center text-sm text-[var(--duo-fg-muted)]">
            © 2026 GymRats. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ 
  title, 
  price, 
  period, 
  description, 
  features, 
  buttonText, 
  variant = "white",
  highlight = false
}: { 
  title: string; 
  price: string; 
  period?: string; 
  description: string; 
  features: string[]; 
  buttonText: string;
  variant?: "primary" | "secondary" | "white";
  highlight?: boolean;
}) {
  return (
    <DuoCard.Root 
      variant={highlight ? "highlighted" : "default"} 
      className={cn(
        "relative flex flex-col p-8 transition-all hover:translate-y-[-8px] hover:shadow-2xl",
        highlight && "scale-105 z-10 border-duo-green !bg-white"
      )}
    >
      {highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-duo-green px-4 py-1 text-xs font-black text-white">
          MAIS POPULAR
        </div>
      )}
      <div className="mb-6 flex flex-col gap-2">
        <h4 className="text-xl font-black text-duo-fg">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-duo-fg">{price}</span>
          {period && <span className="text-duo-fg-muted font-bold">{period}</span>}
        </div>
        <p className="text-sm font-medium text-duo-fg-muted">{description}</p>
      </div>
      
      <div className="flex-1 space-y-4 mb-8">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-duo-green/10 text-duo-green">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm font-bold text-duo-fg/80">{feature}</span>
          </div>
        ))}
      </div>

      <DuoButton variant={variant} size="lg" className="w-full font-black">
        {buttonText}
      </DuoButton>
    </DuoCard.Root>
  );
}
