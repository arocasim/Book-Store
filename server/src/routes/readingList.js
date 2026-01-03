import { Router } from "express";
import { dbAdmin } from "../firebaseAdmin.js";

export function readingListRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const uid = req.user.uid;

      const snap = await dbAdmin.collection("users").doc(uid).get();
      const data = snap.exists ? snap.data() : {};
      const list = Array.isArray(data?.readingList) ? data.readingList : [];

      res.json({ ok: true, readingList: list });
    } catch (e) {
      console.error("reading-list get error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const uid = req.user.uid;
      const bookId = Number(req.body?.bookId);

      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      const uref = dbAdmin.collection("users").doc(uid);

      await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(uref);
        const data = snap.exists ? snap.data() : {};
        const current = Array.isArray(data?.readingList) ? data.readingList : [];

        // щоб не було дубля
        const set = new Set(current.map((x) => Number(x)));
        set.add(bookId);

        tx.set(uref, { readingList: Array.from(set) }, { merge: true });
      });

      res.json({ ok: true });
    } catch (e) {
      console.error("reading-list add error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.delete("/:bookId", async (req, res) => {
    try {
      const uid = req.user.uid;
      const bookId = Number(req.params.bookId);

      if (!Number.isFinite(bookId)) return res.status(400).json({ error: "Bad bookId" });

      const uref = dbAdmin.collection("users").doc(uid);

      await dbAdmin.runTransaction(async (tx) => {
        const snap = await tx.get(uref);
        const data = snap.exists ? snap.data() : {};
        const current = Array.isArray(data?.readingList) ? data.readingList : [];

        const next = current.map((x) => Number(x)).filter((id) => id !== bookId);

        tx.set(uref, { readingList: next }, { merge: true });
      });

      res.json({ ok: true });
    } catch (e) {
      console.error("reading-list remove error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
