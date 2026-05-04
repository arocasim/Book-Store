import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export function booksRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { rows: books } = await pool.query(`
        SELECT b.id, b.title, a.name AS author, c.name AS category,
               p.name AS publisher, b.isbn, b.price, b.original_price AS "originalPrice",
               b.discount, b.description, b.image, b.rating, b.pages,
               b.language, b.year, b.featured, b.special
        FROM books b
        JOIN authors a ON b.author_id = a.id
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN publishers p ON b.publisher_id = p.id
        ORDER BY b.title ASC
      `);

      const { rows: reviews } = await pool.query(`
        SELECT r.id, r.book_id, r.rating, r.comment, r.created_at,
               u.name AS "userName", u.firebase_uid AS "userId"
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `);

      const reviewsByBook = {};
      for (const r of reviews) {
        if (!reviewsByBook[r.book_id]) reviewsByBook[r.book_id] = [];
        reviewsByBook[r.book_id].push({
          id: r.id,
          userId: r.userId,
          userName: r.userName,
          rating: r.rating,
          comment: r.comment,
          date: r.created_at?.toISOString().split("T")[0] || "",
        });
      }

      for (const book of books) {
        book.reviews = reviewsByBook[book.id] || [];
        book.price = Number(book.price);
        book.originalPrice = book.originalPrice ? Number(book.originalPrice) : undefined;
        book.discount = book.discount ? Number(book.discount) : undefined;
        book.rating = Number(book.rating) || 0;
      }

      res.json({ ok: true, books });
    } catch (e) {
      console.error("get books error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.post("/:id/reviews", requireAuth, async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const bookId = Number(req.params.id);

      const rating = Number(req.body?.rating);
      const comment = String(req.body?.comment ?? "").trim();

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Bad rating" });
      }

      const bookCheck = await pool.query("SELECT id FROM books WHERE id = $1", [bookId]);
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ error: "Book not found" });
      }

      const { rows } = await pool.query(
        `INSERT INTO reviews (book_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (book_id, user_id) DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP
         RETURNING id, rating, comment, created_at`,
        [bookId, userId, rating, comment]
      );

      const review = rows[0];
      const ratingResult = await pool.query(
        "SELECT rating FROM books WHERE id = $1",
        [bookId]
      );

      return res.json({
        ok: true,
        review: {
          id: review.id,
          userId: req.dbUser.firebase_uid,
          userName: req.dbUser.name,
          rating: review.rating,
          comment: review.comment,
          date: review.created_at?.toISOString().split("T")[0] || "",
        },
        rating: Number(ratingResult.rows[0]?.rating) || 0,
      });
    } catch (e) {
      console.error("add review error:", e);
      return res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
