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

type MoodAiResponse = {
  modifiedTask: string;
  difficulty: "tiny" | "normal" | "stretch";
  tips: string[];
  why: string;

  // research-based duration outputs
  recommendedDays: number;
  recommendedRange: [number, number];
  researchNote: string;
};

app.post("/api/mood-task", async (req: Request, res: Response) => {
  try {
    const { moodTag, habitAction } = req.body as {
      moodTag?: MoodTag;
      habitAction?: string;
    };

    if (!moodTag || !habitAction) {
      return res.status(400).json({ error: "Missing moodTag or habitAction" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY in server/.env" });
    }

    const system = `
You are an emotionally intelligent habit coach.

User selects ONE mood tag describing how they feel right now.
Adjust today's habit task to fit that emotional state.

Return ONLY valid JSON in this exact shape:
{
  "modifiedTask": "string (1 sentence, concrete action)",
  "difficulty": "tiny | normal | stretch",
  "tips": ["string", "string", "string"],
  "why": "string (1 sentence explaining the adjustment)",
  "recommendedDays": number,
  "recommendedRange": [number, number],
  "researchNote": "string (1 sentence, no links)"
}

Habit duration guidance (research-based):
- There is no single fixed number of days to form a habit.
- Habit automaticity research shows wide variation; use an evidence-based window.
- Map by difficulty:
  - tiny: 18–30 days
  - normal: 30–66 days
  - stretch: 66–120 days
- Pick recommendedDays inside the range.
- Do NOT claim certainty or guarantees—frame as "time to feel more automatic."

Mood guidance:
- stressed/anxious/overwhelmed -> tiny task, calming tone, reduce friction
- low_energy/sad -> tiny or normal, compassion + momentum framing
- neutral -> normal, simple structure
- focused/energized -> normal or stretch, leverage momentum

Rules:
- No shame, no guilt.
- Avoid "you should".
- Tips must be specific + actionable.
- Optimize for consistency, not intensity.
`.trim();

    const user = `
Mood tag: ${moodTag}
Habit: ${habitAction}
`.trim();

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional, but recommended by OpenRouter:
        "HTTP-Referer": "http://localhost",
        "X-Title": "habit-mood-ai"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: data?.error?.message || "OpenRouter error",
        raw: data
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

    // Validation: ensure the model returned the expected shape
    if (
      !parsed.modifiedTask ||
      !parsed.why ||
      !Array.isArray(parsed.tips) ||
      !["tiny", "normal", "stretch"].includes(parsed.difficulty) ||
      typeof parsed.recommendedDays !== "number" ||
      !Array.isArray(parsed.recommendedRange) ||
      parsed.recommendedRange.length !== 2 ||
      typeof parsed.recommendedRange[0] !== "number" ||
      typeof parsed.recommendedRange[1] !== "number" ||
      typeof parsed.researchNote !== "string"
    ) {
      return res.status(500).json({ error: "Bad JSON shape from model", raw: parsed });
    }

    return res.json(parsed);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// Bind to all interfaces so your phone can reach it via LAN IP
const PORT = 8787;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI server running on http://0.0.0.0:${PORT}`);
});