import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import dotenv from "dotenv";

dotenv.config();
const filePath = "docs";

// @supabase/supabase-js
try {
  const directoryLoader = new DirectoryLoader(filePath, {
    ".txt": (path) => new TextLoader(path),
    ".csv": (path) => new CSVLoader(path),
  });

  const rawDocs = await directoryLoader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const output = await splitter.splitDocuments(rawDocs);

  const sbApiKey = process.env.SUPABASE_API_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const client = createClient(sbUrl, sbApiKey);

  const res = await SupabaseVectorStore.fromDocuments(
    output,
    new OpenAIEmbeddings(),
    {
      client,
      tableName: "documents",
    }
  );
  console.log("res", res);
} catch (err) {
  console.log(err);
}
