async function test() {
  const res = await fetch('http://localhost:3001/api?route=auth', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}
test().catch(console.error);