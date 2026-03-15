async function test() {
  // Ensure backend/.env is loaded even when running this script from repo root.
  const path = require("path");
  require("dotenv").config({ path: path.join(__dirname, ".env") });
  try {
    const res = await fetch(process.env.SUPABASE_URL + '/rest/v1/', {
      headers: { apikey: process.env.SUPABASE_ANON_KEY }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch failed!", err.name, err.message, err.cause);
  }
}
test();
