import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { getMoodAdjustedTask } from "../../utils/moodAi";

export default function AITest() {
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      const res = await getMoodAdjustedTask({
        moodTag: "sad",
        habitAction: "Read 30 minutes",
      });
      setOut(res);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>AI Test</Text>

      <Pressable
        onPress={run}
        style={{
          backgroundColor: "#000",
          padding: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Run AI Test
        </Text>
      </Pressable>

      {loading && <ActivityIndicator />}

      {!!err && <Text style={{ color: "red" }}>{err}</Text>}

      {out && (
        <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 }}>
          <Text style={{ fontWeight: "800" }}>modifiedTask</Text>
          <Text>{out.modifiedTask}</Text>

          <Text style={{ fontWeight: "800", marginTop: 6 }}>
            difficulty
          </Text>
          <Text>{out.difficulty}</Text>

          {/* NEW: evidence-based duration */}
          <Text style={{ fontWeight: "800", marginTop: 6 }}>
            recommended duration
          </Text>
          <Text>
            {out.recommendedDays} days (typical range{" "}
            {out.recommendedRange?.[0]}–{out.recommendedRange?.[1]} days)
          </Text>

          <Text style={{ opacity: 0.75, fontSize: 12 }}>
            {out.researchNote}
          </Text>

          <Text style={{ fontWeight: "800", marginTop: 6 }}>
            tips
          </Text>
          {out.tips?.map((t: string, i: number) => (
            <Text key={i}>• {t}</Text>
          ))}

          <Text style={{ fontWeight: "800", marginTop: 6 }}>
            why
          </Text>
          <Text>{out.why}</Text>
        </View>
      )}
    </View>
  );
}

