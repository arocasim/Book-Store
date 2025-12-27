import express from "express";
import cors from "cors";

import { requireAuth } from "./middleware/requireAuth.js";
import { ordersRouter } from "./routes/orders.js";
import { booksRouter } from "./routes/books.js";
import { offersRouter } from "./routes/offers.js";
import { readingListRouter } from "./routes/readingList.js";
import { cartRouter } from "./routes/cart.js";

const app = express();

const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // healthcheck / postman
      if (allowed.length === 0) return cb(null, true); // якщо не вказано — пускає всіх (на тест)
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "bookstore-server", time: new Date().toISOString() });
});

app.use("/api/orders", requireAuth, ordersRouter());
app.use("/api/books", booksRouter());
app.use("/api/offers", offersRouter());
app.use("/api/reading-list", requireAuth, readingListRouter());
app.use("/api/cart", requireAuth, cartRouter());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
