import { authAdmin } from "../firebaseAdmin.js";
import { pool } from "../db.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = await authAdmin.verifyIdToken(token);
    req.user = decoded;

    const { rows } = await pool.query(
      `INSERT INTO users (firebase_uid, name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, firebase_uid, name, email`,
      [
        decoded.uid,
        decoded.name || decoded.email?.split("@")[0] || "Користувач",
        decoded.email || "",
      ]
    );
    req.dbUser = rows[0];

    next();
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Invalid token" });
  }
}
