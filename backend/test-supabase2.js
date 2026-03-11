const { authPasswordGrant } = require('./src/services/supabaseRest.js');
require('dotenv').config();
async function test() {
  try {
    const res = await authPasswordGrant({ email: 'pm@test.com', password: 'password123' });
    console.log("Success:", res);
  } catch(e) {
    console.error("Failed:", e);
  }
}
test();
