import type { MoodKey } from "./mood";

export type MoodAiResponse = {
  modifiedTask: string;
  difficulty: "tiny" | "normal" | "stretch";
  tips: string[];
  why: string;

  // research-based duration outputs
  recommendedDays: number;
  recommendedRange: [number, number];
  researchNote: string;
};

// IMPORTANT:
// - If you're testing on Expo Go (PHONE), localhost won't work.
// - Use your computer’s LAN IP: http://192.168.x.x:8787
const AI_BASE = "http://128.189.218.190:8787";

export async function getMoodAdjustedTask(params: {
  moodTag: MoodKey;
  habitAction: string;
}): Promise<MoodAiResponse> {
  const res = await fetch(`${AI_BASE}/api/mood-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to get AI suggestion");
  return json as MoodAiResponse;
}