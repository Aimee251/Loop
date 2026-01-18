import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

type MoodTag =
  | "stressed"
  | "anxious"
  | "overwhelmed"
  | "sad"
  | "low_energy"
  | "neutral"
  | "focused"
  | "energized";

type Difficulty = "tiny" | "normal" | "stretch";

type MoodAiResponse = {
  modifiedTask: string;
  difficulty: Difficulty; // locked (habit difficulty, not mood difficulty)
  tips: string[];
  why: string;

  // duration outputs (habit-based, not mood-based)
  recommendedDays: number;
  recommendedRange: [number, number];
  researchNote: string;

  // explanation for day count
  daysWhy: string;
};

// -----------------------------
// Deterministic day calculation (NOT mood-based)
// -----------------------------
const BASE_DAYS = 66;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function roundInt(n: number) {
  return Math.round(n);
}

/**
 * 1) Complexity (cognitive load / steps)
 * Output: multiplier ~0.85 to 1.35 (conservative)
 */
function complexityMultiplier(habit: string): number {
  const t = habit.toLowerCase();

  if (t.match(/drink water|water|vitamin|take meds|stretch|journal|gratitude|floss/)) return 0.9;

  let score = 1.0;

  if (t.match(/gym|workout|run|cardio|training|lift|yoga class/)) score += 0.18;
  if (t.match(/meal prep|cook|clean house|deep clean|laundry|vacuum/)) score += 0.16;
  if (t.match(/study|revise|homework|assignment|coding|project|practice piano|practice guitar/)) score += 0.14;

  return clamp(score, 0.85, 1.35);
}

/**
 * 2) Emotional Valence (“pain factor”)
 * Estimated resistance/enjoyment based on keywords.
 * Output: multiplier ~0.9 to 1.25
 */
function valenceMultiplier(habit: string): number {
  const t = habit.toLowerCase();

  if (t.match(/cold plunge|ice bath|laundry|fold|vacuum|tax|budget|declutter/)) return 1.18;
  if (t.match(/gym|workout|run|study|coding|practice/)) return 1.08;
  if (t.match(/walk|read|journal|gratitude|meditate|music|water/)) return 0.95;

  return 1.02;
}

/**
 * 3) Environmental friction (activation energy)
 * Setup time/effort to begin.
 * Output: multiplier ~0.9 to 1.3
 */
function environmentFrictionMultiplier(habit: string): number {
  const t = habit.toLowerCase();

  if (t.match(/gym|pool|swim|class|commute|drive|go to/)) return 1.22;
  if (t.match(/meal prep|cook|vacuum|clean|laundry/)) return 1.15;

  if (t.match(/journal|meditate|stretch|water|read/)) return 0.95;

  return 1.05;
}

/**
 * 4) Context stability
 * Not mood-based. Default assumes "mixed" context unless overridden.
 * Output: multiplier ~0.98 to 1.18
 */
function contextStabilityMultiplier(contextStability?: "stable" | "mixed" | "chaotic"): number {
  if (contextStability === "stable") return 0.98;
  if (contextStability === "chaotic") return 1.18;
  if (contextStability === "mixed") return 1.08;

  return 1.08; // default "mixed"
}

/**
 * 5) “Why” internal vs external
 * Output: multiplier ~0.98 to 1.12
 */
function whyMultiplier(whyType?: "identity" | "outcome" | "mixed"): number {
  if (whyType === "identity") return 0.98;
  if (whyType === "outcome") return 1.12;
  if (whyType === "mixed") return 1.05;
  return 1.06; // default slight friction
}

function rangeForDifficulty(d: Difficulty): [number, number] {
  if (d === "tiny") return [18, 30];
  if (d === "normal") return [30, 66];
  return [66, 120];
}

/**
 * Habit difficulty should reflect habit friction/complexity (NOT mood).
 * Conservative mapping: most habits fall into "normal".
 */
