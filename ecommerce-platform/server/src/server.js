import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import products from "./routes/products.js";
import categories from "./routes/categories.js";
import checkout from "./routes/checkout.js";
import payments from "./routes/payments.js";
import orders from "./routes/orders.js";
import admin from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/errors.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173", credentials: true }));
app.use("/api/payments/paystack/webhook", express.json({
  verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); }
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "ecommerce-api" }));
app.use("/api/products", products);
app.use("/api/categories", categories);
app.use("/api/checkout", checkout);
app.use("/api/payments", payments);
app.use("/api/orders", orders);
app.use("/api/admin", admin);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, "0.0.0.0", () => console.log(`E-commerce API listening on ${port}`));
