// Safe Stripe env validation for local + Vercel (Node 20/22). No imports required.
const requiredAlways = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];
const requiredProdOnly = [
  "STRIPE_WEBHOOK_SECRET", // required for production builds
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
  console.log("✅ Env check passed. Stripe vars present for", vercelEnv ?? "local");
}
