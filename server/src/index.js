import express from "express";
import cors from "cors";

import { requireAuth } from "./middleware/requireAuth.js";
import { ordersRouter } from "./routes/orders.js";
import { booksRouter } from "./routes/books.js";
import { offersRouter } from "./routes/offers.js";
import { readingListRouter } from "./routes/readingList.js";
import { cartRouter } from "./routes/cart.js";

const app = express();
app.use(cors());
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
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
