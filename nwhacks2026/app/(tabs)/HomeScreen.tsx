import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { habitManager } from "@/models/HabitManager";
import { getMoodAdjustedTask } from "@/utils/moodAi";

const COLORS = {
  background: "#FDFBF7",
  textPrimary: "#4A4A4A",
  textSecondary: "#8E8E93",
  card1: "#E6EEFA",
  card2: "#E3F2E1",
  card3: "#FAE6E6",
  navBar: "#FFFFFF",
  modalOverlay: "rgba(0,0,0,0.3)",
  primaryBtn: "#4A4A4A",
};

const DEFAULT_GOAL_DAYS = 66;
const { height } = Dimensions.get("window");

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type DaysExplanation = {
  recommendedDays: number;
  recommendedRange: [number, number];
  researchNote: string;
  daysWhy: string;
};

export default function HomeScreen() {
  const { mood } = useLocalSearchParams();
  const currentMood =
    typeof mood === "string"
      ? mood
      : Array.isArray(mood)
        ? mood[0] ?? "neutral"
        : "neutral";

  const [habits, setHabits] = useState<any[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<Record<string, any>>({});

  // Create habit form
  const [habitName, setHabitName] = useState("");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Days input + AI recommend
  const [goalDaysText, setGoalDaysText] = useState<string>(String(DEFAULT_GOAL_DAYS));
  const [aiDaysLoading, setAiDaysLoading] = useState(false);
  const [daysExplanation, setDaysExplanation] = useState<DaysExplanation | null>(null);

  useEffect(() => {
    refreshHabits();
    fetchAiForHabits(String(currentMood));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMood]);

  const refreshHabits = () => {
    setHabits([...habitManager.getActiveHabits()]);
  };

  const fetchAiForHabits = async (moodTag: string) => {
    const currentHabits = habitManager.getActiveHabits();
    if (currentHabits.length === 0) {
      setAiData({});
      return;
    }

    setAiLoading(true);
    const newAiData: Record<string, any> = {};

    await Promise.all(
      currentHabits.map(async (h: any) => {
        try {
          const res = await getMoodAdjustedTask({
            moodTag: moodTag as any,
            habitAction: h.action,
          });
          newAiData[h.id] = res;
        } catch (e) {
          console.error(e);
        }
      })
    );

    setAiData(newAiData);
    setAiLoading(false);
  };

  const openCreateModal = () => {
    setHabitName("");
    setPhoneNumber("");
    setIsGroupMode(false);
    setGoalDaysText(String(DEFAULT_GOAL_DAYS));
    setDaysExplanation(null);
    setAddModalVisible(true);
  };

  const getGoalDaysNumber = () => {
    const raw = (goalDaysText || "").trim();
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_GOAL_DAYS;
    return clampInt(Math.round(n), 1, 365);
  };

  const handleRecommendDays = async () => {
    const name = habitName.trim();
    if (!name) {
      Alert.alert("Required", "Enter a habit name first, then tap AI Recommend.");
      return;
    }

    try {
      setAiDaysLoading(true);

      const res = await getMoodAdjustedTask({
        moodTag: String(currentMood) as any,
        habitAction: name,
      });

      const recommended = clampInt(Math.round(res.recommendedDays ?? DEFAULT_GOAL_DAYS), 1, 365);

      // Fill the input
      setGoalDaysText(String(recommended));

      // Show explanation directly underneath (only after AI fills the number)
      const range =
        Array.isArray(res.recommendedRange) && res.recommendedRange.length === 2
          ? (res.recommendedRange as [number, number])
          : ([30, 66] as [number, number]);

      setDaysExplanation({
        recommendedDays: recommended,
        recommendedRange: range,
        researchNote:
          res.researchNote ||
          "Habit automaticity varies, but consistent repetition over time supports stabilization.",
        daysWhy:
          res.daysWhy ||
          "This recommendation sits within the evidence-informed range and balances consistency with sustainability for the current mood and difficulty.",
      });
    } catch (e) {
      console.error(e);
      Alert.alert("AI Error", "Could not generate a recommendation.");
    } finally {
      setAiDaysLoading(false);
    }
  };

  const handleCreateHabit = () => {
    const name = habitName.trim();
    if (!name) return Alert.alert("Required", "Enter a habit name.");

    const goalDays = getGoalDaysNumber();

    if (isGroupMode) {
      const phones = [phoneNumber].map((p) => p.trim()).filter(Boolean);
      habitManager.createGroupHabit(name, goalDays, phones);
    } else {
      habitManager.createSoloHabit(name, goalDays);
    }

    setAddModalVisible(false);

    // Reset form state
    setHabitName("");
    setPhoneNumber("");
    setIsGroupMode(false);
    setGoalDaysText(String(DEFAULT_GOAL_DAYS));
    setDaysExplanation(null);

    refreshHabits();
    fetchAiForHabits(String(currentMood));
  };

  const handleDelete = (id: string) => {
    habitManager.deleteHabit(id);
    refreshHabits();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greetingSub}>Today's Plan</Text>
          <View style={styles.moodBadge}>
            <Text style={styles.moodText}>
              Mood:{" "}
              {typeof currentMood === "string"
                ? currentMood.charAt(0).toUpperCase() + currentMood.slice(1)
                : "Neutral"}
            </Text>
          </View>
        </View>

        {/* AI Loading */}
        {aiLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.textPrimary} />
            <Text style={styles.loadingText}>Tailoring habits to the current mood...</Text>
          </View>
        )}

        {/* Habits */}
        {habits.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: COLORS.textSecondary }}>No habits yet. Tap + to start.</Text>
          </View>
        ) : (
          habits.map((habit: any, index: number) => {
            const cardColor = [COLORS.card1, COLORS.card2, COLORS.card3][index % 3];
            const aiInfo = aiData[habit.id];

            return (
                <View key={habit.id} style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{habit.action}</Text>
                    <TouchableOpacity onPress={() => handleDelete(habit.id)}>
                        <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.cardBody}>
                    <View style={styles.circleLogo}>
                        <MaterialCommunityIcons 
                        // Determine icon based on if phoneNumbers exist (GroupHabit)
                        name={habit.phoneNumbers && habit.phoneNumbers.length > 0 ? "account-group" : "water-outline"} 
                        size={32} color={COLORS.textPrimary} 
                        />
                    </View>

                    {aiInfo ? (
                    <View style={styles.aiContainer}>
                        <Text style={styles.aiLabel}>Adjusted Goal:</Text>
                        <Text style={styles.aiTask}>{aiInfo.modifiedTask}</Text>
                        <Text style={styles.aiNote}>{aiInfo.researchNote}</Text>
                    </View>
                    ) : (
                        <Text style={styles.loadingTextSmall}>Loading adjustment...</Text>
                    )}
                </View>
                </View>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Create Habit Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.addModalContent}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalTitle}>New Habit</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Habit Name"
              value={habitName}
              onChangeText={(t) => {
                setHabitName(t);
                // clear explanation if habit name changes to avoid mismatch
                if (daysExplanation) setDaysExplanation(null);
              }}
            />

            {/* Days input + AI Recommend */}
            <View style={styles.daysRow}>
              <TextInput
                style={[styles.input, styles.daysInput]}
                placeholder="Length (days)"
                value={goalDaysText}
                onChangeText={(t) => {
                  const digits = t.replace(/[^\d]/g, "");
                  setGoalDaysText(digits);
                  // hide AI explanation if edited manually
                  if (daysExplanation) setDaysExplanation(null);
                }}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.aiDaysBtn, aiDaysLoading && { opacity: 0.7 }]}
                onPress={handleRecommendDays}
                disabled={aiDaysLoading}
              >
                {aiDaysLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.aiDaysBtnText}>AI Recommend</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Shows ONLY after AI fills the number */}
            {daysExplanation && (
              <View style={styles.daysExplanation}>
                <Text style={styles.daysExplanationTitle}>
                  Why {daysExplanation.recommendedDays} days?
                </Text>

                <Text style={styles.daysExplanationText}>
                  Suggested range: {daysExplanation.recommendedRange[0]}–{daysExplanation.recommendedRange[1]} days.
                </Text>

                <Text style={styles.daysExplanationWhy}>{daysExplanation.daysWhy}</Text>
              </View>
            )}

            <View style={styles.modeRow}>
              <TouchableOpacity
                onPress={() => setIsGroupMode(false)}
                style={[styles.modeBtn, !isGroupMode && styles.modeBtnActive]}
              >
                <Text>Me Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsGroupMode(true)}
                style={[styles.modeBtn, isGroupMode && styles.modeBtnActive]}
              >
                <Text>We Mode</Text>
              </TouchableOpacity>
            </View>

            {isGroupMode && (
              <TextInput
                style={styles.input}
                placeholder="Friend's Phone #"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            )}

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateHabit}>
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/")}>
          <Ionicons name="home" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View style={styles.placeholderIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24 },

  header: {
    marginBottom: 20,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingSub: { fontSize: 28, fontWeight: "300", color: COLORS.textPrimary },
  moodBadge: { backgroundColor: "#E0E0E0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  moodText: { fontWeight: "600", color: COLORS.textPrimary, fontSize: 14 },

  loadingRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  loadingText: { color: COLORS.textSecondary, fontStyle: "italic" },
  loadingTextSmall: { fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic" },

  card: { borderRadius: 24, padding: 20, marginBottom: 20, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: "600", color: COLORS.textPrimary },
  actionText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },

  cardBody: { alignItems: "center", marginVertical: 10 },
  circleLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  aiContainer: { alignItems: "center", paddingHorizontal: 10 },
  aiLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4, textTransform: "uppercase" },
  aiTask: { fontSize: 18, fontWeight: "600", textAlign: "center", color: COLORS.textPrimary, marginBottom: 5 },
  aiNote: { fontSize: 12, color: COLORS.textPrimary, textAlign: "center", opacity: 0.7, fontStyle: "italic" },

  modalOverlay: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: "flex-end" },
  addModalContent: {
    backgroundColor: "#EBEBEB",
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: height * 0.55,
  },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 10 },

  input: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 20 },

  daysRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  daysInput: { flex: 1, marginBottom: 0 },
  aiDaysBtn: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  aiDaysBtnText: { color: "#FFF", fontWeight: "700" },

  daysExplanation: {
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  daysExplanationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  daysExplanationText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    opacity: 0.85,
    marginBottom: 6,
  },
  daysExplanationWhy: {
    fontSize: 12,
    color: COLORS.textPrimary,
    opacity: 0.8,
    marginBottom: 6,
  },
  daysExplanationNote: {
    fontSize: 12,
    color: COLORS.textPrimary,
    opacity: 0.65,
    fontStyle: "italic",
  },

  modeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  modeBtn: { flex: 1, padding: 15, backgroundColor: "#FFF", borderRadius: 12, alignItems: "center" },
  modeBtnActive: { borderWidth: 2, borderColor: "#A0A0A0" },

  createBtn: { backgroundColor: COLORS.primaryBtn, padding: 18, borderRadius: 16, alignItems: "center", marginTop: 10 },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 90,
    backgroundColor: COLORS.navBar,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
  },
  addButton: {
    backgroundColor: "#D1D5DB",
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -25,
    elevation: 5,
  },
  navItem: { padding: 10 },
  placeholderIcon: { width: 24, height: 24, backgroundColor: "#E5E7EB", borderRadius: 6 },
});