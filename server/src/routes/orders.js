import { Router } from "express";
import { dbAdmin } from "../firebaseAdmin.js";

export function ordersRouter() {
  const router = Router();

  // GET /api/orders
  router.get("/", async (req, res) => {
    try {
      const uid = req.user.uid;

      const snap = await dbAdmin
        .collection("users")
        .doc(uid)
        .collection("orders")
        .orderBy("dateIso", "desc")
        .limit(50)
        .get();

      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      res.json({ ok: true, orders });
    } catch (e) {
      console.error("get orders error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  // POST /api/orders
  router.post("/", async (req, res) => {
    try {
      const uid = req.user.uid;

      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const total = Number(req.body?.total ?? 0);
      const customer = req.body?.customer ?? {};

      const payload = {
        items,
        total,
        status: "Підтверджено",
        dateIso: new Date().toISOString(),
        customer: {
          name: String(customer.name ?? ""),
          email: String(customer.email ?? ""),
          phone: String(customer.phone ?? ""),
          city: String(customer.city ?? ""),
          address: String(customer.address ?? ""),
          postalCode: String(customer.postalCode ?? ""),
          notes: String(customer.notes ?? ""),
        },
      };

      if (payload.items.length === 0) return res.status(400).json({ error: "Empty cart" });
      if (!Number.isFinite(payload.total) || payload.total <= 0) return res.status(400).json({ error: "Bad total" });

      const c = payload.customer;
      if (!c.name || !c.email || !c.phone || !c.city || !c.address || !c.postalCode) {
        return res.status(400).json({ error: "Missing customer fields" });
      }

      const ref = await dbAdmin
        .collection("users")
        .doc(uid)
        .collection("orders")
        .add(payload);

      res.json({ ok: true, orderId: ref.id });
    } catch (e) {
      console.error("create order error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
