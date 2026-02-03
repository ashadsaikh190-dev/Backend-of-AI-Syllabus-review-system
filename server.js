import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import { ingestSyllabus } from "./ingest.js";
import { askDoubt } from "./utils/ragChain.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const VECTORSTORE_PATH = "./vectorstore";

const startServer = async () => {
  // Auto-ingest if vectorstore missing
  if (!fs.existsSync(VECTORSTORE_PATH)) {
    console.log("📦 VectorDB not found. Running ingestion...");
    await ingestSyllabus();
  } else {
    console.log("✅ VectorDB already exists");
  }

  app.get("/", (req, res) => res.send("✅ Server is running"));

  app.post("/ask", async (req, res) => {
    const { question, mode } = req.body;
    if (!question) return res.json({ answer: "Please ask a valid question." });

    try {
      const answer = await askDoubt(question, mode);
      res.json({ answer });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`🚀 AI Doubt Resolver running on http://localhost:${PORT}`);
  });
};

// Start server inside async function
startServer().catch(err => {
  console.error("Server failed to start:", err);
});
