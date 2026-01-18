import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { habitManager } from "../../models/HabitManager";
import { getMoodAdjustedTask } from "../../utils/moodAi";

type MoodKey =
  | "stressed"
  | "anxious"
  | "overwhelmed"
  | "sad"
  | "low_energy"
  | "neutral"
  | "focused"
  | "energized";

const MOODS: { key: MoodKey; label: string }[] = [
  { key: "stressed", label: "Stressed" },
  { key: "anxious", label: "Anxious" },
  { key: "overwhelmed", label: "Overwhelmed" },
  { key: "sad", label: "Sad" },
  { key: "low_energy", label: "Low energy" },
  { key: "neutral", label: "Neutral" },
  { key: "focused", label: "Focused" },
  { key: "energized", label: "Energized" },
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#000",
        backgroundColor: selected ? "#000" : "transparent",
      }}
    >
      <Text style={{ color: selected ? "#fff" : "#000", fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeMock() {
  const userName = "Aimee";

const MOOD_TAGS: MoodOption[] = [
  { key: 'energetic', label: 'Energetic', icon: 'flash', color: COLORS.card1 },
  { key: 'tired', label: 'Tired', icon: 'bed', color: COLORS.card2 },
  { key: 'anxious', label: 'Anxious', icon: 'pulse', color: COLORS.card3 },
  { key: 'calm', label: 'Calm', icon: 'leaf', color: '#E0F7FA' },
];

  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [todayText, setTodayText] = useState<string>(
    "Pick a mood to tailor today’s habit."
  );

  async function handleMood(mood: MoodKey) {
    setSelectedMood(mood);
    setErr("");

    if (!todaysHabit) {
      setTodayText("No active habits yet — add one first.");
      return;
    }

    setLoading(true);
    try {
      const res = await getMoodAdjustedTask({
        moodTag: mood as any,
        habitAction: todaysHabit.action,
      });

      // This is the "habit says to do today" text
      setTodayText(res.modifiedTask);
    } catch (e) {
      setErr(String(e));
      setTodayText("Couldn’t reach the AI. (Is the server running?)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 22,
          paddingTop: 18,
          paddingBottom: 120, // space above bottom bar
        }}
      >
        {/* Gear top-left */}
        <View style={{ alignItems: "flex-start" }}>
          <Pressable onPress={() => {}}>
            <Ionicons name="settings-outline" size={28} color="#000" />
          </Pressable>
        </View>

        {/* Center stack */}
        <View style={{ flex: 1, alignItems: "center" }}>
          {/* Logo circle */}
          <View
            style={{
              marginTop: 70,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#d9d9d9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: "#000" }}>Logo</Text>
          </View>

          {/* Hello */}
          <Text style={{ marginTop: 18, fontSize: 28, color: "#000" }}>
            Hello, {userName}
          </Text>

          {/* Quote/accomplishment */}
          <Text
            style={{
              marginTop: 12,
              fontSize: 18,
              textAlign: "center",
              lineHeight: 26,
              maxWidth: 280,
              color: "#000",
            }}
          >
            “put something here telling{"\n"}
            about the accomplishment the{"\n"}
            user have achieved”
          </Text>

          {/* Mood prompt (middle) */}
          <Text style={{ marginTop: 26, fontSize: 18, fontWeight: "700" }}>
            How are you feeling?
          </Text>

          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              maxWidth: 320,
            }}
          >
            {MOODS.map((m) => (
              <Chip
                key={m.key}
                label={m.label}
                selected={selectedMood === m.key}
                onPress={() => handleMood(m.key)}
              />
            ))}
          </View>

          {/* The habit text that changes */}
          <View
            style={{
              marginTop: 16,
              width: "100%",
              maxWidth: 340,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#000",
            }}
          >
            <Text style={{ fontWeight: "800", fontSize: 16 }}>
              Today’s habit
            </Text>

            <Text style={{ marginTop: 8, fontSize: 16, lineHeight: 22 }}>
              {todayText}
            </Text>

            {loading && (
              <View style={{ marginTop: 10, alignItems: "center", gap: 8 }}>
                <ActivityIndicator />
                <Text style={{ opacity: 0.75 }}>Tailoring…</Text>
              </View>
            )}

            {!!err && (
              <Text style={{ marginTop: 8, color: "red" }}>{err}</Text>
            )}
          </View>

          {/* Go to home page */}
          <Text style={{ marginTop: 28, fontSize: 18, color: "#000" }}>
            Go to home page
          </Text>

          {/* Big rounded rectangle */}
          <View
            style={{
              marginTop: 22,
              width: "100%",
              maxWidth: 360,
              height: 130,
              borderRadius: 22,
              backgroundColor: "#d9d9d9",
            }}
          />
        </View>
      </ScrollView>

      {/* Bottom bar visual (to match screenshot) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: 18,
          paddingTop: 10,
          backgroundColor: "#fff",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: 26, alignItems: "center" }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "#d9d9d9",
            }}
          />
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              backgroundColor: "#e8e8e8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 26 }}>✦</Text>
          </View>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "#d9d9d9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="home-outline" size={26} color="#000" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' },
  content: { padding: 30 },
  greeting: { fontSize: 28, fontWeight: '300', color: COLORS.textPrimary },
  name: { fontSize: 34, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 40 },
  spacer: { height: 20 },
  title: { fontSize: 24, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  card: { 
    width: '47%', aspectRatio: 1.1, borderRadius: 24, 
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
  },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
});