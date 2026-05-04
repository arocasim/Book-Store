import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dbAdmin } from "../firebaseAdmin.js";

let cachedBooks = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getBooks() {
  if (cachedBooks && Date.now() - cacheTime < CACHE_TTL) return cachedBooks;

  const snap = await dbAdmin.collection("books").get();
  cachedBooks = snap.docs.map((d) => ({ ...d.data(), id: Number(d.id) }));
  cacheTime = Date.now();
  return cachedBooks;
}

export function aiRouter() {
  const router = Router();

  router.post("/recommend", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "AI-сервіс не налаштовано. Додайте GEMINI_API_KEY.",
        });
      }

      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Повідомлення обов'язкове" });
      }

      if (message.trim().length > 500) {
        return res.status(400).json({ error: "Повідомлення занадто довге (макс. 500 символів)" });
      }

      const books = await getBooks();

      const booksContext = books
        .map(
          (b) =>
            `[ID:${b.id}] "${b.title}" — ${b.author} | Категорія: ${b.category} | ${b.price}₴ | Рейтинг: ${(b.rating || 0).toFixed(1)} | ${(b.description || "").substring(0, 200)}`
        )
        .join("\n");

      const prompt = `Ти — AI-консультант книжкового магазину "Книжковий Світ". Користувач шукає книгу.

ПРАВИЛА:
1. Відповідай ТІЛЬКИ українською мовою
2. Рекомендуй ТІЛЬКИ книги з каталогу нижче — НЕ вигадуй
3. Рекомендуй від 1 до 3 найбільш підходящих книг
4. Якщо нічого не підходить ідеально — порекомендуй найближче
5. Будь коротким і конкретним

КАТАЛОГ:
${booksContext}

ЗАПИТ КОРИСТУВАЧА: "${message.trim()}"

Відповідай у форматі JSON:
{
  "message": "Короткий коментар (1-2 речення)",
  "recommendations": [
    { "bookId": <ID з каталогу>, "reason": "Чому підходить (1 речення)" }
  ]
}`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { message: text, recommendations: [] };
      }

      const validRecs = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
        .filter((r) => {
          const id = Number(r?.bookId);
          return Number.isFinite(id) && books.some((b) => b.id === id);
        })
        .map((r) => ({
          bookId: Number(r.bookId),
          reason: String(r.reason || ""),
        }));

      return res.json({
        ok: true,
        message: String(parsed.message || ""),
        recommendations: validRecs,
      });
    } catch (e) {
      console.error("AI recommend error:", e);
      return res.status(500).json({
        error: e?.message?.includes("API_KEY")
          ? "Невірний API ключ Gemini"
          : "Помилка AI-сервісу. Спробуйте пізніше.",
      });
    }
  });

  return router;
}
