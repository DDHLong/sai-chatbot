import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const cherryPickedKeys = [
  "AZURE_OPENAI_API_DEPLOYMENT_NAME",
  "AZURE_OPENAI_API_VERSION",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_BASE_PATH",
  "AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME",
  "SUPABASE_URL",
  "SUPABASE_API_KEY",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const processEnv = {};
  cherryPickedKeys.forEach((key) => (processEnv[key] = env[key]));

  return {
    define: {
      "process.env": processEnv,
    },
    plugins: [react()],
  };
});
