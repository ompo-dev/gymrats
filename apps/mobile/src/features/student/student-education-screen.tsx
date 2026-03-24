import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { educationalLessons, exerciseDatabase, muscleDatabase } from "@gymrats/catalog";
import type { EducationalLesson, ExerciseInfo, MuscleInfo } from "@gymrats/types";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { DuoCard } from "../../components/duo-card";
import { colors, radius, shadow, spacing, typography } from "../../theme";

type EducationView = "menu" | "muscles" | "lessons";

const CATEGORY_META: Record<
  string,
  { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  "training-science": {
    color: colors.blue,
    icon: "barbell-outline",
    label: "Treino",
  },
  nutrition: {
    color: colors.primary,
    icon: "nutrition-outline",
    label: "Nutricao",
  },
  recovery: {
    color: "#8b5cf6",
    icon: "moon-outline",
    label: "Recuperacao",
  },
  form: {
    color: colors.warning,
    icon: "body-outline",
    label: "Execucao",
  },
  anatomy: {
    color: "#a16207",
    icon: "medical-outline",
    label: "Anatomia",
  },
};

function normalizeContent(content: string) {
  return content
    .replaceAll("**", "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function MenuCard({
  accent,
  description,
  emoji,
  onPress,
  title,
}: {
  accent: string;
  description: string;
  emoji: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuCard}>
      <View style={[styles.menuIcon, { backgroundColor: accent }]}>
        <Text style={styles.menuIconText}>{emoji}</Text>
      </View>
      <View style={styles.menuBody}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function SearchBox({
  onChangeText,
  placeholder,
  value,
}: {
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <TextInput
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.foregroundMuted}
      style={styles.searchInput}
      value={value}
    />
  );
}

