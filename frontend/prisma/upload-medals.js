/**
 * Uploads medal images from public/medals/ to Supabase Storage and
 * updates icon_url in the Badges table with the public CDN URLs.
 *
 * Required env vars (in .env.local):
 *   DATABASE_URL          — already set (used to derive Supabase project URL)
 *   SUPABASE_SERVICE_ROLE_KEY — found in Supabase dashboard → Settings → API
 */

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// ── Supabase ──────────────────────────────────────────────────────────────────

function getSupabaseProjectUrl() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const match = dbUrl.match(/db\.([^.]+)\.supabase\.co/);
  if (!match) throw new Error("Could not extract Supabase project ID from DATABASE_URL");
  return `https://${match[1]}.supabase.co`;
}

const SUPABASE_URL = process.env.SUPABASE_URL || getSupabaseProjectUrl();
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "medals";
const MEDALS_DIR = path.join(__dirname, "../public/medals");

if (!SERVICE_KEY) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  console.error("   Find it in: Supabase dashboard → Settings → API → service_role key");
  process.exit(1);
}

async function ensureBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });

  if (!res.ok) {
    const data = await res.json();
    // 409 Duplicate means the bucket already exists — that's fine
    if (data.error !== "Duplicate" && data.statusCode !== "409") {
      throw new Error(`Failed to create bucket: ${JSON.stringify(data)}`);
    }
    console.log(`  Bucket "${BUCKET}" already exists.`);
  } else {
    console.log(`  Created public bucket "${BUCKET}".`);
  }
}

async function uploadFile(filename) {
  const buffer = fs.readFileSync(path.join(MEDALS_DIR, filename));

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Failed to upload ${filename}: ${JSON.stringify(data)}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log(`\nSupabase project: ${SUPABASE_URL}`);
  console.log("Creating/verifying bucket...");
  await ensureBucket();

  const files = fs.readdirSync(MEDALS_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\nUploading ${files.length} medal images...`);

  for (const filename of files) {
    const badgeName = path.basename(filename, ".png");
    const publicUrl = await uploadFile(filename);

    await prisma.badges.updateMany({
      where: { name: badgeName },
      data: { icon_url: publicUrl },
    });

    console.log(`  ✓ ${badgeName} → ${publicUrl}`);
  }

  console.log("\n✅  All medals uploaded and Badges table updated.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
