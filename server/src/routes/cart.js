import { Router } from "express";
import { pool } from "../db.js";

export function cartRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const { rows } = await pool.query(
        `SELECT book_id AS "bookId", quantity FROM cart_items WHERE user_id = $1`,
        [userId]
      );
      res.json({ ok: true, cart: rows });
    } catch (e) {
      console.error("cart get error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.put("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const items = Array.isArray(req.body?.cart) ? req.body.cart : [];

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

        for (const item of items) {
          const bookId = Number(item?.bookId);
          const quantity = Number(item?.quantity);
          if (Number.isFinite(bookId) && Number.isFinite(quantity) && quantity > 0) {
            await client.query(
              `INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3)
               ON CONFLICT (user_id, book_id) DO UPDATE SET quantity = $3`,
              [userId, bookId, quantity]
            );
          }
        }
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      const { rows } = await pool.query(
        `SELECT book_id AS "bookId", quantity FROM cart_items WHERE user_id = $1`,
        [userId]
      );
      res.json({ ok: true, cart: rows });
    } catch (e) {
      console.error("cart put error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.post("/add", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const bookId = Number(req.body?.bookId);
      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      await pool.query(
        `INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, 1)
         ON CONFLICT (user_id, book_id) DO UPDATE SET quantity = cart_items.quantity + 1`,
        [userId, bookId]
      );

      const { rows } = await pool.query(
        `SELECT book_id AS "bookId", quantity FROM cart_items WHERE user_id = $1`,
        [userId]
      );
      res.json({ ok: true, cart: rows });
    } catch (e) {
      console.error("cart add error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.patch("/item", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const bookId = Number(req.body?.bookId);
      const quantity = Number(req.body?.quantity);

      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });
      if (!Number.isFinite(quantity)) return res.status(400).json({ error: "Bad quantity" });

      if (quantity <= 0) {
        await pool.query(
          "DELETE FROM cart_items WHERE user_id = $1 AND book_id = $2",
          [userId, bookId]
        );
      } else {
        await pool.query(
          `INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, book_id) DO UPDATE SET quantity = $3`,
          [userId, bookId, quantity]
        );
      }

      const { rows } = await pool.query(
        `SELECT book_id AS "bookId", quantity FROM cart_items WHERE user_id = $1`,
        [userId]
      );
      res.json({ ok: true, cart: rows });
    } catch (e) {
      console.error("cart patch error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.delete("/item/:bookId", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      const bookId = Number(req.params.bookId);
      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      await pool.query(
        "DELETE FROM cart_items WHERE user_id = $1 AND book_id = $2",
        [userId, bookId]
      );

      const { rows } = await pool.query(
        `SELECT book_id AS "bookId", quantity FROM cart_items WHERE user_id = $1`,
        [userId]
      );
      res.json({ ok: true, cart: rows });
    } catch (e) {
      console.error("cart delete error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.delete("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;
      await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
      res.json({ ok: true, cart: [] });
    } catch (e) {
      console.error("cart clear error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
