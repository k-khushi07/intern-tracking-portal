#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();

const { adminCreateUser, restInsert } = require("../src/services/supabaseRest");

async function main() {
  const [, , email, password, ...nameParts] = process.argv;
  const fullName = nameParts.join(" ").trim();

  if (!email || !password) {
    console.error("Usage: node scripts/bootstrap-admin.js <email> <password> [full name]");
    process.exit(1);
  }

  const created = await adminCreateUser({
    email,
    password,
    userMetadata: { full_name: fullName },
    appMetadata: { role: "admin" },
  });

  const userId = created?.id || created?.user?.id;
  if (!userId) throw new Error("Unexpected Supabase response (missing user id)");

  await restInsert({
    table: "profiles",
    rows: {
      id: userId,
      email,
      full_name: fullName,
      role: "admin",
      status: "active",
      pm_code: null,
      intern_id: null,
      pm_id: null,
      profile_completed: true,
    },
    accessToken: null,
    useServiceRole: true,
  });

  console.log("Bootstrapped admin:");
  console.log(`- userId: ${userId}`);
  console.log(`- email: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