function pickHabitDifficultyFromMetrics(args: {
  complexity: number;
  emotionalValence: number;
  environmentalFriction: number;
  contextStability: number;
  whyFactor: number;
}): Difficulty {
  const { complexity, emotionalValence, environmentalFriction, contextStability, whyFactor } = args;

  // "How far from 1.0" the habit is across dimensions (weighted)
  const difficultyScore =
    Math.max(0, complexity - 1) * 0.40 +
    Math.max(0, emotionalValence - 1) * 0.20 +
    Math.max(0, environmentalFriction - 1) * 0.25 +
    Math.max(0, contextStability - 1) * 0.10 +
    Math.max(0, whyFactor - 1) * 0.15;

  // Conservative thresholds
  if (difficultyScore < 0.06) return "tiny";
  if (difficultyScore < 0.20) return "normal";
  return "stretch";
}

/**
 * Main calculator:
 * Time to Autopilot = Base(66) * Complexity * FrictionComposite
 *
 * Fixes "always 18" by:
 * - choosing difficulty based on habit metrics
 * - selecting a position inside the range (0.25–0.75) using the five variables
 */
function computeAutopilotETA(args: {
  habitAction: string;
  contextStability?: "stable" | "mixed" | "chaotic";
  whyType?: "identity" | "outcome" | "mixed";
}) {
  const { habitAction, contextStability, whyType } = args;

  const mComplexity = complexityMultiplier(habitAction);
  const mValence = valenceMultiplier(habitAction);
  const mEnv = environmentFrictionMultiplier(habitAction);
  const mContext = contextStabilityMultiplier(contextStability);
  const mWhy = whyMultiplier(whyType);

  const frictionComposite = mValence * mEnv * mContext * mWhy;

  const difficulty = pickHabitDifficultyFromMetrics({
    complexity: mComplexity,
    emotionalValence: mValence,
    environmentalFriction: mEnv,
    contextStability: mContext,
    whyFactor: mWhy,
  });

  const recommendedRange = rangeForDifficulty(difficulty);
  const [lo, hi] = recommendedRange;

  // Position inside range:
  let position =
    0.5 +
    (mComplexity - 1) * 0.35 +
    (mValence - 1) * 0.25 +
    (mEnv - 1) * 0.25 +
    (mContext - 1) * 0.20 +
    (mWhy - 1) * 0.20;

  position = clamp(position, 0.25, 0.75);

  const recommendedDays = clamp(roundInt(lo + (hi - lo) * position), lo, hi);

  const rawEta = clamp(BASE_DAYS * mComplexity * frictionComposite, 18, 120);

  return {
    recommendedDays,
    recommendedRange,
    difficulty,
    breakdown: {
      baseDays: BASE_DAYS,
      complexity: mComplexity,
      emotionalValence: mValence,
      environmentalFriction: mEnv,
      contextStability: mContext,
      whyFactor: mWhy,
      frictionComposite,
      rawEta,
      position,
    },
  };
}

