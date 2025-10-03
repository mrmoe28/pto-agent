const required = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET"
];

let ok = true;
for (const k of required) {
  if (!process.env[k]) {
    console.error(`❌ Missing ${k} in your env (.env.local on dev, project env on Vercel)`);
    ok = false;
  }
}

if (!ok) process.exit(1);
