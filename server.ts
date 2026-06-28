import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Route for Image Generation
app.post("/api/generate-image", async (req, res) => {
  const { prompt, aspectRatio = "1:1" } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.");
    }

    console.log("Generating image with prompt:", prompt);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      // Sometimes it might return text instead of an image
      let textResponse = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.text) {
          textResponse += part.text;
        }
      }
      throw new Error(textResponse || "No image data returned from model");
    }

    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Image generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// API Route for AI Meal Recommendations based on Mood & Budget
app.post("/api/ai-recommend", async (req, res) => {
  const { mood, budget, preference, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Menu items catalog is required for recommendation" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.");
    }

    const sysPrompt = `You are a warm, witty, extremely friendly local Yoruba chef and nutritionist from Ibadan, Nigeria who cooks for the hard-working class (corporate workers, techies, bankers). 
Your task is to recommend exactly ONE menu item (and optional size/extras) from the provided list of available dishes that perfectly matches the user's current physical state/mood, budget, and dietary preference.

User Mood/State: "${mood || 'Tired'}"
Max Budget: ${budget ? `₦${budget}` : "No limit"}
Dietary focus/preference: "${preference || 'Anything goes'}"

Here are the available dishes:
${JSON.stringify(items.map(it => ({ id: it.id, name: it.name, description: it.description, price: it.price, category: it.category, sizes: it.sizes, extras: it.extras })))}

Respond with a JSON object containing:
- "recommendedItemId": The string ID of the recommended item. Must match one of the available items exactly.
- "selectedSizeName": (Optional) Name of a size if the recommended item has multiple sizes.
- "selectedExtrasNames": (Optional array of strings) Names of extras from the item's custom extras list or standard extras that perfectly pair with this.
- "reasoning": A humorous, heartwarming explanation (2-3 sentences) in your Ibadan chef persona about why this is exactly what their soul, mind, and body need right now. Mention local references like traffic on Ring Road, Ibadan sun, or long work meetings.
- "proverb": A culinary Yoruba proverb translated to English, celebrating the joy of food and wellness.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: sysPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            recommendedItemId: { type: "STRING" },
            selectedSizeName: { type: "STRING" },
            selectedExtrasNames: { 
              type: "ARRAY", 
              items: { type: "STRING" } 
            },
            reasoning: { type: "STRING" },
            proverb: { type: "STRING" }
          },
          required: ["recommendedItemId", "reasoning", "proverb"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText);
    res.json(resultObj);
  } catch (error: any) {
    console.error("AI recommendation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI recommendation" });
  }
});

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
