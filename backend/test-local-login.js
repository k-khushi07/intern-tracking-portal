async function test() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pm@test.com', password: 'password123' })
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
test();
