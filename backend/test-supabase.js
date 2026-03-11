const { getSupabaseConfig } = require('./src/services/supabaseRest.js');
const { getProjectRefFromUrl } = require('./src/services/supabaseRest.js'); // Not exported, just fetch instead

async function test() {
  require('dotenv').config();
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
