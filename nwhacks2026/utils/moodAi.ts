/**
 * moodAi.ts
 *
 * Client helper for fetching mood-adjusted habit guidance.
 * Includes AI explanation for why the recommended number of days is optimal.
 */

export type MoodTag =
  | "stressed"
  | "anxious"
  | "overwhelmed"
  | "sad"
  | "low_energy"
  | "neutral"
  | "focused"
  | "energized";

export type MoodTaskResult = {
  modifiedTask: string;
  difficulty: "tiny" | "normal" | "stretch";
  tips: string[];
  why: string;

  recommendedDays: number;
  recommendedRange: [number, number];
  researchNote: string;

  // NEW: short AI explanation for day count
  daysWhy: string;
};

type MoodTaskInput = {
  moodTag: MoodTag;
  habitAction: string;
};

const API_BASE = "http://192.168.68.125:8787"; // change if needed

/**
 * Clamp recommended days to a reasonable range
 */
function clampDays(n: number): number {
  if (!Number.isFinite(n)) return 66;
  return Math.max(7, Math.min(120, Math.round(n)));
}

/**
 * Fallback explanation if AI does not return one
 */
function fallbackDaysWhy(
  recommendedDays: number,
  range: [number, number]
): string {
  return `This duration sits within an evidence-informed range (${range[0]}–${range[1]} days) where habits often begin to feel more automatic when practiced consistently, without requiring large increases in effort.`;
}

/**
 * Fetch mood-adjusted habit guidance from the AI server
 */
export async function getMoodAdjustedTask(
  input: MoodTaskInput
): Promise<MoodTaskResult> {
  const { moodTag, habitAction } = input;

  const res = await fetch(`${API_BASE}/api/mood-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moodTag, habitAction }),
  });

  if (!res.ok) {
    throw new Error(`AI request failed (${res.status})`);
  }

  const data = (await res.json()) as Partial<MoodTaskResult>;

  const recommendedDays = clampDays(
    typeof data.recommendedDays === "number" ? data.recommendedDays : 66
  );

  const recommendedRange: [number, number] = Array.isArray(
    data.recommendedRange
  ) && data.recommendedRange.length === 2
    ? [data.recommendedRange[0], data.recommendedRange[1]]
    : [30, 66];

  return {
    modifiedTask: data.modifiedTask || habitAction,
    difficulty: data.difficulty || "normal",
    tips: Array.isArray(data.tips) ? data.tips.slice(0, 3) : [],
    why: data.why || "The task was adjusted to better match the current mood.",

    recommendedDays,
    recommendedRange,
    researchNote:
      data.researchNote ||
      "Habit automaticity varies, but consistent repetition over time supports stabilization.",

    // NEW: AI explanation (with safe fallback)
    daysWhy:
      data.daysWhy ||
      fallbackDaysWhy(recommendedDays, recommendedRange),
  };
}