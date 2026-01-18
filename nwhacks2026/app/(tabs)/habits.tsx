import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { habitManager } from "../../models/HabitManager";
import type { Habit } from "../../models/Habit";

export default function HabitsScreen() {
  const [action, setAction] = useState("");
  const [goalDays, setGoalDays] = useState("14");
  const [error, setError] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);

  const refresh = useCallback(() => {
    setHabits(habitManager.getActiveHabits());
  }, []);

  // Refresh when you navigate to this tab
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function onAdd() {
    setError("");

    const trimmed = action.trim();
    if (!trimmed) {
      setError("Please enter what you want to do (e.g., Drink water).");
      return;
    }

    const goal = Number(goalDays);
    if (!Number.isFinite(goal) || goal <= 0) {
      setError("Goal days must be a positive number.");
      return;
    }

    // Optional: limit active habits to 2 (burnout prevention)
    const activeCount = habitManager.getActiveHabits().length;
    if (activeCount >= 2) {
      setError("Max 2 active habits — focus beats burnout.");
      return;
    }

    habitManager.createHabit(trimmed, goal);
    setAction("");
    setGoalDays(String(goal));
    refresh();
  }

  function onToggleComplete(id: string) {
    const h = habitManager.getHabit(id);
    if (!h) return;

    if (h.isCompletedToday()) habitManager.unmarkHabitAsCompleted(id);
    else habitManager.markHabitAsCompleted(id);

    refresh();
  }

  function onDelete(id: string) {
    habitManager.deleteHabit(id); // soft-delete (inactive)
    refresh();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Habits</Text>

        <View style={{ gap: 8, padding: 12, borderWidth: 1, borderRadius: 12 }}>
          <Text style={{ fontWeight: "700" }}>Add a habit</Text>

          <TextInput
            value={action}
            onChangeText={setAction}
            placeholder="What’s the habit? (e.g., 10-min walk)"
            style={{
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />

          <TextInput
            value={goalDays}
            onChangeText={setGoalDays}
            placeholder="Goal days (e.g., 14)"
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />

          {!!error && <Text style={{ color: "red" }}>{error}</Text>}

          <Pressable
            onPress={onAdd}
            style={{
              backgroundColor: "#000",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Add Habit</Text>
          </Pressable>

          <Text style={{ opacity: 0.7, marginTop: 4 }}>
            Active habits: {habits.length}/2
          </Text>
        </View>

        <Text style={{ fontWeight: "700", marginTop: 6 }}>Your active habits</Text>

        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const done = item.isCompletedToday();
            return (
              <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.action}</Text>

                <Text style={{ opacity: 0.8 }}>
                  Goal: {item.goalDays} days • Streak: {item.currentStreak}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => onToggleComplete(item.id)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      backgroundColor: done ? "#000" : "transparent",
                    }}
                  >
                    <Text style={{ color: done ? "#fff" : "#000" }}>
                      {done ? "Done today ✓" : "Mark done"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onDelete(item.id)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                    }}
                  >
                    <Text>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={{ opacity: 0.7 }}>No habits yet — add one above.</Text>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}
