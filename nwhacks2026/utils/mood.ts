export const MOOD_STORAGE_KEY = "mood_tag_today";
export const MOOD_DATE_KEY = "mood_date"; // YYYY-MM-DD

export const MOOD_TAGS = [
  { key: "stressed", label: "Stressed" },
  { key: "anxious", label: "Anxious" },
  { key: "overwhelmed", label: "Overwhelmed" },
  { key: "sad", label: "Sad" },
  { key: "low_energy", label: "Low energy" },
  { key: "neutral", label: "Neutral" },
  { key: "focused", label: "Focused" },
  { key: "energized", label: "Energized" },
] as const;

export type MoodKey = (typeof MOOD_TAGS)[number]["key"];