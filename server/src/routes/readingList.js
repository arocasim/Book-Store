import { Router } from "express";
import { pool } from "../db.js";

export function readingListRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const { rows } = await pool.query(
        "SELECT book_id FROM reading_list WHERE user_id = $1 ORDER BY added_at DESC",
        [userId]
      );
      res.json({ ok: true, readingList: rows.map((r) => r.book_id) });
    } catch (e) {
      console.error("reading-list get error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const bookId = Number(req.body?.bookId);
      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      await pool.query(
        `INSERT INTO reading_list (user_id, book_id) VALUES ($1, $2)
         ON CONFLICT (user_id, book_id) DO NOTHING`,
        [userId, bookId]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("reading-list add error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.delete("/:bookId", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const bookId = Number(req.params.bookId);
      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      await pool.query(
        "DELETE FROM reading_list WHERE user_id = $1 AND book_id = $2",
        [userId, bookId]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("reading-list remove error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
