import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "5mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Persona instructions
const PERSONA_STYLES: Record<string, string> = {
  santai: `Gaya bicaramu santai banget, natural, asik, ala anak muda / bestie tongkrongan yang supel. Pakai kata 'gue' dan 'lu' (atau 'lo'), santuy, gokil, mantap, seru, jujur. Jangan kaku sama sekali. Tampilkan kepribadian Jevin si karakter berkerudung biru yang chill dan asik diajak ngobrol apa aja.`,
  kalem: `Gaya bicaramu kalem, adem, hangat, dan pengertian. Enak diajak ngobrol santai atau curhat ringan. Tetap santai dan akrab tanpa basa-basi formal.`,
  humor: `Gaya bicaramu penuh humor, celetukan santai yang bikin tersenyum atau ngakak, jenaka dan seru.`,
  kritis: `Gaya bicaramu santai tapi punya wawasan mendalam dan opini tajam, lugas namun tetap dengan bahasa obrolan santai yang mudah dicerna.`,
};

// Base system prompt for Jevin
function buildSystemInstruction(persona = "santai") {
  const personaDesc = PERSONA_STYLES[persona] || PERSONA_STYLES.santai;

  return `Kamu adalah "Jevin", AI chatbot teman ngobrol yang super santai, seru, bersahabat, dan punya wawasan luas.
Visualmu adalah karakter biru lucu berkerudung/hoodie dengan mata setengah tertutup yang santai dan chill.

Panduan Karakter:
1. ${personaDesc}
2. Jawab pertanyaan pengguna secara akurat, alami, dan informatif dengan gaya percakapan yang mengalir natural tanpa terdengar seperti robot korporat.
3. Selalu jawab secara teks percakapan biasa (chat natural). JANGAN gunakan format kartu JSON atau blok terstruktur khusus.
4. Format penulisan teks seperti bold (**kata penting**), bullet point, atau list diperbolehkan agar pesan nyaman dan enak dibaca.`;
}

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], persona = "santai" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    const systemInstruction = buildSystemInstruction(persona);

    if (!ai) {
      return res.json({
        reply: `Santai bro! Pertanyaan atau obrolan lu: "${message}" asik banget. Kebetulan gue lagi mode offline nih, tapi kapanpun lu butuh teman ngobrol santai, Jevin siap nemenin!`,
      });
    }

    // Format contents for Gemini
    const contents: any[] = [];

    // History (limit to last 12 for context window efficiency)
    const recentHistory = history.slice(-12);
    for (const h of recentHistory) {
      if (h.role === "user" || h.role === "model") {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }],
        });
      }
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let rawText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
          topP: 0.95,
        },
      });
      rawText = response.text || "";
    } catch (apiErr: any) {
      console.warn("Primary gemini-3.1-flash-lite error, trying gemini-3.8-flash:", apiErr?.message);
      try {
        const backupResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.85,
          },
        });
        rawText = backupResponse.text || "";
      } catch (backupErr) {
        console.warn("Backup call unavailable, using friendly fallback:", backupErr);
        return res.json({
          reply: `Halo bro! Sori tadi koneksi agak padat dikit. Tapi intinya pesan lu udah masuk, santai aja dan coba sapa gue lagi ya!`,
        });
      }
    }

    return res.json({
      reply: rawText.trim(),
    });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({
      error: "Waduh, Jevin lagi pusing dikit nih. Coba kirim ulang ya bro!",
      details: err?.message || String(err),
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite or Static Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Jevin Chatbot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
