import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import type { StudentHomeData } from "./types";

type CardioType =
  | "corrida"
  | "bicicleta"
  | "natacao"
  | "remo"
  | "eliptico"
  | "pular-corda"
  | "caminhada"
  | "hiit";

type FunctionalCategory =
  | "mobilidade"
  | "equilibrio"
  | "coordenacao"
  | "agilidade"
  | "core-funcional";

type FunctionalAudience = "criancas" | "adultos" | "idosos";

type CardioView = "menu" | "cardio" | "functional";

const CARDIO_TYPES: Array<{
  label: string;
  type: CardioType;
}> = [
  { label: "Corrida", type: "corrida" },
  { label: "Bicicleta", type: "bicicleta" },
  { label: "Natacao", type: "natacao" },
  { label: "Remo", type: "remo" },
  { label: "Eliptico", type: "eliptico" },
  { label: "Pular corda", type: "pular-corda" },
  { label: "Caminhada", type: "caminhada" },
  { label: "HIIT", type: "hiit" },
];

const MET_VALUES: Record<CardioType, Record<string, number>> = {
  corrida: { baixa: 7, moderada: 9.8, alta: 12.3, "muito-alta": 14.5 },
  bicicleta: { baixa: 4, moderada: 8, alta: 10, "muito-alta": 12 },
  natacao: { baixa: 6, moderada: 8, alta: 11, "muito-alta": 13 },
  remo: { baixa: 4.8, moderada: 7, alta: 12, "muito-alta": 13.5 },
  eliptico: { baixa: 5, moderada: 7, alta: 9, "muito-alta": 11 },
  "pular-corda": { baixa: 8, moderada: 10, alta: 12, "muito-alta": 14 },
  caminhada: { baixa: 3.5, moderada: 4.3, alta: 5, "muito-alta": 6 },
  hiit: { baixa: 8, moderada: 12, alta: 14, "muito-alta": 16 },
};

