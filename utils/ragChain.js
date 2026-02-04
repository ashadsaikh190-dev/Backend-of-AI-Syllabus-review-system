import dotenv from "dotenv";
dotenv.config();

import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "./prompt.js";

if (!process.env.GROQ_API_KEY) {
  throw new Error(" GROQ_API_KEY missing in .env");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const VECTORSTORE_PATH = "./vectordb";

export const askDoubt = async (question, mode = "simple") => {
  try {
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });
    const vectorStore = await FaissStore.load(
      VECTORSTORE_PATH,
      embeddings
    );
    const docs = await vectorStore.similaritySearch(question, 3);

    if (!docs || docs.length === 0) {
      return "This topic is not available in your syllabus.";
    }
    const context = docs.map(doc => doc.pageContent).join("\n");
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `
Answer in a ${mode}, student-friendly way.

Context:
${context}

Question:
${question}
          `,
        },
      ],
    });
    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error(" RAG Error:", error);
    return "Something went wrong while answering. Please try again.";
  }
};

