import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Read .env file manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

console.log(".env File Credentials:");
console.log("CLIENT_ID:", envVars["NOMBA_CLIENT_ID"]);
console.log("PRIVATE_KEY length:", envVars["NOMBA_PRIVATE_KEY"]?.length);
console.log("PRIVATE_KEY prefix:", envVars["NOMBA_PRIVATE_KEY"]?.slice(0, 15));

console.log("\nInjected System Process Credentials:");
console.log("CLIENT_ID:", process.env.NOMBA_CLIENT_ID);
console.log("PRIVATE_KEY length:", process.env.NOMBA_PRIVATE_KEY?.length);
console.log("PRIVATE_KEY prefix:", process.env.NOMBA_PRIVATE_KEY?.slice(0, 15));