const FUNCTIONAL_EXERCISES = [
  {
    id: "func-1",
    name: "Agachamento com Rotacao",
    category: "mobilidade" as const,
    description: "Agachamento profundo com rotacao do tronco.",
    sets: 3,
    duration: "10 reps",
    rest: 45,
    difficulty: "iniciante",
    benefits: ["Mobilidade", "Core", "Prevencao de lesoes"],
    targetAudience: ["adultos", "idosos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 4.5,
  },
  {
    id: "func-2",
    name: "Prancha Dinamica",
    category: "core-funcional" as const,
    description: "Prancha com movimento alternado dos bracos.",
    sets: 3,
    duration: "30s",
    rest: 30,
    difficulty: "intermediario",
    benefits: ["Core", "Estabilidade", "Ombros"],
    targetAudience: ["adultos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 6,
  },
  {
    id: "func-3",
    name: "Passada com Rotacao",
    category: "coordenacao" as const,
    description: "Passada frontal com rotacao controlada.",
    sets: 3,
    duration: "12 reps",
    rest: 45,
    difficulty: "intermediario",
    benefits: ["Equilibrio", "Pernas", "Coordenacao"],
    targetAudience: ["adultos", "criancas"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 5.5,
  },
  {
    id: "func-4",
    name: "Bird Dog",
    category: "equilibrio" as const,
    description: "Extensao alternada de braco e perna oposta.",
    sets: 3,
    duration: "10 reps cada lado",
    rest: 30,
    difficulty: "iniciante",
    benefits: ["Equilibrio", "Lombar", "Estabilidade"],
    targetAudience: ["adultos", "idosos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 3.5,
  },
  {
    id: "func-5",
    name: "Caminhada do Urso",
    category: "agilidade" as const,
    description: "Movimento em quatro apoios com quadril elevado.",
    sets: 3,
    duration: "20 passos",
    rest: 45,
    difficulty: "intermediario",
    benefits: ["Agilidade", "Corpo todo", "Coordenacao"],
    targetAudience: ["adultos", "criancas"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 7,
  },
  {
    id: "func-6",
    name: "Sentar e Levantar da Cadeira",
    category: "mobilidade" as const,
    description: "Exercicio funcional focado em autonomia para idosos.",
    sets: 3,
    duration: "12 reps",
    rest: 60,
    difficulty: "iniciante",
    benefits: ["Pernas", "Independencia", "Prevencao de quedas"],
    targetAudience: ["idosos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 3,
  },
  {
    id: "func-7",
    name: "Marcha Estacionaria Coordenada",
    category: "coordenacao" as const,
    description: "Marcha no lugar com padrao coordenado de bracos.",
    sets: 3,
    duration: "60s",
    rest: 30,
    difficulty: "iniciante",
    benefits: ["Coordenacao", "Ritmo", "Aquecimento"],
    targetAudience: ["criancas", "idosos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 4,
  },
  {
    id: "func-8",
    name: "Equilibrio em Uma Perna",
    category: "equilibrio" as const,
    description: "Exercicio de propriocepcao e estabilidade.",
    sets: 3,
    duration: "30s cada perna",
    rest: 30,
    difficulty: "iniciante",
    benefits: ["Tornozelos", "Equilibrio", "Prevencao de quedas"],
    targetAudience: ["adultos", "idosos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 2.8,
  },
  {
    id: "func-9",
    name: "Polichinelos Modificados",
    category: "agilidade" as const,
    description: "Versao com impacto reduzido para varias idades.",
    sets: 3,
    duration: "30s",
    rest: 30,
    difficulty: "iniciante",
    benefits: ["Condicionamento", "Aquecimento", "Coordenacao"],
    targetAudience: ["criancas", "adultos", "idosos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 5,
  },
  {
    id: "func-10",
    name: "Rotacao de Tronco com Bola",
    category: "core-funcional" as const,
    description: "Rotacoes controladas com bola medicinal.",
    sets: 3,
    duration: "15 reps",
    rest: 45,
    difficulty: "intermediario",
    benefits: ["Obliquos", "Rotacao", "Potencia"],
    targetAudience: ["adultos"] as FunctionalAudience[],
    caloriesBurnedPerMinute: 5.5,
  },
];

export function StudentCardioScreen({ data }: { data: StudentHomeData }) {
  const [view, setView] = useState<CardioView>("menu");
  const [cardioType, setCardioType] = useState<CardioType>("corrida");
  const [intensity, setIntensity] = useState<"baixa" | "moderada" | "alta" | "muito-alta">(
    "moderada",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [category, setCategory] = useState<FunctionalCategory | "all">("all");
  const [audience, setAudience] = useState<FunctionalAudience | "all">("all");

  const currentWeight = data.profile?.weight ?? 75;
  const estimatedCalories = useMemo(() => {
    const met = MET_VALUES[cardioType][intensity];
    return Math.round(met * currentWeight * (duration / 3600));
  }, [cardioType, currentWeight, duration, intensity]);

  const targetZone = useMemo(() => {
    const max = 220 - 28;
    return {
      min: Math.round(max * 0.7),
      max: Math.round(max * 0.85),
    };
  }, []);

  const filteredFunctional = useMemo(() => {
    return FUNCTIONAL_EXERCISES.filter((exercise) => {
      const categoryMatch = category === "all" || exercise.category === category;
      const audienceMatch =
        audience === "all" || exercise.targetAudience.includes(audience);
      return categoryMatch && audienceMatch;
    });
  }, [audience, category]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const handle = setInterval(() => {
      setDuration((value) => value + 1);
      setDistance((value) => value + 0.01);
      setHeartRate(() => {
        const base = { baixa: 112, moderada: 128, alta: 148, "muito-alta": 166 }[
          intensity
        ];
        return base;
      });
    }, 1000);

    return () => clearInterval(handle);
  }, [intensity, isRunning]);

  const resetCardio = () => {
    setIsRunning(false);
    setDuration(0);
    setDistance(0);
    setHeartRate(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  };

  if (view === "cardio") {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setView("menu")} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Treino Cardio</Text>
          <Text style={styles.heroSubtitle}>Acompanhe duracao, calorias e zona cardiaca.</Text>
        </View>

        <DuoCard>
          <Text style={styles.cardTitle}>Modalidade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {CARDIO_TYPES.map((item) => {
                const active = item.type === cardioType;

                return (
                  <Pressable
                    key={item.type}
                    onPress={() => setCardioType(item.type)}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </DuoCard>

        <View style={styles.statsGrid}>
          {[
            { icon: "time-outline", label: "Duracao", value: formatTime(duration), color: colors.blue },
            { icon: "flame-outline", label: "Calorias", value: String(estimatedCalories), color: colors.danger },
            { icon: "navigate-outline", label: "Distancia", value: `${distance.toFixed(2)} km`, color: colors.primary },
            { icon: "heart-outline", label: "FC", value: heartRate ? `${heartRate} bpm` : "--", color: colors.warning },
          ].map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Ionicons color={item.color} name={item.icon as keyof typeof Ionicons.glyphMap} size={18} />
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <DuoCard>
          <Text style={styles.cardTitle}>Zona de FC alvo</Text>
          <Text style={styles.mutedText}>
            {targetZone.min} - {targetZone.max} bpm
          </Text>
          <View style={styles.zoneTrack}>
            <View
              style={[
                styles.zoneFill,
                {
                  width: `${heartRate ? Math.min((heartRate / targetZone.max) * 100, 100) : 0}%`,
                },
              ]}
            />
          </View>
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Intensidade</Text>
          <View style={styles.filterRowWrap}>
            {(["baixa", "moderada", "alta", "muito-alta"] as const).map((item) => {
              const active = item === intensity;

              return (
                <Pressable
                  key={item}
                  onPress={() => setIntensity(item)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </DuoCard>

        <View style={styles.actionRow}>
          <PrimaryButton
            onPress={() => setIsRunning((value) => !value)}
            title={isRunning ? "Pausar" : "Iniciar"}
          />
          <SecondaryButton onPress={resetCardio} title="Resetar" />
        </View>

        <DuoCard>
          <View style={styles.tipRow}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>
              O gasto calorico considera MET, peso atual e intensidade selecionada.
            </Text>
          </View>
        </DuoCard>
      </ScrollView>
    );
  }

  if (view === "functional") {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setView("menu")} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Treino Funcional</Text>
          <Text style={styles.heroSubtitle}>Exercicios para mobilidade, equilibrio e coordenacao.</Text>
        </View>

        <DuoCard>
          <Text style={styles.cardTitle}>Publico</Text>
          <View style={styles.filterRowWrap}>
            {(["all", "criancas", "adultos", "idosos"] as const).map((item) => {
              const active = item === audience;

              return (
                <Pressable
                  key={item}
                  onPress={() => setAudience(item)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {item === "all" ? "Todos" : item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Categoria</Text>
          <View style={styles.filterRowWrap}>
            {(["all", "mobilidade", "equilibrio", "coordenacao", "agilidade", "core-funcional"] as const).map(
              (item) => {
                const active = item === category;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {item === "all" ? "Todas" : item}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
        </DuoCard>

        <View style={styles.stack}>
          {filteredFunctional.map((exercise) => (
            <DuoCard key={exercise.id}>
              <View style={styles.cardHeader}>
                <View style={styles.listBody}>
                  <Text style={styles.itemTitle}>{exercise.name}</Text>
                  <Text style={styles.itemMeta}>{exercise.description}</Text>
                </View>
                <Text style={styles.priceLabel}>{exercise.caloriesBurnedPerMinute} cal/min</Text>
              </View>

              <View style={styles.statsRowCompact}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Series</Text>
                  <Text style={styles.metricValue}>{exercise.sets}x</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Duracao</Text>
                  <Text style={styles.metricValue}>{exercise.duration}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Descanso</Text>
                  <Text style={styles.metricValue}>{exercise.rest}s</Text>
                </View>
              </View>

              <View style={styles.filterRowWrap}>
                {exercise.benefits.map((benefit) => (
                  <View key={benefit} style={styles.benefitPill}>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </DuoCard>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Cardio e Funcionais</Text>
        <Text style={styles.heroSubtitle}>Melhore saude cardiovascular e funcionalidade.</Text>
      </View>

      <View style={styles.statsGridMenu}>
        <View style={styles.statCard}>
          <Ionicons color={colors.danger} name="heart-outline" size={18} />
          <Text style={styles.statValue}>3x</Text>
          <Text style={styles.statLabel}>Cardio na semana</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons color={colors.primary} name="trending-up-outline" size={18} />
          <Text style={styles.statValue}>850</Text>
          <Text style={styles.statLabel}>Kcal queimadas</Text>
        </View>
      </View>

      <Pressable onPress={() => setView("cardio")} style={styles.menuCard}>
        <View style={[styles.menuIconWrap, { backgroundColor: "rgba(214, 69, 69, 0.12)" }]}>
          <Text style={styles.menuEmoji}>🏃</Text>
        </View>
        <View style={styles.listBody}>
          <Text style={styles.menuTitle}>Treino Cardio</Text>
          <Text style={styles.itemMeta}>
            Corrida, bicicleta, natacao, remo e monitor de intensidade.
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={() => setView("functional")} style={styles.menuCard}>
        <View style={[styles.menuIconWrap, { backgroundColor: colors.blueSoft }]}>
          <Text style={styles.menuEmoji}>🤸</Text>
        </View>
        <View style={styles.listBody}>
          <Text style={styles.menuTitle}>Treino Funcional</Text>
          <Text style={styles.itemMeta}>
            Exercicios para criancas, adultos e idosos com filtros por categoria.
          </Text>
        </View>
      </Pressable>

      <DuoCard>
        <View style={styles.tipRow}>
          <MaterialIcons color={colors.warning} name="track-changes" size={20} />
          <Text style={styles.tipText}>
            Os calculos usam peso atual e intensidade para estimar calorias e zona de esforco.
          </Text>
        </View>
      </DuoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900",
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  filterPillActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  filterText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: "800",
  },
  filterTextActive: {
    color: colors.blue,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statsGridMenu: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  zoneTrack: {
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  zoneFill: {
    height: "100%",
    borderRadius: radius.round,
    backgroundColor: colors.danger,
  },
  actionRow: {
    gap: spacing.sm,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  stack: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  itemMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  priceLabel: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "900",
  },
  statsRowCompact: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricBox: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  metricLabel: {
    color: colors.foregroundMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
  benefitPill: {
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  benefitText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
  menuCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  menuIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuEmoji: {
    fontSize: 30,
  },
  menuTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  mutedText: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
});
