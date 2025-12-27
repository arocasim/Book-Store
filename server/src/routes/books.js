import { Router } from "express";
import { dbAdmin } from "../firebaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

export function booksRouter() {
  const router = Router();

  // GET /api/books
  router.get("/", async (req, res) => {
    try {
      const snap = await dbAdmin.collection("books").orderBy("title", "asc").get();

      const books = snap.docs.map((d) => ({
        ...d.data(),
        id: Number(d.id),
      }));

      res.json({ ok: true, books });
    } catch (e) {
      console.error("get books error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // ✅ POST /api/books/:id/reviews  (тільки для залогінених)
  router.post("/:id/reviews", requireAuth, async (req, res) => {
    try {
      const uid = req.user.uid;
      const bookId = String(req.params.id);

      const rating = Number(req.body?.rating);
      const comment = String(req.body?.comment ?? "").trim();
      const userName = String(req.body?.userName ?? "").trim() || "Користувач";

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Bad rating" });
      }

      const bookRef = dbAdmin.collection("books").doc(bookId);
      const snap = await bookRef.get();
      if (!snap.exists) return res.status(404).json({ error: "Book not found" });

      const book = snap.data() || {};
      const reviews = Array.isArray(book.reviews) ? book.reviews : [];

      const newReview = {
        id: Date.now(), // щоб точно унікальний
        userId: uid,
        userName,
        rating,
        comment,
        date: new Date().toISOString().split("T")[0],
      };

      const nextReviews = [...reviews, newReview];

      // перерахунок середнього рейтингу
      const sum = nextReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
      const nextRating = nextReviews.length ? sum / nextReviews.length : 0;

      await bookRef.update({
        reviews: nextReviews,
        rating: nextRating,
      });

      return res.json({
        ok: true,
        review: newReview,
        rating: nextRating,
        reviewsCount: nextReviews.length,
      });
    } catch (e) {
      console.error("add review error:", e);
      return res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
