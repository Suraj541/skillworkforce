if (process.env.SKILLFORGE_REQUIRE_PRODUCTION_CONFIG !== "true") process.exit(0);

const origin = process.env.SKILLFORGE_APP_ORIGIN;
if (!origin) throw new Error("SKILLFORGE_APP_ORIGIN must be set when SKILLFORGE_REQUIRE_PRODUCTION_CONFIG=true.");
const parsed = new URL(origin);
if (parsed.protocol !== "https:") throw new Error("SKILLFORGE_APP_ORIGIN must use https in required production mode.");
if (process.env.SKILLFORGE_ENABLE_HSTS !== "true") throw new Error("Enable SKILLFORGE_ENABLE_HSTS=true only after HTTPS is guaranteed.");
console.log(`Production configuration accepted for ${parsed.origin}.`);
