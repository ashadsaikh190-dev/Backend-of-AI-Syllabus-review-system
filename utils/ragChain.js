import dotenv from "dotenv";
dotenv.config();

import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "./prompt.js";

if (!process.env.GROQ_API_KEY) {
  throw new Error("❌ GROQ_API_KEY missing in .env");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const VECTORSTORE_PATH = "./vectordb";

export const askDoubt = async (question, mode = "step-by-step") => {

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

  const vectorStore = await FaissStore.load(VECTORSTORE_PATH, embeddings);

  const docs = await vectorStore.similaritySearch(question, 3);

  if (docs.length === 0) {
    return "This topic is not covered in your syllabus.";
  }

  const context = docs.map(d => d.pageContent).join("\n");

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `
Context:
${context}

Question:
${question}

Explanation mode: ${mode}
`,
      },
    ],
  });

  return completion.choices[0].message.content;
};
