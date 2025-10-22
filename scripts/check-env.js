// Environment validation for local + Vercel (Node 20/22). No Stripe required.
const requiredAlways = [
  // Add any required env vars here
  // "DATABASE_URL", // Example
];
const requiredProdOnly = [
  // Add production-only required vars here
];

const vercelEnv = process.env.VERCEL_ENV; // "development" | "preview" | "production" | undefined
const isProd =
  vercelEnv === "production" || process.env.NODE_ENV === "production";

const missing = [];

for (const k of requiredAlways) {
  if (!process.env[k]) missing.push(k);
}
if (isProd) {
  for (const k of requiredProdOnly) {
    if (!process.env[k]) missing.push(k + " (prod required)");
  }
}

if (missing.length) {
  const header = "❌ Missing required environment variables:";
  const list = missing.map((k) => "  - " + k).join("\n");
  const hint =
    vercelEnv && vercelEnv !== "development"
      ? `\n\nDetected Vercel env: ${vercelEnv}. Add these in Vercel → Project → Settings → Environment Variables.`
      : "\n\nAdd these to your local .env.local file.";
  console.error(header + "\n" + list + hint);
  process.exit(1);
} else {
  console.log("✅ Environment check passed for", vercelEnv ?? "local");
}
