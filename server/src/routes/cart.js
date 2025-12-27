import { Router } from "express";
import { dbAdmin } from "../firebaseAdmin.js";

const normalizeCart = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => ({
      bookId: Number(x?.bookId),
      quantity: Number(x?.quantity),
    }))
    .filter((x) => Number.isFinite(x.bookId) && Number.isFinite(x.quantity) && x.quantity > 0);
};

export function cartRouter() {
  const router = Router();

  // GET /api/cart -> поточний кошик юзера
  router.get("/", async (req, res) => {
    try {
      const uid = req.user.uid;

      const snap = await dbAdmin.collection("users").doc(uid).get();
      const data = snap.exists ? snap.data() : {};
      const cart = normalizeCart(data?.cart);

      res.json({ ok: true, cart });
    } catch (e) {
      console.error("cart get error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // PUT /api/cart -> замінити кошик повністю (body: { cart: [...] })
  router.put("/", async (req, res) => {
    try {
      const uid = req.user.uid;
      const next = normalizeCart(req.body?.cart);

      await dbAdmin.collection("users").doc(uid).set({ cart: next }, { merge: true });
      res.json({ ok: true, cart: next });
    } catch (e) {
      console.error("cart put error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // POST /api/cart/add -> +1 книга (body: { bookId })
  router.post("/add", async (req, res) => {
    try {
      const uid = req.user.uid;
      const bookId = Number(req.body?.bookId);
      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      const uref = dbAdmin.collection("users").doc(uid);

      const cart = await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(uref);
        const data = snap.exists ? snap.data() : {};
        const current = normalizeCart(data?.cart);

        const map = new Map(current.map((i) => [i.bookId, i.quantity]));
        map.set(bookId, (map.get(bookId) || 0) + 1);

        const next = Array.from(map.entries()).map(([bookId, quantity]) => ({ bookId, quantity }));
        tx.set(uref, { cart: next }, { merge: true });
        return next;
      });

      res.json({ ok: true, cart });
    } catch (e) {
      console.error("cart add error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // PATCH /api/cart/item -> виставити quantity (body: { bookId, quantity })
  router.patch("/item", async (req, res) => {
    try {
      const uid = req.user.uid;
      const bookId = Number(req.body?.bookId);
      const quantity = Number(req.body?.quantity);

      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });
      if (!Number.isFinite(quantity)) return res.status(400).json({ error: "Bad quantity" });

      const uref = dbAdmin.collection("users").doc(uid);

      const cart = await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(uref);
        const data = snap.exists ? snap.data() : {};
        const current = normalizeCart(data?.cart);

        const map = new Map(current.map((i) => [i.bookId, i.quantity]));
        if (quantity <= 0) map.delete(bookId);
        else map.set(bookId, quantity);

        const next = Array.from(map.entries()).map(([bookId, quantity]) => ({ bookId, quantity }));
        tx.set(uref, { cart: next }, { merge: true });
        return next;
      });

      res.json({ ok: true, cart });
    } catch (e) {
      console.error("cart patch error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // DELETE /api/cart/item/:bookId -> прибрати книгу
  router.delete("/item/:bookId", async (req, res) => {
    try {
      const uid = req.user.uid;
      const bookId = Number(req.params.bookId);
      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      const uref = dbAdmin.collection("users").doc(uid);

      const cart = await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(uref);
        const data = snap.exists ? snap.data() : {};
        const current = normalizeCart(data?.cart);

        const next = current.filter((i) => i.bookId !== bookId);
        tx.set(uref, { cart: next }, { merge: true });
        return next;
      });

      res.json({ ok: true, cart });
    } catch (e) {
      console.error("cart delete error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // DELETE /api/cart -> очистити кошик
  router.delete("/", async (req, res) => {
    try {
      const uid = req.user.uid;
      await dbAdmin.collection("users").doc(uid).set({ cart: [] }, { merge: true });
      res.json({ ok: true, cart: [] });
    } catch (e) {
      console.error("cart clear error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
