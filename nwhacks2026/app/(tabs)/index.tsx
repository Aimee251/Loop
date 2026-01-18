import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { MOOD_DATE_KEY, MOOD_STORAGE_KEY, MoodKey, MOOD_TAGS } from "../../utils/mood";
import { getMoodAdjustedTask, MoodAiResponse } from "../../utils/moodAi";
import { habitManager } from "../../models/HabitManager";

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TodayScreen() {
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<MoodAiResponse | null>(null);
  const [err, setErr] = useState("");

  const activeHabits = useMemo(() => habitManager.getActiveHabits(), []);
  const todaysHabit = activeHabits[0];

  // Force mood modal once per day
  useEffect(() => {
    (async () => {
      const savedMood = (await AsyncStorage.getItem(MOOD_STORAGE_KEY)) as MoodKey | null;
      const savedDate = await AsyncStorage.getItem(MOOD_DATE_KEY);

      if (!savedMood || savedDate !== todayKey()) {
        router.replace("/modal");
        return;
      }

      setMood(savedMood);
    })();
  }, []);

  // Call AI once mood is known
  useEffect(() => {
    if (!mood || !todaysHabit) return;

    (async () => {
      setLoading(true);
      setErr("");
      setAi(null);

      try {
        const res = await getMoodAdjustedTask({
          moodTag: mood,
          habitAction: todaysHabit.action,
        });
        setAi(res);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [mood, todaysHabit]);

  const moodLabel = mood ? MOOD_TAGS.find((m) => m.key === mood)?.label : "";

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Today</Text>

      {!todaysHabit ? (
        <Text>No active habits yet. Add one first.</Text>
      ) : (
        <>
          <Text style={{ opacity: 0.8 }}>
            Mood: <Text style={{ fontWeight: "700" }}>{moodLabel}</Text>
          </Text>

          <Text style={{ fontSize: 16 }}>
            Base habit: <Text style={{ fontWeight: "700" }}>{todaysHabit.action}</Text>
          </Text>

          <Pressable
            onPress={() => router.push("/modal")}
            style={{
              alignSelf: "flex-start",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderRadius: 999,
            }}
          >
            <Text>Change mood</Text>
          </Pressable>

          {loading && (
            <View style={{ marginTop: 10, gap: 8 }}>
              <ActivityIndicator />
              <Text>Adapting your habit for today…</Text>
            </View>
          )}

          {!!err && <Text style={{ color: "red" }}>{err}</Text>}

          {ai && (
            <View
              style={{
                marginTop: 10,
                padding: 12,
                borderWidth: 1,
                borderRadius: 12,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800" }}>Today’s adjusted task</Text>
              <Text style={{ fontSize: 16 }}>{ai.modifiedTask}</Text>

              <Text style={{ marginTop: 6, fontWeight: "800" }}>
                Difficulty: {ai.difficulty}
              </Text>

              {/* NEW: research-based duration */}
              <Text style={{ marginTop: 10, fontWeight: "800" }}>
                Evidence-based duration
              </Text>
              <Text>
                Aim for{" "}
                <Text style={{ fontWeight: "800" }}>{ai.recommendedDays}</Text>{" "}
                days (typically {ai.recommendedRange[0]}–{ai.recommendedRange[1]} days)
              </Text>
              <Text style={{ opacity: 0.75, fontSize: 12 }}>
                {ai.researchNote}
              </Text>

              <Text style={{ marginTop: 10, fontWeight: "800" }}>Tips</Text>
              {ai.tips.map((t, i) => (
                <Text key={i}>• {t}</Text>
              ))}

              <Text style={{ marginTop: 6, opacity: 0.8 }}>{ai.why}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}