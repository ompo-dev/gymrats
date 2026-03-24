import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { ScreenBackground } from "../../components/screen-background";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import {
  calculateStudentMetabolicData,
  type StudentFitnessLevel,
  type StudentMetabolicCalculation,
  type StudentOnboardingGender,
  type StudentOnboardingGoal,
} from "./metabolic";

type Role = "PENDING" | "STUDENT";
type RepRange = "forca" | "hipertrofia" | "resistencia";
type RestTime = "curto" | "medio" | "longo";
type GymType =
  | "academia-completa"
  | "academia-basica"
  | "home-gym"
  | "peso-corporal";

export type StudentOnboardingFormData = {
  age: number | "";
  gender: StudentOnboardingGender | "";
  isTrans: boolean;
  usesHormones: boolean;
  hormoneType: "testosterone" | "estrogen" | "none" | "";
  height: number | "";
  weight: number | "";
  fitnessLevel: StudentFitnessLevel | "";
  weeklyWorkoutFrequency: number;
  workoutDuration: number;
  goals: StudentOnboardingGoal[];
  gymType: GymType | "";
  preferredSets: number;
  preferredRepRange: RepRange;
  restTime: RestTime;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  activityLevel?: number;
  hormoneTreatmentDuration?: number;
  physicalLimitations: string[];
  motorLimitations: string[];
  medicalConditions: string[];
  limitationDetails?: Record<string, string | string[]>;
};

type Props = {
  initialData?: Partial<StudentOnboardingFormData> | null;
  loadingExisting?: boolean;
  onBack: () => void;
  onSubmit: (data: StudentOnboardingFormData) => Promise<void>;
  role: Role;
  submitting?: boolean;
};

const ACTIVITY_INFO: Record<number, { label: string; description: string }> = {
  1: { label: "Sedentario total", description: "Sem exercicio e rotina muito parada." },
  2: { label: "Muito sedentario", description: "Pouco movimento durante a semana." },
  3: { label: "Sedentario leve", description: "Exercicio leve ocasional." },
  4: { label: "Levemente ativo", description: "Treino leve entre 3 e 5x por semana." },
  5: { label: "Moderadamente ativo", description: "Treino consistente com boa rotina." },
  6: { label: "Ativo", description: "Treino pesado ou trabalho em movimento." },
  7: { label: "Muito ativo", description: "Treino pesado quase todo dia." },
  8: { label: "Extremamente ativo", description: "Rotina fisica muito intensa." },
  9: { label: "Atleta", description: "Treino forte com alto volume." },
  10: { label: "Atleta elite", description: "Performance extrema e frequente." },
};

const PHYSICAL_LIMITATIONS = [
  ["articulacoes", "Articulacoes"],
  ["costas", "Costas"],
  ["pernas", "Pernas"],
  ["bracos", "Bracos"],
  ["pescoco", "Pescoco"],
  ["outras-fisicas", "Outras"],
] as const;

const MOTOR_LIMITATIONS = [
  ["mobilidade-reduzida", "Mobilidade reduzida"],
  ["equilibrio", "Equilibrio"],
  ["coordenacao", "Coordenacao"],
  ["forca-reduzida", "Forca reduzida"],
  ["amplitude-movimento", "Amplitude"],
  ["outras-motoras", "Outras"],
] as const;

const MEDICAL_CONDITIONS = [
  ["diabetes", "Diabetes"],
  ["hipertensao", "Hipertensao"],
  ["problemas-cardiacos", "Cardiaco"],
  ["asma", "Asma"],
  ["problemas-tireoide", "Tireoide"],
  ["outras-medicas", "Outras"],
] as const;

export function createDefaultStudentOnboardingData(): StudentOnboardingFormData {
  return {
    age: "",
    gender: "",
    isTrans: false,
    usesHormones: false,
    hormoneType: "",
    height: "",
    weight: "",
    fitnessLevel: "",
    weeklyWorkoutFrequency: 3,
    workoutDuration: 60,
    goals: [],
    gymType: "",
    preferredSets: 3,
    preferredRepRange: "hipertrofia",
    restTime: "medio",
    activityLevel: 4,
    hormoneTreatmentDuration: undefined,
    physicalLimitations: [],
    motorLimitations: [],
    medicalConditions: [],
    limitationDetails: {},
  };
}

