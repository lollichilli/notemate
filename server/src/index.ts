import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;


const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "notemate-api" });
});

app.get("/", (_req, res) => {
    res.send("NoteMate API is running");
  });
  
if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
}
  
mongoose
.connect(MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
});

  app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
