import { Router } from "express";
import { dbAdmin } from "../firebaseAdmin.js";

export function offersRouter() {
  const router = Router();

  // GET /api/offers (публічний)
  router.get("/", async (req, res) => {
    try {
      const snap = await dbAdmin
        .collection("offers")
        .where("active", "==", true)
        .orderBy("discount", "desc")
        .get();

      const offers = snap.docs.map((d) => {
        const data = d.data() || {};
        const rawIds = Array.isArray(data.bookIds) ? data.bookIds : [];
        const bookIds = rawIds
          .map((x) => Number(x))
          .filter((n) => Number.isFinite(n));

        return {
          id: d.id,
          title: String(data.title ?? ""),
          description: String(data.description ?? ""),
          bookIds,
          originalPrice: Number(data.originalPrice ?? 0),
          discountedPrice: Number(data.discountedPrice ?? 0),
          discount: Number(data.discount ?? 0),
          active: data.active === undefined ? true : Boolean(data.active),
        };
      });

      return res.json({ ok: true, offers });
    } catch (e) {
      console.error("get offers error:", e);
      return res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
