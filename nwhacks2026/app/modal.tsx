import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { MOOD_TAGS, MoodKey, MOOD_STORAGE_KEY, MOOD_DATE_KEY } from "../utils/mood";

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MoodModal() {
  const [selected, setSelected] = useState<MoodKey | null>(null);

  async function saveAndClose() {
    if (!selected) return;
    await AsyncStorage.setItem(MOOD_STORAGE_KEY, selected);
    await AsyncStorage.setItem(MOOD_DATE_KEY, todayKey());
    router.replace("/"); // back to Today tab root
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Pick one mood</Text>
      <Text style={{ opacity: 0.8 }}>We’ll reshape today’s habit to fit how you feel.</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
        {MOOD_TAGS.map((m) => {
          const isOn = selected === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setSelected(m.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                backgroundColor: isOn ? "#000" : "transparent",
              }}
            >
              <Text
                style={{
                  color: isOn ? "#fff" : "#000",
                  fontWeight: isOn ? "700" : "400",
                }}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={saveAndClose}
        disabled={!selected}
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 12,
          backgroundColor: selected ? "#000" : "#999",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Continue</Text>
      </Pressable>
    </View>
  );
}