// -----------------------------
// API
// -----------------------------
app.post("/api/mood-task", async (req: Request, res: Response) => {
  try {
    const { moodTag, habitAction, contextStability, whyType } = req.body as {
      moodTag?: MoodTag;
      habitAction?: string;

      // Optional (UI can add later)
      contextStability?: "stable" | "mixed" | "chaotic";
      whyType?: "identity" | "outcome" | "mixed";
    };

    if (!moodTag || !habitAction) {
      return res.status(400).json({ error: "Missing moodTag or habitAction" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY in server/.env" });
    }

    // ✅ Duration computed from habit metrics ONLY (not mood)
    const calc = computeAutopilotETA({
      habitAction,
      contextStability,
      whyType,
    });

    const system = `
You are an emotionally intelligent habit coach using evidence-informed behavior design.

Tone rules:
- Do NOT use first-person language ("I", "me", "my").
- Avoid directive or judgmental phrasing ("you should", "must").
- Use neutral, supportive, instructional phrasing.

Core constraint: MINIMUM-CHANGE PRINCIPLE
- Preserve the same activity and general target.
- Prefer small adjustments rather than dramatic reductions.
- Keep modifiedTask concrete and immediately doable.

IMPORTANT:
- Duration fields are LOCKED and computed from habit metrics (not mood).
- Mood should only influence modifiedTask, tips, and why.

LOCKED fields (must be repeated EXACTLY):
- difficulty
- recommendedDays
- recommendedRange

Return ONLY valid JSON in this exact shape:
{
  "modifiedTask": "string (1 sentence, concrete action for today)",
  "difficulty": "tiny | normal | stretch",
  "tips": ["string", "string", "string"],
  "why": "string (1 sentence explaining the adjustment)",
  "recommendedDays": number,
  "recommendedRange": [number, number],
  "researchNote": "string (1 sentence, no links)",
  "daysWhy": "string (3–6 sentences explaining why recommendedDays is optimal using the provided 5 metrics; no first person)"
}

Tip constraints:
- Exactly 3 tips.
- Each tip must be specific and actionable.
- At least one tip must include an implementation intention (After/When X → Do Y).
- At least one tip must reduce friction (prep, environment, timer, fewer steps).
- At least one tip must address mood regulation appropriate to the mood tag.

Days explanation requirements (daysWhy):
- Explain the five variables in plain language:
  1) Complexity (steps/decisions)
  2) Emotional valence (resistance vs enjoyment)
  3) Environmental friction (setup/activation energy)
  4) Context stability (consistency of cue/timing)
  5) Why factor (identity vs outcome)
- Reference the recommendedRange and explain why the chosen value is placed at a sensible point inside it.
- No guarantees; frame as “time to feel more automatic” and “consistency over intensity”.
`.trim();

    const user = `
Mood tag (used only for task adjustment): ${moodTag}
Habit: ${habitAction}

LOCKED duration outputs (must match exactly):
difficulty: ${calc.difficulty}
recommendedRange: [${calc.recommendedRange[0]}, ${calc.recommendedRange[1]}]
recommendedDays: ${calc.recommendedDays}

Metric breakdown (use for daysWhy):
baseDays: ${calc.breakdown.baseDays}
complexityMultiplier: ${calc.breakdown.complexity.toFixed(2)}
emotionalValenceMultiplier: ${calc.breakdown.emotionalValence.toFixed(2)}
environmentalFrictionMultiplier: ${calc.breakdown.environmentalFriction.toFixed(2)}
contextStabilityMultiplier: ${calc.breakdown.contextStability.toFixed(2)}
whyMultiplier: ${calc.breakdown.whyFactor.toFixed(2)}
frictionComposite: ${calc.breakdown.frictionComposite.toFixed(2)}
rawEtaClamped: ${calc.breakdown.rawEta.toFixed(0)}
positionInRange: ${calc.breakdown.position.toFixed(2)}
`.trim();

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "habit-mood-ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const data = (await resp.json()) as any;

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: data?.error?.message || "OpenRouter error",
        raw: data,
      });
    }

    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "No model content returned" });
    }

    let parsed: MoodAiResponse;
    try {
      parsed = JSON.parse(content) as MoodAiResponse;
    } catch {
      return res.status(500).json({ error: "Model did not return valid JSON", raw: content });
    }

    // Enforce locked values server-side
    parsed.difficulty = calc.difficulty;
    parsed.recommendedRange = calc.recommendedRange;
    parsed.recommendedDays = calc.recommendedDays;

    // Validation
    if (
      !parsed.modifiedTask ||
      typeof parsed.modifiedTask !== "string" ||
      !parsed.why ||
      typeof parsed.why !== "string" ||
      !Array.isArray(parsed.tips) ||
      parsed.tips.length !== 3 ||
      !["tiny", "normal", "stretch"].includes(parsed.difficulty) ||
      typeof parsed.recommendedDays !== "number" ||
      !Array.isArray(parsed.recommendedRange) ||
      parsed.recommendedRange.length !== 2 ||
      typeof parsed.recommendedRange[0] !== "number" ||
      typeof parsed.recommendedRange[1] !== "number" ||
      typeof parsed.researchNote !== "string" ||
      typeof parsed.daysWhy !== "string"
    ) {
      return res.status(500).json({ error: "Bad JSON shape from model", raw: parsed });
    }

    return res.json(parsed);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// Bind to all interfaces so phone can reach it via LAN IP
const PORT = 8787;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI server running on http://0.0.0.0:${PORT}`);
});