// backend/src/config/env.js
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// From src/config/env.js, go up two levels to reach backend/.env
const envPath = join(__dirname, "../../.env");

console.log(`📍 Looking for .env file at: ${envPath}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Failed to load .env file:", result.error.message);
  console.error("❌ Make sure your .env file exists at:", envPath);
  process.exit(1);
} else {
  console.log("✅ Environment variables loaded successfully from:", envPath);
}

// Debug environment variables
// console.log("=== Environment Variables Debug ===");
// console.log("NODE_ENV:", process.env.NODE_ENV);
// console.log("PORT:", process.env.PORT);
// console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Found" : "❌ Missing");
// console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ Found" : "❌ Missing");
// console.log("GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID ? "✅ Found" : "❌ Missing");
// console.log("GITHUB_CLIENT_SECRET:", process.env.GITHUB_CLIENT_SECRET ? "✅ Found" : "❌ Missing");
console.log("===================================");

// Check for required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  console.error("Please check your .env file and ensure it contains all required variables.");
  process.exit(1);
}