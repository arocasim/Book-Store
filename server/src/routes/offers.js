import { Router } from "express";
import { pool } from "../db.js";

export function offersRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { rows: offers } = await pool.query(`
        SELECT id, title, description, original_price AS "originalPrice",
               discounted_price AS "discountedPrice", discount, active
        FROM special_offers
        WHERE active = TRUE
        ORDER BY discount DESC
      `);

      const offerIds = offers.map((o) => o.id);
      let booksByOffer = {};

      if (offerIds.length > 0) {
        const { rows: links } = await pool.query(
          `SELECT offer_id, book_id FROM special_offer_books WHERE offer_id = ANY($1)`,
          [offerIds]
        );
        for (const link of links) {
          if (!booksByOffer[link.offer_id]) booksByOffer[link.offer_id] = [];
          booksByOffer[link.offer_id].push(link.book_id);
        }
      }

      const result = offers.map((o) => ({
        id: String(o.id),
        title: o.title,
        description: o.description || "",
        bookIds: booksByOffer[o.id] || [],
        originalPrice: Number(o.originalPrice),
        discountedPrice: Number(o.discountedPrice),
        discount: Number(o.discount),
        active: o.active,
      }));

      res.json({ ok: true, offers: result });
    } catch (e) {
      console.error("get offers error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