function mergeInitialData(data?: Partial<StudentOnboardingFormData> | null) {
  const base = createDefaultStudentOnboardingData();
  return {
    ...base,
    ...data,
    goals: Array.isArray(data?.goals) ? data.goals : base.goals,
    physicalLimitations: Array.isArray(data?.physicalLimitations)
      ? data.physicalLimitations
      : base.physicalLimitations,
    motorLimitations: Array.isArray(data?.motorLimitations)
      ? data.motorLimitations
      : base.motorLimitations,
    medicalConditions: Array.isArray(data?.medicalConditions)
      ? data.medicalConditions
      : base.medicalConditions,
  };
}

function chipSelected(values: string[], value: string) {
  return values.includes(value);
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function validationMessage(data: StudentOnboardingFormData) {
  const age = typeof data.age === "number" ? data.age : NaN;
  const height = typeof data.height === "number" ? data.height : NaN;
  const weight = typeof data.weight === "number" ? data.weight : NaN;

  if (!Number.isFinite(age) || age < 13 || age > 120) return "Informe uma idade valida.";
  if (!data.gender) return "Selecione seu genero.";
  if (!Number.isFinite(height) || height < 100 || height > 250) return "Informe uma altura valida.";
  if (!Number.isFinite(weight) || weight < 30 || weight > 300) return "Informe um peso valido.";
  if (!data.fitnessLevel) return "Selecione seu nivel de experiencia.";
  if (data.goals.length === 0) return "Escolha um objetivo.";
  if (!data.gymType) return "Selecione sua estrutura disponivel.";
  if (!data.activityLevel || data.activityLevel < 1 || data.activityLevel > 10) {
    return "Selecione seu nivel de atividade.";
  }

  return null;
}

function Section({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.foregroundMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function Chip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function goalLabel(goal: StudentMetabolicCalculation["metadata"]["goal"]) {
  if (goal === "cut") return "Perda de peso";
  if (goal === "bulk") return "Ganho de massa";
  return "Manutencao";
}

function activityLabel(level: StudentMetabolicCalculation["metadata"]["activityLevel"]) {
  if (level === "sedentary") return "Sedentario";
  if (level === "light") return "Leve";
  if (level === "moderate") return "Moderado";
  if (level === "active") return "Ativo";
  return "Muito ativo";
}

function Metric({
  accent,
  label,
  suffix,
  value,
}: {
  accent: string;
  label: string;
  suffix: string;
  value: string | number;
}) {
  return (
    <View style={[styles.metric, { borderColor: `${accent}44` }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricSuffix}>{suffix}</Text>
    </View>
  );
}

export function StudentOnboardingScreen({
  initialData,
  loadingExisting = false,
  onBack,
  onSubmit,
  role,
  submitting = false,
}: Props) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<StudentOnboardingFormData>(
    mergeInitialData(initialData),
  );

  useEffect(() => {
    setFormData(mergeInitialData(initialData));
  }, [initialData]);

  const calculation = useMemo(() => {
    if (validationMessage(formData)) return null;

    return calculateStudentMetabolicData({
      age: formData.age as number,
      gender: formData.gender as StudentOnboardingGender,
      isTrans: formData.isTrans,
      usesHormones: formData.usesHormones,
      hormoneType: formData.hormoneType || undefined,
      hormoneTreatmentDuration: formData.hormoneTreatmentDuration,
      height: formData.height as number,
      weight: formData.weight as number,
      fitnessLevel: formData.fitnessLevel as StudentFitnessLevel,
      weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
      workoutDuration: formData.workoutDuration,
      goals: formData.goals,
      activityLevel: formData.activityLevel,
    });
  }, [formData]);

  useEffect(() => {
    if (!calculation) return;

    setFormData((current) => ({
      ...current,
      bmr: calculation.bmr,
      tdee: calculation.tdee,
      targetCalories: calculation.targetCalories,
      targetProtein: calculation.macros.protein,
      targetCarbs: calculation.macros.carbs,
      targetFats: calculation.macros.fats,
    }));
  }, [calculation]);

  const handleNext = () => {
    if (step === 1) {
      const message = validationMessage(formData);
      if (message) {
        setError(message);
        return;
      }
    }

    if (step === 2 && !calculation) {
      setError("Nao foi possivel calcular o plano ainda.");
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleSubmit = async () => {
    if (!calculation) {
      setError("Revise os dados antes de concluir.");
      return;
    }

    setError("");
    await onSubmit({
      ...formData,
      bmr: calculation.bmr,
      tdee: calculation.tdee,
      targetCalories: calculation.targetCalories,
      targetProtein: calculation.macros.protein,
      targetCarbs: calculation.macros.carbs,
      targetFats: calculation.macros.fats,
    });
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{step} de 3</Text>
              </View>
              <Text style={styles.heroTitle}>Onboarding Student</Text>
              <Text style={styles.heroText}>
                {role === "PENDING"
                  ? "Complete seu perfil para liberar a experiencia completa."
                  : "Revise seu perfil e gere um plano base consistente."}
              </Text>
            </View>

            {step === 1 ? (
              <DuoCard>
                <Section
                  description="Dados pessoais, objetivo, estrutura e rotina."
                  title="Quem e voce"
                />

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Field
                      label="Idade"
                      onChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          age: value === "" ? "" : Number(value.replace(",", ".")),
                        }))
                      }
                      placeholder="25"
                      value={formData.age === "" ? "" : String(formData.age)}
                    />
                  </View>
                  <View style={styles.col}>
                    <Field
                      label="Altura (cm)"
                      onChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          height: value === "" ? "" : Number(value.replace(",", ".")),
                        }))
                      }
                      placeholder="170"
                      value={formData.height === "" ? "" : String(formData.height)}
                    />
                  </View>
                </View>

                <Field
                  label="Peso (kg)"
                  onChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      weight: value === "" ? "" : Number(value.replace(",", ".")),
                    }))
                  }
                  placeholder="70"
                  value={formData.weight === "" ? "" : String(formData.weight)}
                />

                <View style={styles.field}>
                  <Text style={styles.label}>Genero</Text>
                  <View style={styles.wrap}>
                    {[
                      ["Masculino", "male"],
                      ["Trans masc", "trans-male"],
                      ["Feminino", "female"],
                      ["Trans fem", "trans-female"],
                    ].map(([label, value]) => (
                      <Chip
                        key={value}
                        label={label}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            gender: value as StudentOnboardingGender,
                            isTrans: value.includes("trans"),
                            usesHormones: value.includes("trans")
                              ? current.usesHormones
                              : false,
                            hormoneType: value.includes("trans")
                              ? current.hormoneType
                              : "",
                            hormoneTreatmentDuration: value.includes("trans")
                              ? current.hormoneTreatmentDuration
                              : undefined,
                          }))
                        }
                        selected={formData.gender === value}
                      />
                    ))}
                  </View>
                </View>

                {formData.isTrans ? (
                  <View style={styles.box}>
                    <Text style={styles.label}>Terapia hormonal</Text>
                    <View style={styles.wrap}>
                      <Chip
                        label="Nao"
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            usesHormones: false,
                            hormoneType: "",
                            hormoneTreatmentDuration: undefined,
                          }))
                        }
                        selected={!formData.usesHormones}
                      />
                      <Chip
                        label="Sim"
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            usesHormones: true,
                          }))
                        }
                        selected={formData.usesHormones}
                      />
                      <Chip
                        label="Testosterona"
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            usesHormones: true,
                            hormoneType: "testosterone",
                          }))
                        }
                        selected={formData.hormoneType === "testosterone"}
                      />
                      <Chip
                        label="Estrogenio"
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            usesHormones: true,
                            hormoneType: "estrogen",
                          }))
                        }
                        selected={formData.hormoneType === "estrogen"}
                      />
                    </View>
                    <Field
                      label="Meses de tratamento"
                      onChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          hormoneTreatmentDuration:
                            value === "" ? undefined : Number(value.replace(",", ".")),
                        }))
                      }
                      placeholder="0"
                      value={
                        typeof formData.hormoneTreatmentDuration === "number"
                          ? String(formData.hormoneTreatmentDuration)
                          : ""
                      }
                    />
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>Nivel de experiencia</Text>
                  <View style={styles.wrap}>
                    {[
                      ["Iniciante", "iniciante"],
                      ["Intermediario", "intermediario"],
                      ["Avancado", "avancado"],
                    ].map(([label, value]) => (
                      <Chip
                        key={value}
                        label={label}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            fitnessLevel: value as StudentFitnessLevel,
                          }))
                        }
                        selected={formData.fitnessLevel === value}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Objetivo</Text>
                  <View style={styles.wrap}>
                    {[
                      ["Perder peso", "perder-peso"],
                      ["Ganhar massa", "ganhar-massa"],
                      ["Definir / manter", "definir"],
                    ].map(([label, value]) => (
                      <Chip
                        key={value}
                        label={label}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            goals: [value as StudentOnboardingGoal],
                          }))
                        }
                        selected={chipSelected(formData.goals, value)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Treinos por semana</Text>
                  <View style={styles.wrap}>
                    {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                      <Chip
                        key={value}
                        label={`${value}x`}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            weeklyWorkoutFrequency: value,
                          }))
                        }
                        selected={formData.weeklyWorkoutFrequency === value}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Duracao por treino</Text>
                  <View style={styles.wrap}>
                    {[30, 45, 60, 75, 90, 120].map((value) => (
                      <Chip
                        key={value}
                        label={`${value} min`}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            workoutDuration: value,
                          }))
                        }
                        selected={formData.workoutDuration === value}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Estrutura disponivel</Text>
                  <View style={styles.wrap}>
                    {[
                      ["Academia completa", "academia-completa"],
                      ["Academia basica", "academia-basica"],
                      ["Home gym", "home-gym"],
                      ["Peso corporal", "peso-corporal"],
                    ].map(([label, value]) => (
                      <Chip
                        key={value}
                        label={label}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            gymType: value as GymType,
                          }))
                        }
                        selected={formData.gymType === value}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Nivel de atividade (1 a 10)</Text>
                  <View style={styles.wrap}>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                      <Chip
                        key={value}
                        label={String(value)}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            activityLevel: value,
                          }))
                        }
                        selected={formData.activityLevel === value}
                      />
                    ))}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.infoTitle}>
                      {ACTIVITY_INFO[formData.activityLevel ?? 4].label}
                    </Text>
                    <Text style={styles.infoText}>
                      {ACTIVITY_INFO[formData.activityLevel ?? 4].description}
                    </Text>
                  </View>
                </View>
              </DuoCard>
            ) : null}

            {step === 2 ? (
              <DuoCard>
                <Section
                  description="Metas automaticas baseadas no seu perfil."
                  title="Seu plano personalizado"
                />

                {!calculation ? (
                  <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.centerTitle}>Calculando plano...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.row}>
                      <Metric accent={colors.blue} label="TMB" suffix="kcal/dia" value={calculation.bmr} />
                      <Metric accent={colors.warning} label="TDEE" suffix="kcal/dia" value={calculation.tdee} />
                    </View>

                    <View style={styles.target}>
                      <View style={styles.targetHead}>
                        <View style={styles.targetTitleWrap}>
                          <MaterialIcons color="#ffffff" name="track-changes" size={20} />
                          <Text style={styles.targetLabel}>Meta diaria</Text>
                        </View>
                        <Text style={styles.targetGoal}>{goalLabel(calculation.metadata.goal)}</Text>
                      </View>
                      <Text style={styles.targetValue}>{calculation.targetCalories} kcal</Text>
                    </View>

                    {[
                      ["Proteina", calculation.macros.protein, calculation.macroPercentages.protein, colors.danger, "fitness-outline"],
                      ["Carboidratos", calculation.macros.carbs, calculation.macroPercentages.carbs, colors.warning, "flash-outline"],
                      ["Gorduras", calculation.macros.fats, calculation.macroPercentages.fats, colors.blue, "water-outline"],
                    ].map(([label, grams, percent, accent, icon]) => (
                      <View key={String(label)} style={styles.macro}>
                        <View style={styles.macroIcon}>
                          <Ionicons color={accent as string} name={icon as never} size={18} />
                        </View>
                        <View style={styles.macroBody}>
                          <Text style={styles.macroTitle}>{label}</Text>
                          <Text style={styles.macroMeta}>{percent}% do plano</Text>
                        </View>
                        <Text style={[styles.macroValue, { color: accent as string }]}>
                          {grams}g
                        </Text>
                      </View>
                    ))}

                    <View style={styles.info}>
                      <Text style={styles.infoTitle}>Resumo tecnico</Text>
                      <Text style={styles.infoText}>
                        Formula Harris-Benedict, atividade {activityLabel(calculation.metadata.activityLevel)} e fator {calculation.activityFactor.toFixed(2)}x.
                      </Text>
                    </View>
                  </>
                )}
              </DuoCard>
            ) : null}

            {step === 3 ? (
              <DuoCard>
                <Section
                  description="Preferencias e restricoes opcionais."
                  title="Algo mais"
                />

                <View style={styles.field}>
                  <Text style={styles.label}>Series por exercicio</Text>
                  <View style={styles.wrap}>
                    {[2, 3, 4, 5].map((value) => (
                      <Chip
                        key={value}
                        label={`${value}x`}
                        onPress={() =>
                          setFormData((current) => ({ ...current, preferredSets: value }))
                        }
                        selected={formData.preferredSets === value}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Faixa de repeticoes</Text>
                  <View style={styles.wrap}>
                    {[
                      ["Forca", "forca"],
                      ["Hipertrofia", "hipertrofia"],
                      ["Resistencia", "resistencia"],
                    ].map(([label, value]) => (
                      <Chip
                        key={value}
                        label={label}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            preferredRepRange: value as RepRange,
                          }))
                        }
                        selected={formData.preferredRepRange === value}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Descanso entre series</Text>
                  <View style={styles.wrap}>
                    {[
                      ["Curto", "curto"],
                      ["Medio", "medio"],
                      ["Longo", "longo"],
                    ].map(([label, value]) => (
                      <Chip
                        key={value}
                        label={label}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            restTime: value as RestTime,
                          }))
                        }
                        selected={formData.restTime === value}
                      />
                    ))}
                  </View>
                </View>

                {[
                  {
                    key: "physicalLimitations" as const,
                    options: PHYSICAL_LIMITATIONS,
                    title: "Limitacoes fisicas",
                  },
                  {
                    key: "motorLimitations" as const,
                    options: MOTOR_LIMITATIONS,
                    title: "Limitacoes motoras",
                  },
                  {
                    key: "medicalConditions" as const,
                    options: MEDICAL_CONDITIONS,
                    title: "Condicoes medicas",
                  },
                ].map((group) => (
                  <View key={group.key} style={styles.field}>
                    <Text style={styles.label}>{group.title}</Text>
                    <View style={styles.wrap}>
                      {group.options.map(([value, label]) => (
                        <Chip
                          key={value}
                          label={label}
                          onPress={() =>
                            setFormData((current) => ({
                              ...current,
                              [group.key]: toggleValue(current[group.key], value),
                            }))
                          }
                          selected={chipSelected(formData[group.key], value)}
                        />
                      ))}
                    </View>
                  </View>
                ))}

                {formData.physicalLimitations.length > 0 ||
                formData.motorLimitations.length > 0 ||
                formData.medicalConditions.length > 0 ? (
                  <View style={styles.info}>
                    <Text style={styles.infoTitle}>Ajuste de seguranca</Text>
                    <Text style={styles.infoText}>
                      Essas informacoes ajudam a gerar treinos mais seguros desde o inicio.
                    </Text>
                  </View>
                ) : null}
              </DuoCard>
            ) : null}

            {error ? (
              <View style={styles.error}>
                <Text style={styles.errorTitle}>Revise os dados</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {loadingExisting ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Carregando perfil atual...</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <View style={styles.footerButton}>
                <SecondaryButton
                  onPress={() => {
                    if (step > 1) {
                      setError("");
                      setStep((current) => current - 1);
                      return;
                    }

                    onBack();
                  }}
                  title="Voltar"
                />
              </View>

              {step < 3 ? (
                <View style={styles.footerButton}>
                  <PrimaryButton disabled={loadingExisting} onPress={handleNext} title="Continuar" />
                </View>
              ) : (
                <>
                  <View style={styles.footerButton}>
                    <SecondaryButton
                      disabled={submitting}
                      onPress={() => {
                        void handleSubmit();
                      }}
                      title={submitting ? "Salvando..." : "Pular"}
                    />
                  </View>
                  <View style={styles.footerButton}>
                    <PrimaryButton
                      disabled={submitting}
                      onPress={() => {
                        void handleSubmit();
                      }}
                      title={submitting ? "Salvando..." : "Completar"}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    gap: spacing.md,
    paddingBottom: 160,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  badge: {
    backgroundColor: colors.blueSoft,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.blue,
    fontSize: typography.caption.fontSize,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  heroText: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: "center",
  },
  sectionHead: { gap: 4 },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  sectionDescription: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  col: { flex: 1 },
  field: { gap: spacing.sm },
  label: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  box: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
  },
  info: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: 4,
    padding: spacing.md,
  },
  infoTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  infoText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  center: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  centerTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  metric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    gap: 4,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.foregroundMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  metricSuffix: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  target: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadow.soft,
  },
  targetHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  targetTitleWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  targetLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  targetGoal: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  targetValue: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
  },
  macro: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  macroIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  macroBody: {
    flex: 1,
    gap: 3,
  },
  macroTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "900",
  },
  macroMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
  },
  macroValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  error: {
    backgroundColor: "#fff2f2",
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: 4,
    padding: spacing.md,
  },
  errorTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  errorText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  loading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingBottom: spacing.md,
  },
  loadingText: {
    color: colors.foregroundMuted,
    fontSize: 13,
  },
  footer: {
    backgroundColor: "rgba(247, 247, 240, 0.96)",
    borderTopColor: colors.border,
    borderTopWidth: 2,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    position: "absolute",
    right: 0,
  },
  footerRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
