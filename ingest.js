import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings }
from "@langchain/community/embeddings/hf_transformers";
const DATA_FOLDER = path.resolve("./data");
const VECTOR_FOLDER = path.resolve("./vectordb");
export async function ingestSyllabus() {
  try {
    console.log("Starting Syllabus Ingestion...");
    if (!fs.existsSync(DATA_FOLDER)) {
      console.error(" data folder not found at:", DATA_FOLDER);
      return;
    }
    const pdfFiles = fs.readdirSync(DATA_FOLDER)
      .filter(file => file.toLowerCase().endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.error(" No PDF files found inside data folder");
      return;
    }
    console.log(`Found ${pdfFiles.length} PDF(s)`);
    const documents = [];
    for (const file of pdfFiles) {
      const filePath = path.join(DATA_FOLDER, file);
      console.log(`Reading: ${file}`);
      try {
        const buffer = fs.readFileSync(filePath);
        const parsed = await pdf(buffer);
        if (!parsed.text || parsed.text.trim().length === 0) {
          console.warn(` No readable text in ${file}`);
          continue;
        }
        documents.push({
          pageContent: parsed.text,
          metadata: { source: file }
        });
      } catch (pdfError) {
        console.error(`Failed reading ${file}`, pdfError.message);
      }
    }
    if (documents.length === 0) {
      console.error(" No valid content extracted from PDFs");
      return;
    }
    console.log("Creating embeddings...");
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2"
    });
    console.log("Building FAISS Vector DB...");
    const vectorStore = await FaissStore.fromDocuments(
      documents,
      embeddings
    );
    await vectorStore.save(VECTOR_FOLDER);
    console.log(" VectorDB Successfully Created At:");
    console.log(VECTOR_FOLDER);
  } catch (error) {
    console.error(" INGEST FAILED:");
    console.error(error.message);
  }
}