export function StudentEducationScreen() {
  const [view, setView] = useState<EducationView>("menu");
  const [muscleTab, setMuscleTab] = useState<"muscles" | "exercises">("muscles");
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<EducationalLesson | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const filteredMuscles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return muscleDatabase;
    }

    return muscleDatabase.filter((item) =>
      [item.name, item.scientificName, item.description, item.group].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [search]);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return exerciseDatabase;
    }

    return exerciseDatabase.filter((item) =>
      [
        item.name,
        ...item.primaryMuscles,
        ...item.secondaryMuscles,
        ...item.equipment,
      ].some((field) => field.toLowerCase().includes(query)),
    );
  }, [search]);

  const filteredLessons = useMemo(() => {
    return educationalLessons.filter((lesson) => {
      const matchesCategory =
        selectedCategory === "all" || lesson.category === selectedCategory;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [lesson.title, lesson.content, ...lesson.keyPoints].some((field) =>
          field.toLowerCase().includes(query),
        );
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (selectedLesson?.quiz && quizScore == null) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => {
            setQuizAnswers({});
            setSelectedLesson(selectedLesson);
            setQuizScore(null);
          }}
          style={styles.backButton}
        >
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Quiz</Text>
          <Text style={styles.heroSubtitle}>{selectedLesson.title}</Text>
        </View>

        {selectedLesson.quiz.questions.map((question, index) => (
          <DuoCard key={`${selectedLesson.id}-${index}`}>
            <Text style={styles.quizQuestion}>{question.question}</Text>
            <View style={styles.stack}>
              {question.options.map((option, optionIndex) => {
                const active = quizAnswers[index] === optionIndex;

                return (
                  <Pressable
                    key={`${selectedLesson.id}-${index}-${optionIndex}`}
                    onPress={() =>
                      setQuizAnswers((state) => ({
                        ...state,
                        [index]: optionIndex,
                      }))
                    }
                    style={[styles.answerOption, active && styles.answerOptionActive]}
                  >
                    <Text
                      style={[
                        styles.answerText,
                        active && styles.answerTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </DuoCard>
        ))}

        <PrimaryButton
          onPress={() => {
            const total = selectedLesson.quiz?.questions.length || 1;
            let correct = 0;

            selectedLesson.quiz?.questions.forEach((question, index) => {
              if (quizAnswers[index] === question.correctAnswer) {
                correct += 1;
              }
            });

            setQuizScore((correct / total) * 100);
          }}
          title="Finalizar quiz"
        />
      </ScrollView>
    );
  }

  if (selectedLesson && quizScore != null) {
    const passed = quizScore >= 70;

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DuoCard>
          <Text style={styles.heroTitle}>{quizScore.toFixed(0)}%</Text>
          <Text style={styles.heroSubtitle}>
            {passed ? "Quiz concluido com sucesso." : "Voce pode tentar novamente."}
          </Text>
          <PrimaryButton
            onPress={() => {
              if (passed) {
                setQuizAnswers({});
                setQuizScore(null);
                setSelectedLesson(null);
              } else {
                setQuizAnswers({});
                setQuizScore(null);
              }
            }}
            title={passed ? "Continuar" : "Tentar novamente"}
          />
        </DuoCard>
      </ScrollView>
    );
  }

  if (selectedLesson) {
    const category = CATEGORY_META[selectedLesson.category] || CATEGORY_META.nutrition;

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setSelectedLesson(null)} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <DuoCard>
          <View style={styles.cardHeaderLeft}>
            <Ionicons color={category.color} name={category.icon} size={18} />
            <Text style={styles.cardTitle}>{category.label}</Text>
          </View>
          <Text style={styles.detailTitle}>{selectedLesson.title}</Text>
          <Text style={styles.mutedText}>
            {selectedLesson.duration} min • {selectedLesson.xpReward} XP
          </Text>
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Conteudo</Text>
          {normalizeContent(selectedLesson.content).map((line, index) => (
            <Text key={`${selectedLesson.id}-content-${index}`} style={styles.detailText}>
              {line}
            </Text>
          ))}
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Pontos-chave</Text>
          <View style={styles.wrap}>
            {selectedLesson.keyPoints.map((point) => (
              <View key={point} style={styles.lessonPoint}>
                <Text style={styles.lessonPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </DuoCard>

        {selectedLesson.quiz ? (
          <PrimaryButton
            onPress={() => {
              setQuizAnswers({});
              setQuizScore(null);
            }}
            title="Fazer quiz"
          />
        ) : (
          <SecondaryButton onPress={() => setSelectedLesson(null)} title="Concluir licao" />
        )}
      </ScrollView>
    );
  }

  if (selectedMuscle) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setSelectedMuscle(null)} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <DuoCard>
          <Text style={styles.detailTitle}>{selectedMuscle.name}</Text>
          <Text style={styles.mutedText}>{selectedMuscle.scientificName}</Text>
          <Text style={styles.detailText}>{selectedMuscle.description}</Text>
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Funcoes</Text>
          {selectedMuscle.functions.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Exercicios comuns</Text>
          {selectedMuscle.commonExercises.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>
      </ScrollView>
    );
  }

  if (selectedExercise) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setSelectedExercise(null)} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <DuoCard>
          <Text style={styles.detailTitle}>{selectedExercise.name}</Text>
          <Text style={styles.mutedText}>
            {selectedExercise.difficulty} • {selectedExercise.equipment.join(", ")}
          </Text>
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Instrucoes</Text>
          {selectedExercise.instructions.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Dicas</Text>
          {selectedExercise.tips.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>

        <DuoCard>
          <Text style={styles.cardTitle}>Erros comuns</Text>
          {selectedExercise.commonMistakes.map((item) => (
            <Text key={item} style={styles.detailText}>
              • {item}
            </Text>
          ))}
        </DuoCard>
      </ScrollView>
    );
  }

  if (view === "muscles") {
    const items = muscleTab === "muscles" ? filteredMuscles : filteredExercises;

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setView("menu")} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Biblioteca</Text>
          <Text style={styles.heroSubtitle}>Anatomia, musculos e tecnica baseada em ciencia.</Text>
        </View>

        <DuoCard>
          <View style={styles.segmentRow}>
            {(["muscles", "exercises"] as const).map((item) => {
              const active = item === muscleTab;

              return (
                <Pressable
                  key={item}
                  onPress={() => setMuscleTab(item)}
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {item === "muscles" ? "Musculos" : "Exercicios"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <SearchBox
            onChangeText={setSearch}
            placeholder={muscleTab === "muscles" ? "Buscar musculos..." : "Buscar exercicios..."}
            value={search}
          />
        </DuoCard>

        <View style={styles.stack}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (muscleTab === "muscles") {
                  setSelectedMuscle(item as MuscleInfo);
                } else {
                  setSelectedExercise(item as ExerciseInfo);
                }
              }}
              style={styles.listItem}
            >
              <View style={styles.listBody}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {"scientificName" in item
                    ? item.description
                    : `${item.primaryMuscles.join(", ")} • ${item.difficulty}`}
                </Text>
              </View>
              <Ionicons color={colors.foregroundMuted} name="chevron-forward" size={18} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (view === "lessons") {
    const categories = ["all", ...Array.from(new Set(educationalLessons.map((item) => item.category)))];

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setView("menu")} style={styles.backButton}>
          <Ionicons color={colors.blue} name="arrow-back" size={16} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Licoes</Text>
          <Text style={styles.heroSubtitle}>Aprenda ciencia do fitness com quizzes e evidencias.</Text>
        </View>

        <DuoCard>
          <SearchBox onChangeText={setSearch} placeholder="Buscar licoes..." value={search} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {categories.map((category) => {
                const active = category === selectedCategory;
                const label =
                  category === "all"
                    ? "Todas"
                    : CATEGORY_META[category]?.label || category;

                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </DuoCard>

        <View style={styles.stack}>
          {filteredLessons.map((lesson) => {
            const meta = CATEGORY_META[lesson.category] || CATEGORY_META.nutrition;

            return (
              <Pressable
                key={lesson.id}
                onPress={() => setSelectedLesson(lesson)}
                style={styles.lessonCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons color={meta.color} name={meta.icon} size={18} />
                    <Text style={styles.cardTitle}>{meta.label}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{lesson.duration} min</Text>
                </View>
                <Text style={styles.itemTitle}>{lesson.title}</Text>
                <Text numberOfLines={3} style={styles.itemMeta}>
                  {normalizeContent(lesson.content)[0] || lesson.keyPoints[0]}
                </Text>
                <View style={styles.wrap}>
                  {lesson.quiz ? (
                    <View style={styles.lessonPoint}>
                      <Text style={styles.lessonPointText}>
                        {lesson.quiz.questions.length} perguntas
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.lessonPoint}>
                    <Text style={styles.lessonPointText}>{lesson.xpReward} XP</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Central de Aprendizado</Text>
        <Text style={styles.heroSubtitle}>Conhecimento baseado em ciencia para treinar melhor.</Text>
      </View>

      <MenuCard
        accent={colors.blue}
        description="Explore musculos, funcoes e tecnicas corretas de execucao."
        emoji="💪"
        onPress={() => setView("muscles")}
        title="Anatomia e Exercicios"
      />
      <MenuCard
        accent={colors.primary}
        description="Aprenda sobre hipertrofia, nutricao e recuperacao com quizzes."
        emoji="📚"
        onPress={() => setView("lessons")}
        title="Licoes de Ciencia"
      />
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
  menuCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow.soft,
  },
  menuIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconText: {
    fontSize: 30,
  },
  menuBody: {
    flex: 1,
    gap: 6,
  },
  menuTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "900",
  },
  menuDescription: {
    color: colors.foregroundMuted,
    fontSize: 13,
    lineHeight: 19,
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
  searchInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 12,
  },
  segmentButtonActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  segmentText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: colors.blue,
  },
  stack: {
    gap: spacing.sm,
  },
  listItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
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
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
  },
  detailTitle: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  detailText: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 20,
  },
  mutedText: {
    color: colors.foregroundMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: "row",
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
  lessonCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  lessonPoint: {
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lessonPointText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },
  quizQuestion: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  answerOption: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  answerOptionActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  answerText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "700",
  },
  answerTextActive: {
    color: colors.blue,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});
