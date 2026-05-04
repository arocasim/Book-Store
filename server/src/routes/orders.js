import { Router } from "express";
import { pool } from "../db.js";

export function ordersRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;

      const { rows: orders } = await pool.query(
        `SELECT id, total, status, customer_name, customer_email, customer_phone,
                city, address, postal_code, notes, created_at
         FROM orders WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );

      const orderIds = orders.map((o) => o.id);
      let itemsByOrder = {};

      if (orderIds.length > 0) {
        const { rows: items } = await pool.query(
          `SELECT order_id, book_id AS "bookId", quantity, price
           FROM order_items WHERE order_id = ANY($1)`,
          [orderIds]
        );
        for (const item of items) {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
          itemsByOrder[item.order_id].push({
            bookId: item.bookId,
            quantity: item.quantity,
            price: Number(item.price),
          });
        }
      }

      const result = orders.map((o) => ({
        id: String(o.id),
        items: itemsByOrder[o.id] || [],
        total: Number(o.total),
        status: o.status,
        dateIso: o.created_at?.toISOString() || "",
        customer: {
          name: o.customer_name || "",
          email: o.customer_email || "",
          phone: o.customer_phone || "",
          city: o.city || "",
          address: o.address || "",
          postalCode: o.postal_code || "",
          notes: o.notes || "",
        },
      }));

      res.json({ ok: true, orders: result });
    } catch (e) {
      console.error("get orders error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const userId = req.dbUser.id;

      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const total = Number(req.body?.total ?? 0);
      const customer = req.body?.customer ?? {};

      if (items.length === 0) return res.status(400).json({ error: "Empty cart" });
      if (!Number.isFinite(total) || total <= 0) return res.status(400).json({ error: "Bad total" });

      const c = {
        name: String(customer.name ?? ""),
        email: String(customer.email ?? ""),
        phone: String(customer.phone ?? ""),
        city: String(customer.city ?? ""),
        address: String(customer.address ?? ""),
        postalCode: String(customer.postalCode ?? ""),
        notes: String(customer.notes ?? ""),
      };

      if (!c.name || !c.email || !c.phone || !c.city || !c.address || !c.postalCode) {
        return res.status(400).json({ error: "Missing customer fields" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const { rows } = await client.query(
          `INSERT INTO orders (user_id, total, status, customer_name, customer_email,
                               customer_phone, city, address, postal_code, notes)
           VALUES ($1, $2, 'Підтверджено', $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [userId, total, c.name, c.email, c.phone, c.city, c.address, c.postalCode, c.notes]
        );
        const orderId = rows[0].id;

        for (const item of items) {
          const bookId = Number(item?.bookId);
          const quantity = Number(item?.quantity);
          const price = Number(item?.price ?? 0);
          if (Number.isFinite(bookId) && Number.isFinite(quantity) && quantity > 0) {
            await client.query(
              `INSERT INTO order_items (order_id, book_id, quantity, price)
               VALUES ($1, $2, $3, $4)`,
              [orderId, bookId, quantity, price]
            );
          }
        }

        await client.query("COMMIT");
        res.json({ ok: true, orderId: String(orderId) });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("create order error:", e);
      res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return router;
}
